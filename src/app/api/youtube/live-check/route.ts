import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// ──────────────────────────────────────────────────────────
// POST /api/youtube/live-check
// Body: { channelId: string, channelName?: string }
// 
// الطريقة الذكية: بدلاً من استخدام YouTube API (100 وحدة كوتا)
// نعمل fetch عادي لصفحة القناة ونبحث عن "isLive":true
// التكلفة: صفر وحدة من كوتا يوتيوب!
// ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── التحقق من المستخدم والصلاحية ──
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح — يجب تسجيل الدخول' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || !['admin', 'publisher'].includes(profile.role)) {
      return NextResponse.json({ error: 'غير مصرح — الأدمن فقط' }, { status: 403 });
    }

    // ── قراءة الطلب ──
    const body = await req.json();
    const channelId: string = body?.channelId?.trim() || '';
    const channelName: string = body?.channelName?.trim() || '';

    if (!channelId) {
      return NextResponse.json(
        { error: 'يرجى إدخال معرّف القناة (channel_id)' },
        { status: 400 }
      );
    }

    // ── فحص البث المباشر بدون API (Scraping ذكي) ──
    let isLive = false;
    let liveVideoId: string | null = null;
    let liveTitle: string | null = null;

    try {
      const response = await fetch(
        `https://www.youtube.com/channel/${channelId}/live`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          cache: 'no-store',
        }
      );

      if (response.ok) {
        const html = await response.text();
        
        // يوتيوب يحط هذا الكود لو القناة لايف فعلاً
        isLive = html.includes('"isLive":true');
        
        if (isLive) {
          // استخراج الـ video ID من الصفحة
          const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          if (videoIdMatch) {
            liveVideoId = videoIdMatch[1];
          }
          
          // استخراج عنوان البث
          const titleMatch = html.match(/"title":"([^"]+)"/);
          if (titleMatch) {
            liveTitle = decodeUnicode(titleMatch[1]);
          }
        }
      }
    } catch (fetchErr) {
      console.error('YouTube scrape error:', fetchErr);
      // لا نُفشل الطلب — ببساطة نعتبر أنه مش لايف
    }

    // ── تحديث قاعدة البيانات (UPSERT) ──
    const { error: upsertError } = await supabase
      .from('live_streams')
      .upsert(
        {
          admin_id: user.id,
          channel_id: channelId,
          channel_name: channelName || null,
          video_id: liveVideoId,
          title: liveTitle,
          is_active: isLive,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'admin_id,channel_id' }
      );

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      isLive,
      videoId: liveVideoId,
      title: liveTitle,
      channelId,
      channelName,
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    console.error('Live check error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────
// GET /api/youtube/live-check — جلب كل البثوث النشطة (للصفحة العامة)
// ──────────────────────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: streams, error } = await supabase
      .from('live_streams')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ streams: streams ?? [] });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────
// DELETE /api/youtube/live-check — إزالة بث من الجدول
// Body: { streamId: string }
// ──────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { streamId } = await req.json();
    if (!streamId) {
      return NextResponse.json({ error: 'streamId مطلوب' }, { status: 400 });
    }

    const { error } = await supabase
      .from('live_streams')
      .delete()
      .eq('id', streamId)
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

// ── Helper: فك ترميز يونيكود من يوتيوب ──
function decodeUnicode(str: string): string {
  try {
    return str.replace(/\\u[\dA-Fa-f]{4}/g, (match) =>
      String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
    );
  } catch {
    return str;
  }
}
