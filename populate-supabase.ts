import { createClient } from '@supabase/supabase-js';
import { products, services, vendors } from './src/lib/musa-data.ts';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://mozrlbmchwuggjauewoo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_zVnmI_eqnA76-FqMZ6m0pg_Cr-BCdKN';

const supabase = createClient(supabaseUrl, supabaseKey);

async function populate() {
  console.log("Populating products...");
  const { error: pErr } = await supabase.from('products').insert(products);
  if (pErr) console.error("Error products:", pErr.message);
  else console.log("Products populated.");

  console.log("Populating services...");
  const { error: sErr } = await supabase.from('services').insert(services);
  if (sErr) console.error("Error services:", sErr.message);
  else console.log("Services populated.");

  console.log("Populating vendors into vendor_subscriptions...");
  // Mapping vendors to vendor_subscriptions format (approximate)
  const mappedVendors = vendors.map(v => ({
    serial_id: `MUSA-VEND-${v.id}`,
    full_name: v.name,
    business_name: v.name,
    phone: "999999999", // mock
    plan: "basic",
    status: "active"
  }));
  const { error: vErr } = await supabase.from('vendor_subscriptions').insert(mappedVendors);
  if (vErr) console.error("Error vendor_subscriptions:", vErr.message);
  else console.log("Vendors populated.");
}

populate();
