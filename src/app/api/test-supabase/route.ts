import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('🔍 Starting Supabase connection test...')
    
    // Environment variables check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('📋 Environment check:')
    console.log('- SUPABASE_URL exists:', !!supabaseUrl)
    console.log('- SUPABASE_ANON_KEY exists:', !!supabaseAnonKey)
    console.log('- URL:', supabaseUrl)
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        }
      })
    }

    // Create Supabase client
    console.log('🔌 Creating Supabase client...')
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Test 1: Basic auth check
    console.log('🔐 Testing auth...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log('❌ Auth error:', authError)
      return NextResponse.json({
        success: false,
        message: `Auth error: ${authError.message}`,
        step: 'auth',
        error: authError
      })
    }
    
    console.log('✅ Auth check passed')

    // Test 2: Try to access plan_boxes table
    console.log('📊 Testing table access...')
    const { data, error } = await supabase
      .from('plan_boxes')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log('⚠️ Table access error:', error)
      
      // Check if it's a "table doesn't exist" error
      if (error.code === 'PGRST116' || error.message.includes('relation "plan_boxes" does not exist')) {
        return NextResponse.json({
          success: true,
          message: 'Supabase connection successful! Table plan_boxes does not exist yet.',
          step: 'table_check',
          needsTable: true,
          connectionOk: true
        })
      }
      
      return NextResponse.json({
        success: false,
        message: `Database error: ${error.message}`,
        step: 'table_access',
        error: error
      })
    }

    console.log('🎉 Full connection successful!')
    return NextResponse.json({
      success: true,
      message: 'Supabase connection and table access successful!',
      data: data,
      connectionOk: true
    })

  } catch (error: any) {
    console.log('💥 Unexpected error:', error)
    return NextResponse.json({
      success: false,
      message: `Unexpected error: ${error?.message || error}`,
      step: 'unexpected',
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      }
    })
  }
}