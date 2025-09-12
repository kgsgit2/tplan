import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    console.log('🚀 Creating tables directly via Supabase API...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase environment variables'
      })
    }

    // Create admin client with service role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🔑 Using service role key for admin operations...')

    // Method 1: Direct SQL execution via PostgREST
    const sqlStatements = [
      // Enable extensions
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
      
      // Create simple plan_boxes table first
      `CREATE TABLE IF NOT EXISTS plan_boxes (
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
      );`,
      
      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_plan_boxes_category ON plan_boxes(category);`,
      `CREATE INDEX IF NOT EXISTS idx_plan_boxes_created_at ON plan_boxes(created_at);`,
      
      // Enable RLS and create permissive policy for development
      `ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;`,
      `CREATE POLICY IF NOT EXISTS "Allow all operations for development" ON plan_boxes FOR ALL USING (true) WITH CHECK (true);`,
      
      // Grant permissions
      `GRANT ALL ON plan_boxes TO anon, authenticated;`,
      `GRANT USAGE ON SCHEMA public TO anon, authenticated;`,
    ]

    const results = []
    let successCount = 0

    // Execute each SQL statement via REST API
    for (const [index, sql] of sqlStatements.entries()) {
      console.log(`📋 Executing statement ${index + 1}/${sqlStatements.length}...`)
      
      try {
        // Method: Direct HTTP request to Supabase REST API with SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ sql: sql.trim() })
        })

        if (response.ok) {
          console.log(`✅ Statement ${index + 1} executed successfully`)
          successCount++
          results.push({ statement: index + 1, success: true, sql: sql.substring(0, 50) + '...' })
        } else {
          const error = await response.text()
          console.log(`❌ Statement ${index + 1} failed:`, error)
          results.push({ statement: index + 1, success: false, error, sql: sql.substring(0, 50) + '...' })
          
          // Continue with next statement
        }
      } catch (error: any) {
        console.log(`💥 Error executing statement ${index + 1}:`, error?.message)
        results.push({ statement: index + 1, success: false, error: error?.message, sql: sql.substring(0, 50) + '...' })
      }
    }

    // Test if table was created by trying to insert data
    console.log('🧪 Testing table creation by inserting sample data...')
    
    const { data: insertData, error: insertError } = await supabase
      .from('plan_boxes')
      .insert({
        title: '테스트 플랜',
        category: 'test',
        duration_hour: 1,
        memo: 'DB 테스트용 데이터'
      })
      .select()

    if (insertError) {
      console.log('❌ Insert test failed:', insertError)
      
      // Try alternative: Use direct database URL with SQL
      return NextResponse.json({
        success: false,
        message: 'Table creation via REST API failed. Please execute SQL manually.',
        results,
        successCount,
        totalStatements: sqlStatements.length,
        insertError: insertError.message,
        manualSQL: sqlStatements.join('\n\n'),
        instructions: [
          '1. Go to Supabase Dashboard → SQL Editor',
          '2. Paste and run this SQL:',
          'CREATE TABLE plan_boxes (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  title TEXT NOT NULL,\n  category TEXT NOT NULL,\n  duration_hour INTEGER DEFAULT 1,\n  memo TEXT\n);',
          '3. Enable RLS: ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;',
          '4. Create policy: CREATE POLICY "dev_policy" ON plan_boxes FOR ALL USING (true);'
        ]
      })
    }

    console.log('🎉 Success! Table created and data inserted')
    
    // Insert more sample data
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

    const { data: sampleInsertData, error: sampleInsertError } = await supabase
      .from('plan_boxes')
      .insert(sampleData)
      .select()

    if (sampleInsertError) {
      console.log('⚠️ Sample data insertion failed:', sampleInsertError)
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully!',
      details: {
        tablesCreated: successCount > 0,
        sqlStatementsExecuted: successCount,
        totalStatements: sqlStatements.length,
        testDataInserted: !insertError,
        sampleDataInserted: !sampleInsertError,
        insertedRecords: insertData ? [insertData] : [],
        sampleRecords: sampleInsertData || []
      },
      results
    })

  } catch (error: any) {
    console.log('💥 Setup failed:', error)
    return NextResponse.json({
      success: false,
      message: `Database setup failed: ${error?.message || error}`,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      }
    })
  }
}