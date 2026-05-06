import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ──────────────────────────────────────────────────────────
// المفتاح يُقرأ من env على السيرفر فقط — لا يصل للفرونت إند أبدًا
// ──────────────────────────────────────────────────────────
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YT_BASE = 'https://www.googleapis.com/youtube/v3';

// ──────────────────────────────────────────────────────────
// تحليل الإدخال: رابط URL أو هاندل (@handle) أو channel ID (UCxxx)
// ──────────────────────────────────────────────────────────
function parseChannelInput(raw: string): { type: 'id' | 'handle'; value: string } {
  const input = raw.trim();

  // معرف مباشر: يبدأ بـ UC وطوله 24 حرفًا
  if (/^UC[\w-]{22}$/.test(input)) {
    return { type: 'id', value: input };
  }

  // هاندل مباشر بدون رابط
  if (input.startsWith('@')) {
    return { type: 'handle', value: input.slice(1) };
  }

  // رابط يوتيوب — نستخرج منه المعرف أو الهاندل
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    const parts = url.pathname.split('/').filter(Boolean);

    // youtube.com/channel/UCxxx
    if (parts[0] === 'channel' && parts[1]) {
      return { type: 'id', value: parts[1] };
    }

    // youtube.com/@handle
    if (parts[0]?.startsWith('@')) {
      return { type: 'handle', value: parts[0].slice(1) };
    }

    // youtube.com/c/customName أو youtube.com/customName
    const handle = parts[0] === 'c' ? parts[1] : parts[0];
    if (handle) return { type: 'handle', value: handle };
  } catch {
    // ليس رابطًا صحيحًا
  }

  // افتراضي: نعامله كهاندل
  return { type: 'handle', value: input.replace('@', '') };
}

// ──────────────────────────────────────────────────────────
// جلب بيانات القناة من YouTube Data API v3
// ──────────────────────────────────────────────────────────
interface ChannelInfo {
  channelId: string;
  channelTitle: string;
  uploadsPlaylistId: string;
}

async function resolveChannel(channelInput: string): Promise<ChannelInfo | null> {
  const parsed = parseChannelInput(channelInput);

  const params = new URLSearchParams({
    part: 'contentDetails,snippet',
    key: YOUTUBE_API_KEY!,
  });

  if (parsed.type === 'id') {
    params.set('id', parsed.value);
  } else {
    params.set('forHandle', parsed.value);
  }

  const res = await fetch(`${YT_BASE}/channels?${params}`, { cache: 'no-store' });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `YouTube API error: ${res.status}`);
  }

  const data = await res.json();
  const channel = data.items?.[0];
  if (!channel) return null;

  return {
    channelId: channel.id,
    channelTitle: channel.snippet?.title || '',
    uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || '',
  };
}

// ──────────────────────────────────────────────────────────
// جلب كل فيديوهات قائمة التحميلات مع pagination كاملة
// ──────────────────────────────────────────────────────────
interface VideoItem {
  youtube_video_id: string;
  title_ar: string;
  title_en: string;
  youtube_url: string;
  thumbnail_url: string;
  publish_date: string;
  description_ar: string;
  description_en: string;
}

