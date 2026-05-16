-- ==========================================
-- Migration: Live Streams (Zero-Quota YouTube Scraping)
-- ==========================================
-- شغّل هذا الملف مرة واحدة على قاعدة Supabase

-- 1. جدول البث المباشر
CREATE TABLE IF NOT EXISTS live_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  channel_id TEXT NOT NULL,               -- معرّف القناة الرسمي (UCxxx)
  channel_name TEXT,                      -- اسم القناة للواجهة
  video_id TEXT,                          -- معرّف فيديو البث المباشر الحالي
  title TEXT,                             -- عنوان البث الحالي
  is_active BOOLEAN DEFAULT false,        -- هل البث مستمر؟
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(admin_id, channel_id)            -- قناة واحدة لكل أدمن
);

-- 2. تفعيل RLS
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

-- 3. القراءة العامة (أي زائر يرى البثوث النشطة)
CREATE POLICY "Public read live_streams" ON live_streams FOR SELECT USING (true);

-- 4. الأدمن يدير بثوثه فقط
CREATE POLICY "Admin can insert own live_streams"
  ON live_streams FOR INSERT WITH CHECK (
    auth.uid() = admin_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'publisher'))
  );

CREATE POLICY "Admin can update own live_streams"
  ON live_streams FOR UPDATE USING (
    auth.uid() = admin_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'publisher'))
  );

CREATE POLICY "Admin can delete own live_streams"
  ON live_streams FOR DELETE USING (
    auth.uid() = admin_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'publisher'))
  );

-- 5. تفعيل Supabase Realtime على الجدول (التحديث الفوري للمستخدمين)
ALTER PUBLICATION supabase_realtime ADD TABLE live_streams;
