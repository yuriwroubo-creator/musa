import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mozrlbmchwuggjauewoo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zVnmI_eqnA76-FqMZ6m0pg_Cr-BCdKN';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['profiles', 'vendor_subscriptions', 'products', 'services', 'user_preferences', 'favorites'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('id').limit(1);
    if (error) {
      console.log(`❌ Table '${table}' failed:`, error.message);
    } else {
      console.log(`✅ Table '${table}' responded correctly.`);
    }
  }
}

checkTables();
