-- ==========================================
-- Migration: YouTube Channel Auto-Sync
-- ==========================================
-- شغّل هذا الملف مرة واحدة على قاعدة Supabase بعد إضافة YOUTUBE_API_KEY

-- 1. تعديل جدول الفيديوهات: إضافة أعمدة الفيديوهات المزامَنة من يوتيوب
ALTER TABLE videos ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS publish_date TIMESTAMP WITH TIME ZONE;

-- منع تكرار الفيديو لنفس الأدمن (partial index لأن الإضافة اليدوية لا تملك youtube_video_id)
CREATE UNIQUE INDEX IF NOT EXISTS videos_author_youtube_unique
  ON videos (author_id, youtube_video_id)
  WHERE youtube_video_id IS NOT NULL;

-- ==========================================
-- 2. جدول قنوات يوتيوب (يُخزّن بيانات القناة لكل أدمن لتسريع المزامنة)
-- ==========================================
CREATE TABLE IF NOT EXISTS youtube_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  channel_input TEXT NOT NULL,            -- الإدخال الأصلي (رابط أو معرف أو هاندل)
  channel_id TEXT,                        -- معرف القناة الرسمي (UCxxx)
  channel_title TEXT,                     -- اسم القناة على يوتيوب
  uploads_playlist_id TEXT,              -- معرف قائمة التحميلات (UUxxx) — يُستخدم للـ pagination
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(admin_id, channel_input)
);

-- تفعيل RLS على الجدول الجديد
ALTER TABLE youtube_channels ENABLE ROW LEVEL SECURITY;

-- كل أدمن يرى ويدير قنواته فقط
CREATE POLICY "Admin can select own channels"
  ON youtube_channels FOR SELECT USING (auth.uid() = admin_id);

CREATE POLICY "Admin can insert own channels"
  ON youtube_channels FOR INSERT WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admin can update own channels"
  ON youtube_channels FOR UPDATE USING (auth.uid() = admin_id);

CREATE POLICY "Admin can delete own channels"
  ON youtube_channels FOR DELETE USING (auth.uid() = admin_id);
