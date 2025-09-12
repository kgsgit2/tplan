
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://fsznctkjtakcvjuhrxpx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem5jdGtqdGFrY3ZqdWhyeHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY2ODQ2NiwiZXhwIjoyMDczMjQ0NDY2fQ.LE22HM2ndf6nLUki2PpR0H8jnxkoOh8grCZdiuFLeHA';

async function initDatabase() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('🚀 Initializing database...');

  // Test if table exists by trying to query it
  const { data, error } = await supabase
    .from('plan_boxes')
    .select('id')
    .limit(1);

  if (!error) {
    console.log('✅ Table already exists!');
    const { count } = await supabase
      .from('plan_boxes')
      .select('*', { count: 'exact', head: true });
    console.log(`📊 Current record count: ${count}`);
    return;
  }

  console.log('❌ Table does not exist:', error.message);
  console.log('\n⚠️ Please create the table manually in Supabase Dashboard');
  console.log('🔗 Dashboard URL: https://supabase.com/dashboard/project/fsznctkjtakcvjuhrxpx/sql');
  
  // Provide the SQL
  console.log('\n📋 SQL to execute:');
  console.log(`
CREATE TABLE public.plan_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  start_hour INTEGER,
  start_minute INTEGER,
  duration_hour INTEGER DEFAULT 1,
  duration_minute INTEGER DEFAULT 0,
  has_time_set BOOLEAN DEFAULT false,
  memo TEXT,
  location_name TEXT,
  address TEXT,
  phone TEXT,
  estimated_cost DECIMAL(10,2),
  transport_mode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plan_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for dev" ON public.plan_boxes 
FOR ALL USING (true) WITH CHECK (true);
  `);
}

initDatabase().catch(console.error);