async function fetchAllPlaylistVideos(uploadsPlaylistId: string): Promise<VideoItem[]> {
  const videos: VideoItem[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: '50',
      key: YOUTUBE_API_KEY!,
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`${YT_BASE}/playlistItems?${params}`, { cache: 'no-store' });
    if (!res.ok) break;

    const data = await res.json();

    for (const item of data.items ?? []) {
      const videoId: string = item.snippet?.resourceId?.videoId;
      if (!videoId) continue;

      // نختار أفضل صورة مصغرة متاحة
      const thumb =
        item.snippet?.thumbnails?.maxres?.url ||
        item.snippet?.thumbnails?.standard?.url ||
        item.snippet?.thumbnails?.high?.url ||
        `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

      // Remove null bytes that cause PostgreSQL JSON parser to crash
      const title: string = (item.snippet?.title || '').replace(/\0/g, '');
      const description: string = (item.snippet?.description || '').replace(/\0/g, '');

      videos.push({
        youtube_video_id: videoId,
        title_ar: title,
        title_en: title,
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: thumb,
        publish_date: item.snippet?.publishedAt || new Date().toISOString(),
        description_ar: description.slice(0, 500),
        description_en: description.slice(0, 500),
      });
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return videos;
}

// ──────────────────────────────────────────────────────────
// POST /api/youtube/sync
// Body: { channelInput: string }
// ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── التحقق من تهيئة API Key ──
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json(
        { error: 'YouTube API غير مهيأ — يرجى إضافة YOUTUBE_API_KEY في .env.local' },
        { status: 500 }
      );
    }

    // ── التحقق من المستخدم ──
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح — يجب تسجيل الدخول' }, { status: 401 });
    }

    // ── التحقق من الصلاحية (admin أو publisher) ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'publisher'].includes(profile.role)) {
      return NextResponse.json({ error: 'غير مصرح — الأدمن فقط يمكنه المزامنة' }, { status: 403 });
    }

    // ── قراءة الطلب ──
    const body = await req.json();
    const channelInput: string = body?.channelInput?.trim() || '';

    if (!channelInput) {
      return NextResponse.json(
        { error: 'يرجى إدخال رابط القناة أو معرفها' },
        { status: 400 }
      );
    }

    // ── فحص الكاش: هل القناة محفوظة مسبقًا؟ ──
    const { data: cachedChannel } = await supabase
      .from('youtube_channels')
      .select('uploads_playlist_id, channel_title, last_synced_at')
      .eq('admin_id', user.id)
      .eq('channel_input', channelInput)
      .maybeSingle();

    let uploadsPlaylistId = cachedChannel?.uploads_playlist_id as string | undefined;
    let channelTitle = cachedChannel?.channel_title as string | undefined;

    // ── إذا لم تكن القناة محفوظة، نحلّها من YouTube API ──
    if (!uploadsPlaylistId) {
      const resolved = await resolveChannel(channelInput);

      if (!resolved) {
        return NextResponse.json(
          { error: 'تعذّر العثور على القناة — تحقق من الرابط أو المعرف' },
          { status: 404 }
        );
      }

      uploadsPlaylistId = resolved.uploadsPlaylistId;
      channelTitle = resolved.channelTitle;

      // حفظ القناة في قاعدة البيانات لتجنب إعادة الحل في المزامنات القادمة
      await supabase.from('youtube_channels').upsert(
        {
          admin_id: user.id,
          channel_input: channelInput,
          channel_id: resolved.channelId,
          channel_title: resolved.channelTitle,
          uploads_playlist_id: resolved.uploadsPlaylistId,
        },
        { onConflict: 'admin_id,channel_input' }
      );
    }

    // ── جلب كل الفيديوهات من يوتيوب ──
    const fetchedVideos = await fetchAllPlaylistVideos(uploadsPlaylistId);

    if (fetchedVideos.length === 0) {
      return NextResponse.json({ added: 0, total: 0, channelTitle });
    }

    // ── فحص التكرار: جلب الـ IDs الموجودة مسبقًا لهذا الأدمن ──
    const { data: existingRows } = await supabase
      .from('videos')
      .select('youtube_video_id')
      .eq('author_id', user.id)
      .not('youtube_video_id', 'is', null);

    const existingIds = new Set(
      (existingRows ?? []).map((r: { youtube_video_id: string }) => r.youtube_video_id)
    );

    const newVideos = fetchedVideos.filter((v) => !existingIds.has(v.youtube_video_id));

    // ── إدراج الفيديوهات الجديدة فقط ──
    if (newVideos.length > 0) {
      const { error: insertError } = await supabase.from('videos').insert(
        newVideos.map((v) => ({ ...v, author_id: user.id }))
      );

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: 'فشل حفظ الفيديوهات: ' + insertError.message },
          { status: 500 }
        );
      }
    }

    // ── تحديث وقت آخر مزامنة ──
    await supabase
      .from('youtube_channels')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('admin_id', user.id)
      .eq('channel_input', channelInput);

    return NextResponse.json({
      added: newVideos.length,
      total: fetchedVideos.length,
      channelTitle,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    console.error('YouTube sync error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────
// GET /api/youtube/sync  — جلب قنوات الأدمن المحفوظة
// ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { data: channels, error } = await supabase
      .from('youtube_channels')
      .select('id, channel_input, channel_title, last_synced_at, created_at')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ channels: channels ?? [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────
// DELETE /api/youtube/sync  — حذف قناة من القائمة
// Body: { channelId: string }  (id في جدول youtube_channels)
// ──────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { channelId } = await req.json();
    if (!channelId) {
      return NextResponse.json({ error: 'channelId مطلوب' }, { status: 400 });
    }

    // RLS تضمن أن الأدمن لا يحذف إلا قنواته
    const { error } = await supabase
      .from('youtube_channels')
      .delete()
      .eq('id', channelId)
      .eq('admin_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
