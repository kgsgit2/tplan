const { chromium } = require('playwright')

const SQL_TO_EXECUTE = `
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

async function autoSetupDatabase() {
  console.log('🚀 Starting automated database setup with Playwright...')
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for demonstration
    slowMo: 1000 // Slow down for visibility
  })
  
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    console.log('🌐 Opening Supabase dashboard...')
    await page.goto('https://fsznctkjtakcvjuhrxpx.supabase.co')
    
    // Wait for page to load
    await page.waitForTimeout(3000)
    
    console.log('🔍 Looking for SQL Editor...')
    
    // Try to find SQL Editor link/button
    const sqlEditorSelectors = [
      '[data-testid="sql-editor"]',
      'text="SQL Editor"',
      '[href*="sql"]',
      '.sidebar-item:has-text("SQL")',
      'nav a:has-text("SQL")',
      '[role="menuitem"]:has-text("SQL")'
    ]
    
    let sqlEditorFound = false
    for (const selector of sqlEditorSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        console.log(`✅ Found SQL Editor with selector: ${selector}`)
        await page.click(selector)
        sqlEditorFound = true
        break
      } catch (e) {
        console.log(`❌ Selector ${selector} not found`)
      }
    }
    
    if (!sqlEditorFound) {
      console.log('⚠️ SQL Editor not found automatically')
      console.log('📝 Please manually navigate to SQL Editor and run this SQL:')
      console.log(SQL_TO_EXECUTE)
      return { success: false, message: 'Manual navigation required' }
    }
    
    // Wait for SQL Editor to load
    await page.waitForTimeout(2000)
    
    console.log('📝 Looking for SQL input area...')
    
    // Try to find the SQL input/textarea
    const sqlInputSelectors = [
      '.monaco-editor textarea',
      '.CodeMirror textarea',
      '[data-testid="sql-input"]',
      'textarea[placeholder*="SQL"]',
      '.sql-editor textarea',
      'textarea'
    ]
    
    let sqlInputFound = false
    for (const selector of sqlInputSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        console.log(`✅ Found SQL input with selector: ${selector}`)
        
        // Clear and fill the SQL
        await page.fill(selector, SQL_TO_EXECUTE)
        sqlInputFound = true
        break
      } catch (e) {
        console.log(`❌ SQL input selector ${selector} not found`)
      }
    }
    
    if (!sqlInputFound) {
      console.log('⚠️ SQL input area not found')
      console.log('📋 Manual input required')
      return { success: false, message: 'Manual SQL input required' }
    }
    
    console.log('🔍 Looking for Run/Execute button...')
    
    // Try to find and click the Run button
    const runButtonSelectors = [
      'button:has-text("Run")',
      'button:has-text("Execute")',
      '[data-testid="run-sql"]',
      '.run-button',
      'button[type="submit"]'
    ]
    
    let runButtonFound = false
    for (const selector of runButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 })
        console.log(`✅ Found Run button with selector: ${selector}`)
        await page.click(selector)
        runButtonFound = true
        break
      } catch (e) {
        console.log(`❌ Run button selector ${selector} not found`)
      }
    }
    
    if (!runButtonFound) {
      console.log('⚠️ Run button not found')
      console.log('▶️ Please manually click the Run button')
      return { success: false, message: 'Manual run required' }
    }
    
    // Wait for execution
    console.log('⏳ Waiting for SQL execution...')
    await page.waitForTimeout(3000)
    
    console.log('✅ SQL execution attempted!')
    console.log('🧪 Browser will stay open for you to verify the result')
    
    // Keep browser open for user to verify
    await page.waitForTimeout(10000)
    
    return { success: true, message: 'SQL executed via automation' }
    
  } catch (error) {
    console.log('💥 Automation error:', error.message)
    console.log('📋 Fallback: Manual setup required')
    console.log('SQL to execute:')
    console.log(SQL_TO_EXECUTE)
    return { success: false, error: error.message }
  } finally {
    await browser.close()
  }
}

// Run the automation
autoSetupDatabase().then(result => {
  console.log('\n🎯 Automation Result:', result.success ? 'SUCCESS' : 'MANUAL SETUP REQUIRED')
  if (!result.success) {
    console.log('\n📝 Manual Setup Instructions:')
    console.log('1. Go to https://fsznctkjtakcvjuhrxpx.supabase.co')
    console.log('2. Click on SQL Editor in the sidebar')
    console.log('3. Create a new query')
    console.log('4. Paste and run the SQL shown above')
  }
}).catch(error => {
  console.log('💥 Script failed:', error.message)
  console.log('\n📋 Manual setup required - execute the SQL manually in Supabase dashboard')
})