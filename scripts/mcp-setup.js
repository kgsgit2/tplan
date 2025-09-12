const { createClient } = require('@supabase/supabase-js')

// MCP를 사용한 Supabase 데이터베이스 설정
async function setupDatabaseWithMCP() {
  console.log('🚀 Setting up database using Supabase MCP...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsznctkjtakcvjuhrxpx.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem5jdGtqdGFrY3ZqdWhyeHB4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY2ODQ2NiwiZXhwIjoyMDczMjQ0NDY2fQ.LE22HM2ndf6nLUki2PpR0H8jnxkoOh8grCZdiuFLeHA'
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Step 1: Check if table exists
    console.log('🔍 Checking existing tables...')
    
    const { data: tables, error: listError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (listError) {
      console.log('⚠️ Cannot list tables:', listError.message)
    } else {
      console.log('📋 Current tables:', tables?.map(t => t.table_name) || [])
    }

    // Step 2: Try to access plan_boxes table
    const { data: existingData, error: existingError } = await supabase
      .from('plan_boxes')
      .select('id, title')
      .limit(3)

    if (!existingError) {
      console.log('✅ Table plan_boxes already exists!')
      console.log('📊 Existing data count:', existingData?.length || 0)
      if (existingData?.length > 0) {
        console.log('Sample records:', existingData)
      }
      return { success: true, message: 'Table exists and accessible' }
    }

    console.log('❌ Table plan_boxes not found:', existingError.message)

    // Step 3: Try MCP approach - Insert data to force table creation
    console.log('🛠️ Attempting to create table through MCP insert...')
    
    // Sometimes Supabase auto-creates tables on first insert
    const testData = {
      title: 'MCP 테스트',
      category: 'test',
      duration_hour: 1,
      memo: 'MCP를 통한 테이블 생성 테스트'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('plan_boxes')
      .insert(testData)
      .select()

    if (!insertError) {
      console.log('🎉 Table created and data inserted via MCP!')
      console.log('📊 Inserted data:', insertData)
      
      // Insert sample data
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
        }
      ]

      const { data: sampleInserts, error: sampleError } = await supabase
        .from('plan_boxes')
        .insert(sampleData)
        .select()

      if (!sampleError) {
        console.log('✅ Sample data inserted!')
        console.log('📊 Total records:', sampleInserts?.length + 1)
      }

      return { success: true, message: 'Table created and populated via MCP!' }
    }

    console.log('❌ MCP insert also failed:', insertError.message)

    // Step 4: Manual creation still required
    console.log('📝 Manual table creation required')
    
    const manualSQL = `
-- Create plan_boxes table
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

-- Create policy
CREATE POLICY "Allow all operations" ON plan_boxes 
  FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO plan_boxes (title, category, start_hour, start_minute, duration_hour, duration_minute, has_time_set, location_name, address, memo, estimated_cost) 
VALUES 
  ('경복궁 관람', 'sightseeing', 10, 0, 2, 0, true, '경복궁', '서울특별시 종로구 사직로 161', '한국의 대표적인 궁궐', 3000),
  ('명동 쇼핑', 'shopping', 14, 0, 1, 30, true, '명동', '서울특별시 중구 명동', '서울 중심가 쇼핑', 100000),
  ('점심식사', 'food', 12, 30, 1, 0, true, '전통 한정식집', null, '한식 전문점', 25000);
`

    console.log('\n👉 Execute this SQL in Supabase Dashboard:')
    console.log('🔗 https://fsznctkjtakcvjuhrxpx.supabase.co')
    console.log('\n' + manualSQL)

    return {
      success: false,
      message: 'Manual setup required',
      sql: manualSQL,
      dashboardUrl: 'https://fsznctkjtakcvjuhrxpx.supabase.co'
    }

  } catch (error) {
    console.log('💥 MCP Setup Error:', error.message)
    return { success: false, error: error.message }
  }
}

// Run the MCP setup
setupDatabaseWithMCP().then(result => {
  console.log('\n🎯 MCP Setup Result:', result.success ? '✅ SUCCESS' : '❌ MANUAL REQUIRED')
  if (result.sql) {
    console.log('\n📝 Next Steps:')
    console.log('1. Open Supabase Dashboard')
    console.log('2. Go to SQL Editor') 
    console.log('3. Execute the SQL above')
    console.log('4. Test with: node scripts/test-connection.js')
  }
}).catch(error => {
  console.log('💥 Setup failed:', error.message)
})