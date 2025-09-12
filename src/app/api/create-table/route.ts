import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    console.log('🏗️ Starting table creation...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase environment variables'
      })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // SQL for creating the plan_boxes table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS plan_boxes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        startHour INTEGER,
        startMinute INTEGER,
        durationHour INTEGER NOT NULL DEFAULT 1,
        durationMinute INTEGER NOT NULL DEFAULT 0,
        hasTimeSet BOOLEAN DEFAULT false,
        memo TEXT,
        location TEXT,
        address TEXT,
        phone TEXT,
        cost NUMERIC,
        transportMode TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Create an index for better performance
      CREATE INDEX IF NOT EXISTS idx_plan_boxes_created_at ON plan_boxes(created_at);
    `

    console.log('📝 Executing SQL:', createTableSQL)

    // Try to create the table using rpc or direct SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (error) {
      console.log('❌ RPC failed, trying alternative method...', error)
      
      // Alternative: Try creating via multiple simple queries
      const queries = [
        `CREATE TABLE IF NOT EXISTS plan_boxes (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          startHour INTEGER,
          startMinute INTEGER,
          durationHour INTEGER NOT NULL DEFAULT 1,
          durationMinute INTEGER NOT NULL DEFAULT 0,
          hasTimeSet BOOLEAN DEFAULT false,
          memo TEXT,
          location TEXT,
          address TEXT,
          phone TEXT,
          cost NUMERIC,
          transportMode TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        `CREATE INDEX IF NOT EXISTS idx_plan_boxes_created_at ON plan_boxes(created_at)`
      ]

      // This won't work with anon key, need service_role key for DDL
      return NextResponse.json({
        success: false,
        message: 'Cannot create table with anon key. Need to create manually in Supabase dashboard.',
        sqlProvided: createTableSQL,
        instructions: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Paste the provided SQL',
          '4. Run the query'
        ]
      })
    }

    console.log('✅ Table created successfully!')
    return NextResponse.json({
      success: true,
      message: 'Table plan_boxes created successfully!',
      data: data
    })

  } catch (error: any) {
    console.log('💥 Error creating table:', error)
    return NextResponse.json({
      success: false,
      message: `Error creating table: ${error?.message || error}`,
      error: error
    })
  }
}