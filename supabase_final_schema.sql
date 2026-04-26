-- ==========================================
-- منصة شبهات - مخطط قاعدة البيانات الشامل للإدارة والأعضاء
-- ==========================================

-- تحذير مهم:
-- الأسطر التالية كانت تمسح الجداول (DROP TABLE) بالكامل.
-- لا تُشغّلها على قاعدة بيانات فيها بيانات إنتاج/تجربة لأن هذا سيحذف كل البيانات.
-- إذا كنت تريد "تنصيب جديد" على قاعدة فارغة فقط، يمكنك فك التعليق يدويًا.
-- DROP TABLE IF EXISTS doubt_tags CASCADE;
-- DROP TABLE IF EXISTS doubts CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS tags CASCADE;
-- DROP TABLE IF EXISTS books CASCADE;
-- DROP TABLE IF EXISTS videos CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ==========================================
-- 1. جدول الملفات الشخصية (Profiles)
-- يرتبط بالجدول الافتراضي الخاص بتسجيل الدخول في Supabase (auth.users)
-- ==========================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'publisher')), -- user = مستخدم عادي, admin/publisher = يستطيع النشر
  username TEXT,
  email TEXT,
  display_name_ar TEXT,
  display_name_en TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false, -- للحصول على علامة الصح الزرقاء (التوثيق)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- منع تكرار اليوزرنيم (غير حساس لحالة الحروف)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
ON public.profiles (lower(username))
WHERE username IS NOT NULL;

-- إعداد Trigger لإنشاء ملف شخصي تلقائياً عند تسجيل أي مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, display_name_ar, display_name_en)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 2. جدول التصنيفات (Categories) (يدار بواسطة مدير عام فقط)
-- ==========================================
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon_name TEXT, 
  description_ar TEXT,
  description_en TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. جدول الشبهات والردود (Doubts)
-- ==========================================
CREATE TABLE doubts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- الناشر
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt_ar TEXT,
  excerpt_en TEXT,
  content_ar TEXT NOT NULL, 
  content_en TEXT NOT NULL,
  video_url TEXT, -- رابط فيديو توضيحي اختياري (لن يظهر في قسم الفيديوهات العام)
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 4. جدول الكتب (Books)
-- ==========================================
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- الناشر
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  book_author_ar TEXT NOT NULL, -- مؤلف الكتاب الأصلي
  book_author_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  cover_url TEXT NOT NULL,
  download_url TEXT NOT NULL,
  pages_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 5. جدول الفيديوهات المرئية (Videos) (للقسم العام)
-- ==========================================
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- الناشر
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  duration TEXT, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- نظام الحماية RLS (Row Level Security) الشامل والمتقدم
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE doubts ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- الجميع يمكنه قراءة المحتوى
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read doubts" ON doubts FOR SELECT USING (true);
CREATE POLICY "Public read books" ON books FOR SELECT USING (true);
CREATE POLICY "Public read videos" ON videos FOR SELECT USING (true);

-- سياسات الإضافة والتعديل والحذف (فقط الـ Admin للمحتوى الخاص به)
-- لاحظ: الإدمن يستطيع التعديل فقط عندما يكون `author_id` مساوي لمعرف حسابه `auth.uid()`
-- 1. Doubts
CREATE POLICY "Admins can insert doubts" ON doubts FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update own doubts" ON doubts FOR UPDATE USING (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete own doubts" ON doubts FOR DELETE USING (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Books
CREATE POLICY "Admins can insert books" ON books FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update own books" ON books FOR UPDATE USING (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete own books" ON books FOR DELETE USING (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. Videos
CREATE POLICY "Admins can insert videos" ON videos FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update own videos" ON videos FOR UPDATE USING (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete own videos" ON videos FOR DELETE USING (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- إضافة التصنيفات الثابتة
INSERT INTO categories (title_ar, title_en, slug, icon_name) VALUES
('الإسلام والقرآن', 'Islam & Quran', 'islam-quran', 'Book'),
('العلم والمنطق', 'Science & Logic', 'science-logic', 'Microscope'),
('التاريخ والتراث', 'History & Heritage', 'history-heritage', 'Scroll'),
('المرأة والمجتمع', 'Women & Society', 'women-society', 'Users'),
('الإلحاد والمادية', 'Atheism & Materialism', 'atheism', 'CloudRain'),
('الأديان الأخرى', 'Other Religions', 'others', 'Languages');
