const { Client } = require('pg')
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Database configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsznctkjtakcvjuhrxpx.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem5jdGtqdGFrY3ZqdWhyeHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY2ODQ2NiwiZXhwIjoyMDczMjQ0NDY2fQ.LE22HM2ndf6nLUki2PpR0H8jnxkoOh8grCZdiuFLeHA'

// Extract project reference from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'fsznctkjtakcvjuhrxpx'

// PostgreSQL connection string (Supabase format)
const DATABASE_URL = `postgresql://postgres.${projectRef}:${SERVICE_ROLE_KEY}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
const DIRECT_DATABASE_URL = `postgresql://postgres.${projectRef}:${SERVICE_ROLE_KEY}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`

async function setupWithDirectPostgreSQL() {
  console.log('🚀 Attempting direct PostgreSQL connection...')
  
  const connectionConfigs = [
    {
      name: 'Pooler Connection (Port 6543)',
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Direct Connection (Port 5432)',
      connectionString: DIRECT_DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    },
    {
      name: 'Alternative Format',
      host: `aws-0-ap-northeast-2.pooler.supabase.com`,
      port: 6543,
      database: 'postgres',
      user: `postgres.${projectRef}`,
      password: SERVICE_ROLE_KEY,
      ssl: { rejectUnauthorized: false }
    }
  ]

  for (const config of connectionConfigs) {
    console.log(`\n📡 Trying: ${config.name}`)
    
    const client = new Client(config.connectionString ? 
      { connectionString: config.connectionString, ssl: config.ssl } : 
      config
    )

    try {
      await client.connect()
      console.log('✅ Connected successfully!')

      // Check if table exists
      const checkTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'plan_boxes'
        );
      `)

      if (checkTable.rows[0].exists) {
        console.log('📦 Table already exists!')
        await client.end()
        return { success: true, message: 'Table already exists' }
      }

      // Create table
      console.log('🛠️ Creating plan_boxes table...')
      
      const createTableSQL = `
        -- Enable UUID extension
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_plan_boxes_category ON public.plan_boxes(category);
        CREATE INDEX IF NOT EXISTS idx_plan_boxes_created_at ON public.plan_boxes(created_at);
      `

      await client.query(createTableSQL)
      console.log('✅ Table created successfully!')

      // Enable RLS
      console.log('🔒 Setting up Row Level Security...')
      await client.query('ALTER TABLE public.plan_boxes ENABLE ROW LEVEL SECURITY;')
      
      // Create policy
      await client.query(`
        CREATE POLICY "Allow all operations for development" 
        ON public.plan_boxes 
        FOR ALL 
        USING (true) 
        WITH CHECK (true);
      `)

      // Grant permissions
      await client.query(`
        GRANT ALL ON public.plan_boxes TO anon, authenticated;
        GRANT USAGE ON SCHEMA public TO anon, authenticated;
      `)

      console.log('✅ RLS and permissions configured!')

      // Insert sample data
      console.log('📝 Inserting sample data...')
      
      const insertSQL = `
        INSERT INTO public.plan_boxes 
        (title, category, start_hour, start_minute, duration_hour, duration_minute, has_time_set, location_name, address, memo, estimated_cost) 
        VALUES 
        ('경복궁 관람', 'sightseeing', 10, 0, 2, 0, true, '경복궁', '서울특별시 종로구 사직로 161', '한국의 대표적인 궁궐', 3000),
        ('명동 쇼핑', 'shopping', 14, 0, 1, 30, true, '명동', '서울특별시 중구 명동', '서울 중심가 쇼핑', 100000),
        ('점심식사', 'food', 12, 30, 1, 0, true, '전통 한정식집', '서울특별시 종로구', '한식 전문점, 미리 예약 완료', 25000),
        ('남산타워 방문', 'sightseeing', 16, 30, 2, 0, true, 'N서울타워', '서울특별시 용산구 남산공원길 105', '서울 전경 감상', 15000),
        ('인사동 전통문화 체험', 'culture', 10, 0, 1, 30, true, '인사동', '서울특별시 종로구 인사동', '전통 공예품과 차 문화', 50000);
      `

      await client.query(insertSQL)
      console.log('✅ Sample data inserted!')

      await client.end()
      return { success: true, message: 'Database setup completed successfully!' }

    } catch (error) {
      console.log(`❌ Failed: ${error.message}`)
      try {
        await client.end()
      } catch (e) {}
    }
  }

  return { success: false, message: 'All PostgreSQL connection attempts failed' }
}

async function setupWithSupabaseRPC() {
  console.log('\n🔧 Trying Supabase RPC approach...')
  
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Try to create an RPC function that creates the table
    const { data, error } = await supabase.rpc('create_plan_boxes_table', {})
    
    if (!error) {
      console.log('✅ Table created via RPC!')
      return { success: true, message: 'Table created via RPC' }
    }
    
    console.log('❌ RPC failed:', error.message)
  } catch (error) {
    console.log('❌ RPC approach failed:', error.message)
  }

  return { success: false, message: 'RPC approach failed' }
}

async function createRPCFunctionSQL() {
  console.log('\n📝 Generating RPC function SQL...')
  
  const rpcSQL = `
-- Create RPC function to set up the database
CREATE OR REPLACE FUNCTION create_plan_boxes_table()
RETURNS void AS $$
BEGIN
  -- Create table if not exists
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
  CREATE POLICY IF NOT EXISTS "Allow all operations for development" 
  ON public.plan_boxes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

  -- Grant permissions
  GRANT ALL ON public.plan_boxes TO anon, authenticated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT create_plan_boxes_table();
`

  // Save to file
  const filePath = path.join(__dirname, '..', 'create-rpc-function.sql')
  fs.writeFileSync(filePath, rpcSQL)
  
  console.log('✅ RPC function SQL saved to: create-rpc-function.sql')
  return rpcSQL
}

async function main() {
  console.log('🚀 Advanced Database Setup for TPlan')
  console.log('=====================================\n')

  // Try direct PostgreSQL connection first
  const pgResult = await setupWithDirectPostgreSQL()
  if (pgResult.success) {
    console.log('\n🎉 SUCCESS! Database is ready!')
    
    // Test the connection
    console.log('\n🧪 Testing the setup...')
    const { exec } = require('child_process')
    exec('node scripts/test-connection.js', (error, stdout, stderr) => {
      console.log(stdout)
      if (error) console.error(stderr)
    })
    
    return
  }

  // Try RPC approach
  const rpcResult = await setupWithSupabaseRPC()
  if (rpcResult.success) {
    console.log('\n🎉 SUCCESS! Database is ready!')
    return
  }

  // Generate manual SQL files
  console.log('\n📋 Generating manual setup files...')
  
  const manualSQL = fs.readFileSync(path.join(__dirname, '..', 'create-tables.sql'), 'utf8')
  const rpcSQL = await createRPCFunctionSQL()
  
  console.log('\n' + '='.repeat(60))
  console.log('⚠️  MANUAL SETUP REQUIRED')
  console.log('='.repeat(60))
  console.log('\n📌 All automated methods failed. Please follow these steps:\n')
  console.log('1. Open Supabase Dashboard:')
  console.log(`   🔗 https://supabase.com/dashboard/project/${projectRef}`)
  console.log('\n2. Go to SQL Editor')
  console.log('\n3. Execute ONE of these SQL files:')
  console.log('   - create-tables.sql (Direct table creation)')
  console.log('   - create-rpc-function.sql (RPC function approach)')
  console.log('\n4. After execution, test with:')
  console.log('   node scripts/test-connection.js')
  console.log('\n' + '='.repeat(60))
  
  // Try to open browser automatically
  console.log('\n🌐 Attempting to open Supabase Dashboard...')
  const { exec } = require('child_process')
  const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`
  
  if (process.platform === 'win32') {
    exec(`start ${dashboardUrl}`)
  } else if (process.platform === 'darwin') {
    exec(`open ${dashboardUrl}`)
  } else {
    exec(`xdg-open ${dashboardUrl}`)
  }
}

// Run the setup
main().catch(error => {
  console.error('💥 Setup failed:', error)
  process.exit(1)
})