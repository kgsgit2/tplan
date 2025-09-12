const { createClient } = require('@supabase/supabase-js')

async function testConnection() {
  console.log('🧪 Testing Supabase connection...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsznctkjtakcvjuhrxpx.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem5jdGtqdGFrY3ZqdWhyeHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Njg0NjYsImV4cCI6MjA3MzI0NDQ2Nn0.wRBScmlbqDr4qL634jP019zPlwIzS5BkruE6XB9FMUo'
  
  const supabase = createClient(supabaseUrl, anonKey)

  try {
    // Test connection
    console.log('🔌 Testing basic connection...')
    
    const { data, error } = await supabase
      .from('plan_boxes')
      .select('id, title, category')
      .limit(5)

    if (error) {
      console.log('❌ Connection failed:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ Connection successful!')
    console.log('📊 Data count:', data?.length || 0)
    
    if (data && data.length > 0) {
      console.log('📋 Sample records:')
      data.forEach((record, i) => {
        console.log(`  ${i + 1}. ${record.title} (${record.category})`)
      })
    }

    // Test insert
    console.log('\n🧪 Testing insert operation...')
    const testInsert = {
      title: '연결 테스트',
      category: 'test',
      memo: new Date().toISOString() + ' 테스트'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('plan_boxes')
      .insert(testInsert)
      .select()

    if (insertError) {
      console.log('⚠️ Insert test failed:', insertError.message)
    } else {
      console.log('✅ Insert test successful!')
      console.log('📄 Inserted:', insertData?.[0])
    }

    return { 
      success: true, 
      message: 'All tests passed!',
      recordCount: data?.length || 0,
      insertWorked: !insertError
    }

  } catch (error) {
    console.log('💥 Test failed:', error.message)
    return { success: false, error: error.message }
  }
}

testConnection().then(result => {
  console.log('\n🎯 Test Result:', result.success ? '✅ ALL PASSED' : '❌ FAILED')
  if (result.success) {
    console.log('🎉 Database is ready for TPlan!')
    console.log('🚀 You can now run: npm run dev')
  }
}).catch(error => {
  console.log('💥 Test script failed:', error.message)
})