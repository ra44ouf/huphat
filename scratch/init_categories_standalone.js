const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adxqokcmjwhmqpvjtonx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkeHFva2NtandobXFwdmp0b254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDcyNTMsImV4cCI6MjA4ODk4MzI1M30.pVvOlvv0otc1Y2KXdgt_bRV74b-Eru-FiIVVm-vmCsI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function initCategories() {
  console.log('🚀 Starting Category Initialization (Standalone)...');

  const categories = [
    { 
      title_ar: 'رد الإلحاد', 
      title_en: 'Atheism Refutation', 
      slug: 'atheism-refutation', 
      icon_name: 'CloudRain',
      description_ar: 'الرد على الشبهات الإلحادية والمادية المعاصرة بأسلوب علمي ومنطقي.'
    },
    { 
      title_ar: 'شبهات حول القرآن', 
      title_en: 'Quranic Doubts', 
      slug: 'quran-doubts', 
      icon_name: 'Book',
      description_ar: 'الإجابة على الادعاءات المثارة حول القرآن الكريم وعلومه.'
    },
    { 
      title_ar: 'السنة النبوية', 
      title_en: 'Prophetic Sunnah', 
      slug: 'sunnah', 
      icon_name: 'Scroll',
      description_ar: 'الرد على الطعون في حجية السنة النبوية المطهرة وكتب الحديث.'
    },
    { 
      title_ar: 'السيرة النبوية', 
      title_en: 'Prophetic Biography', 
      slug: 'prophetic-biography', 
      icon_name: 'User',
      description_ar: 'تجلية الحقائق حول حياة النبي صلى الله عليه وسلم والرد على الافتراءات المتعلقة بسيرته.'
    },
    { 
      title_ar: 'التشريع الإسلامي', 
      title_en: 'Islamic Legislation', 
      slug: 'islamic-legislation', 
      icon_name: 'Scale',
      description_ar: 'توضيح مقاصد الشريعة والرد على الشبهات المثارة حول الحدود والأحكام الفقهية.'
    },
    { 
      title_ar: 'المرأة في الإسلام', 
      title_en: 'Women in Islam', 
      slug: 'women-in-islam', 
      icon_name: 'Users',
      description_ar: 'بيان تكريم الإسلام للمرأة والرد على دعاوى الانتقاص من حقوقها.'
    },
    { 
      title_ar: 'قضايا فكرية معاصرة', 
      title_en: 'Contemporary Issues', 
      slug: 'contemporary-issues', 
      icon_name: 'Brain',
      description_ar: 'معالجة قضايا العلمانية، الليبرالية، والنزعات الفكرية الحديثة من منظور إسلامي.'
    }
  ];

  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' });
    if (error) {
      console.error(`❌ Error inserting category ${cat.title_ar}:`, error.message);
    } else {
      console.log(`✅ Category [${cat.title_ar}] initialized successfully.`);
    }
  }

  console.log('✨ All Categories initialized!');
}

initCategories();
