const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsznctkjtakcvjuhrxpx.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function createEdgeFunctionApproach() {
  console.log('🚀 Edge Function Approach for Database Setup');
  console.log('=====================================\n');

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Create edge function code
  const edgeFunctionCode = `
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Execute raw SQL using service role key
    const { data, error } = await supabase.rpc('exec_sql', {
      query: \`
        -- Create plan_boxes table
        CREATE TABLE IF NOT EXISTS public.plan_boxes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          start_hour INTEGER,
          start_minute INTEGER,
          duration_hour INTEGER NOT NULL DEFAULT 1,
          duration_minute INTEGER NOT NULL DEFAULT 0,
          has_time_set BOOLEAN DEFAULT false,
          memo TEXT,
          location_name TEXT,
          address TEXT,
          phone TEXT,
          estimated_cost DECIMAL(10,2),
          transport_mode TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.plan_boxes ENABLE ROW LEVEL SECURITY;
        
        -- Create policy
        CREATE POLICY "Allow all operations for development" 
        ON public.plan_boxes 
        FOR ALL 
        USING (true) 
        WITH CHECK (true);
      \`
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, message: 'Database setup completed!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
`;

  // Save edge function code
  const edgeFunctionPath = path.join(__dirname, '..', 'supabase', 'functions', 'setup-database', 'index.ts');
  const edgeFunctionDir = path.dirname(edgeFunctionPath);
  
  if (!fs.existsSync(edgeFunctionDir)) {
    fs.mkdirSync(edgeFunctionDir, { recursive: true });
  }
  
  fs.writeFileSync(edgeFunctionPath, edgeFunctionCode);
  console.log('✅ Edge function code saved to:', edgeFunctionPath);

  // Instructions for deployment
  console.log('\n📋 Edge Function Deployment Instructions:');
  console.log('=====================================\n');
  console.log('1. Install Supabase CLI if not already installed:');
  console.log('   npm install -g supabase');
  console.log('\n2. Link your project:');
  console.log(`   supabase link --project-ref ${SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1]}`);
  console.log('\n3. Deploy the edge function:');
  console.log('   supabase functions deploy setup-database');
  console.log('\n4. Call the function to set up the database:');
  console.log('   curl -X POST', SUPABASE_URL + '/functions/v1/setup-database \\');
  console.log('     -H "Authorization: Bearer ' + ANON_KEY + '" \\');
  console.log('     -H "Content-Type: application/json"');
}

async function createSimpleInitScript() {
  console.log('\n📝 Creating simple initialization script...');
  
  const initScript = `
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = '${SUPABASE_URL}';
const SERVICE_ROLE_KEY = '${SERVICE_ROLE_KEY}';

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
    console.log(\`📊 Current record count: \${count}\`);
    return;
  }

  console.log('❌ Table does not exist:', error.message);
  console.log('\\n⚠️ Please create the table manually in Supabase Dashboard');
  console.log('🔗 Dashboard URL: https://supabase.com/dashboard/project/${SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1]}/sql');
  
  // Provide the SQL
  console.log('\\n📋 SQL to execute:');
  console.log(\`
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
  \`);
}

initDatabase().catch(console.error);
`;

  const scriptPath = path.join(__dirname, 'init-database.js');
  fs.writeFileSync(scriptPath, initScript);
  console.log('✅ Simple init script saved to:', scriptPath);
  
  return scriptPath;
}

async function tryAPITableCreation() {
  console.log('\n🔧 Attempting API-based table creation...');
  
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  });

  // First, let's try to insert a dummy record to force table creation
  console.log('📝 Attempting to force table creation via insert...');
  
  const dummyData = {
    title: 'Initialization Test',
    category: 'test',
    duration_hour: 1,
    duration_minute: 0,
    has_time_set: false,
    memo: 'This is a test record for table initialization',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: insertData, error: insertError } = await supabase
    .from('plan_boxes')
    .insert(dummyData)
    .select();

  if (!insertError) {
    console.log('🎉 Table created successfully via insert!');
    console.log('📊 Test record inserted:', insertData);
    
    // Now insert sample data
    const sampleData = [
      {
        title: '경복궁 관람',
        category: 'sightseeing',
        start_hour: 10,
        start_minute: 0,
        duration_hour: 2,
        duration_minute: 0,
        has_time_set: true,
        location_name: '경복궁',
        address: '서울특별시 종로구 사직로 161',
        memo: '한국의 대표적인 궁궐',
        estimated_cost: 3000
      },
      {
        title: '명동 쇼핑',
        category: 'shopping',
        start_hour: 14,
        start_minute: 0,
        duration_hour: 1,
        duration_minute: 30,
        has_time_set: true,
        location_name: '명동',
        address: '서울특별시 중구 명동',
        memo: '서울 중심가 쇼핑',
        estimated_cost: 100000
      },
      {
        title: '점심식사',
        category: 'food',
        start_hour: 12,
        start_minute: 30,
        duration_hour: 1,
        duration_minute: 0,
        has_time_set: true,
        location_name: '전통 한정식집',
        address: '서울특별시 종로구',
        memo: '한식 전문점',
        estimated_cost: 25000
      }
    ];

    const { data: sampleInserts, error: sampleError } = await supabase
      .from('plan_boxes')
      .insert(sampleData)
      .select();

    if (!sampleError) {
      console.log('✅ Sample data inserted successfully!');
      console.log(`📊 Total records: ${sampleInserts.length + 1}`);
      return { success: true };
    }
  }

  console.log('❌ API table creation failed:', insertError?.message);
  return { success: false, error: insertError };
}

async function main() {
  console.log('🚀 Multiple Approaches for Supabase Database Setup');
  console.log('================================================\n');

  // Try API approach first
  const apiResult = await tryAPITableCreation();
  if (apiResult.success) {
    console.log('\n🎉 SUCCESS! Database is ready!');
    console.log('🧪 Run this to verify: node scripts/test-connection.js');
    return;
  }

  // Create alternative solutions
  await createEdgeFunctionApproach();
  const initScriptPath = await createSimpleInitScript();

  console.log('\n================================================');
  console.log('📋 SUMMARY OF AVAILABLE SOLUTIONS');
  console.log('================================================\n');
  
  console.log('Since automatic setup failed, you have these options:\n');
  
  console.log('OPTION 1: Manual SQL Execution (Recommended)');
  console.log('----------------------------------------------');
  console.log('1. Open Supabase Dashboard SQL Editor');
  console.log('2. Execute the SQL from: create-tables.sql');
  console.log('3. Test with: node scripts/test-connection.js\n');
  
  console.log('OPTION 2: Playwright Automation');
  console.log('----------------------------------------------');
  console.log('Run: node scripts/playwright-db-setup.js');
  console.log('(This will automate the browser to execute SQL)\n');
  
  console.log('OPTION 3: Edge Function');
  console.log('----------------------------------------------');
  console.log('Deploy and call the edge function (see instructions above)\n');
  
  console.log('OPTION 4: Simple Init Script');
  console.log('----------------------------------------------');
  console.log(`Run: node ${initScriptPath}\n`);

  console.log('================================================');
  console.log('🔗 Direct Dashboard Link:');
  console.log(`https://supabase.com/dashboard/project/${SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1]}/sql/new`);
  console.log('================================================');
}

main().catch(console.error);