import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    console.log('🚀 Creating Supabase client with service role...')
    
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
      },
      global: {
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`
        }
      }
    })

    console.log('🔑 Testing service role permissions...')
    
    // Method 1: Try to create a simple table by inserting data and letting Supabase auto-create
    console.log('📋 Attempting to create table via data insertion...')
    
    // First, let's try to query existing table to see if it exists
    try {
      const { data: existingData, error: existingError } = await supabase
        .from('plan_boxes')
        .select('id')
        .limit(1)

      if (!existingError) {
        console.log('✅ Table already exists!')
        return NextResponse.json({
          success: true,
          message: 'Table already exists and is accessible!',
          tableExists: true,
          data: existingData
        })
      }
      
      console.log('❌ Table does not exist:', existingError.message)
    } catch (queryError) {
      console.log('❌ Query failed:', queryError)
    }

    // Method 2: Try to use Supabase SQL via RPC
    console.log('🛠️ Attempting to create table via RPC...')
    
    const createTableSQL = `
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
      
      ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;
      CREATE POLICY IF NOT EXISTS "Allow all for development" ON plan_boxes FOR ALL USING (true) WITH CHECK (true);
    `

    // Try different RPC function names that might exist
    const rpcAttempts = [
      { name: 'exec_sql', params: { sql: createTableSQL } },
      { name: 'execute_sql', params: { sql: createTableSQL } },
      { name: 'run_sql', params: { query: createTableSQL } },
      { name: 'sql', params: { query: createTableSQL } }
    ]

    let rpcSuccess = false
    let rpcResults = []

    for (const attempt of rpcAttempts) {
      try {
        console.log(`🔄 Trying RPC function: ${attempt.name}`)
        const { data: rpcData, error: rpcError } = await supabase.rpc(attempt.name, attempt.params)
        
        if (!rpcError) {
          console.log(`✅ RPC ${attempt.name} succeeded!`)
          rpcSuccess = true
          rpcResults.push({ function: attempt.name, success: true, data: rpcData })
          break
        } else {
          console.log(`❌ RPC ${attempt.name} failed:`, rpcError.message)
          rpcResults.push({ function: attempt.name, success: false, error: rpcError.message })
        }
      } catch (error: any) {
        console.log(`💥 RPC ${attempt.name} threw error:`, error.message)
        rpcResults.push({ function: attempt.name, success: false, error: error.message })
      }
    }

    if (rpcSuccess) {
      // Test the created table
      const { data: testData, error: testError } = await supabase
        .from('plan_boxes')
        .insert({
          title: '테스트 데이터',
          category: 'test'
        })
        .select()

      return NextResponse.json({
        success: true,
        message: 'Table created successfully via RPC!',
        rpcResults,
        testData,
        testError: testError?.message
      })
    }

    // Method 3: Use Management API
    console.log('🔧 Trying Supabase Management API...')
    
    try {
      const managementResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sql',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
          'Accept': 'application/json'
        },
        body: createTableSQL
      })

      const managementResult = await managementResponse.text()
      console.log('Management API response:', managementResult)

      if (managementResponse.ok) {
        return NextResponse.json({
          success: true,
          message: 'Table created via Management API!',
          response: managementResult
        })
      }
    } catch (mgmtError: any) {
      console.log('Management API error:', mgmtError.message)
    }

    // If all methods fail, provide manual instructions
    return NextResponse.json({
      success: false,
      message: 'Automatic table creation failed. Manual setup required.',
      rpcResults,
      sqlToExecute: createTableSQL,
      instructions: [
        '1. Go to https://fsznctkjtakcvjuhrxpx.supabase.co',
        '2. Navigate to SQL Editor',
        '3. Create a new query',
        '4. Paste and execute the provided SQL',
        '5. Test the connection afterward'
      ],
      manualSetupRequired: true
    })

  } catch (error: any) {
    console.log('💥 Setup failed:', error)
    return NextResponse.json({
      success: false,
      message: `Setup failed: ${error?.message || error}`,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      }
    })
  }
}