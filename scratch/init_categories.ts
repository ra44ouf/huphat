import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function initCategories() {
  console.log('🚀 Starting Category Initialization...')

  // 1. Delete existing categories (Note: will fail if doubts/books/videos refer to them)
  // We'll try to delete them, but if they are linked, we'll just skip deletion or let it error
  try {
    const { error: delError } = await supabase.from('categories').delete().neq('slug', 'keep-this-empty')
    if (delError) console.log('⚠️ Note: Some categories could not be deleted (likely because they are in use).')
  } catch (e) {}

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
  ]

  for (const cat of categories) {
    const { error } = await supabase.from('categories').upsert(cat, { onConflict: 'slug' })
    if (error) {
      console.error(`❌ Error inserting category ${cat.title_ar}:`, error.message)
    } else {
      console.log(`✅ Category [${cat.title_ar}] initialized successfully.`)
    }
  }

  console.log('✨ All Categories initialized!')
}

initCategories()
