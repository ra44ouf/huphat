require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_schema_info'); // Wait, we might not have RPC.
  // Instead, let's try to fetch a single video and log its keys and types.
  const { data: videos, error: fetchError } = await supabase.from('videos').select('*').limit(1);
  if (fetchError) {
    console.error('Fetch error:', fetchError);
  } else {
    console.log('Video row:', videos[0] ? Object.keys(videos[0]) : 'Empty');
  }
}
checkSchema();
