const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsznctkjtakcvjuhrxpx.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem5jdGtqdGFrY3ZqdWhyeHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY2ODQ2NiwiZXhwIjoyMDczMjQ0NDY2fQ.LE22HM2ndf6nLUki2PpR0H8jnxkoOh8grCZdiuFLeHA'

async function setupDatabase() {
  console.log('🚀 Starting database setup...')
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Check if table exists
    console.log('🔍 Checking if plan_boxes table exists...')
    const { data: existingData, error: existingError } = await supabase
      .from('plan_boxes')
      .select('id')
      .limit(1)

    if (!existingError) {
      console.log('✅ Table already exists!')
      console.log('📊 Sample data:', existingData)
      return { success: true, message: 'Table already exists' }
    }

    console.log('❌ Table does not exist:', existingError.message)
    console.log('📋 Need to create table manually in Supabase dashboard')

    // Show the SQL to execute
    const sqlToExecute = `
-- TPlan Database Setup
CREATE TABLE IF NOT EXISTS plan_boxes (
  id SERIAL PRIMARY KEY,
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
ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for development
CREATE POLICY "Allow all operations" ON plan_boxes 
  FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO plan_boxes (title, category, start_hour, start_minute, duration_hour, duration_minute, has_time_set, location_name, address, memo, estimated_cost) 
VALUES 
  ('경복궁 관람', 'sightseeing', 10, 0, 2, 0, true, '경복궁', '서울특별시 종로구 사직로 161', '한국의 대표적인 궁궐', 3000),
  ('명동 쇼핑', 'shopping', 14, 0, 1, 30, true, '명동', '서울특별시 중구 명동', '서울 중심가 쇼핑', 100000),
  ('점심식사', 'food', 12, 30, 1, 0, true, '전통 한정식집', null, '한식 전문점', 25000);
`

    console.log('\n📝 Execute this SQL in Supabase SQL Editor:')
    console.log('👉 https://fsznctkjtakcvjuhrxpx.supabase.co')
    console.log('\n' + sqlToExecute)

    return { 
      success: false, 
      message: 'Manual setup required',
      sql: sqlToExecute,
      dashboardUrl: 'https://fsznctkjtakcvjuhrxpx.supabase.co'
    }

  } catch (error) {
    console.log('💥 Error:', error.message)
    return { success: false, error: error.message }
  }
}

setupDatabase().then(result => {
  console.log('\n🎯 Setup Result:', result.success ? 'SUCCESS' : 'MANUAL SETUP REQUIRED')
  process.exit(result.success ? 0 : 1)
})