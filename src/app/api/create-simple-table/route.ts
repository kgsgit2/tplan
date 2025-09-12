import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    console.log('🚀 Creating simple plan_boxes table for immediate use...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase environment variables'
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // First, try to insert sample data to see if table exists
    const { data: testData, error: testError } = await supabase
      .from('plan_boxes')
      .select('id')
      .limit(1)

    if (!testError) {
      return NextResponse.json({
        success: true,
        message: 'Tables already exist! Database is ready.',
        tablesFound: true
      })
    }

    // If table doesn't exist, create it via SQL injection through insert
    console.log('📋 Table not found, attempting creation...')
    
    const { data: insertData, error: insertError } = await supabase
      .from('plan_boxes')
      .insert({
        title: 'Test',
        category: 'test'
      })

    if (insertError && insertError.message.includes('relation "plan_boxes" does not exist')) {
      return NextResponse.json({
        success: false,
        message: 'Table does not exist. Please create it manually using the SQL provided.',
        needsManualCreation: true,
        instructions: [
          '1. Go to https://fsznctkjtakcvjuhrxpx.supabase.co',
          '2. Navigate to SQL Editor',
          '3. Run the SQL from /api/execute-sql endpoint',
          '4. Come back and test the connection'
        ]
      })
    }

    // Insert some test data
    const { data, error } = await supabase
      .from('plan_boxes')
      .insert([
        {
          title: '경복궁 관람',
          category: 'sightseeing',
          duration_hour: 2,
          duration_minute: 0,
          memo: '한국의 대표적인 궁궐'
        }
      ])
      .select()

    if (error) {
      console.log('❌ Insert failed:', error)
      return NextResponse.json({
        success: false,
        message: `Insert failed: ${error.message}`,
        error
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Simple table working! Data inserted successfully.',
      data
    })

  } catch (error: any) {
    console.log('💥 Error:', error)
    return NextResponse.json({
      success: false,
      message: `Error: ${error?.message || error}`,
      error: {
        name: error?.name,
        message: error?.message
      }
    })
  }
}