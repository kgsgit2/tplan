const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fsznctkjtakcvjuhrxpx.supabase.co';
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'fsznctkjtakcvjuhrxpx';

const SQL_CONTENT = `
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

-- Enable RLS
ALTER TABLE public.plan_boxes ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations for development" 
ON public.plan_boxes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.plan_boxes TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Insert sample data
INSERT INTO public.plan_boxes 
(title, category, start_hour, start_minute, duration_hour, duration_minute, has_time_set, location_name, address, memo, estimated_cost) 
VALUES 
('경복궁 관람', 'sightseeing', 10, 0, 2, 0, true, '경복궁', '서울특별시 종로구 사직로 161', '한국의 대표적인 궁궐', 3000),
('명동 쇼핑', 'shopping', 14, 0, 1, 30, true, '명동', '서울특별시 중구 명동', '서울 중심가 쇼핑', 100000),
('점심식사', 'food', 12, 30, 1, 0, true, '전통 한정식집', '서울특별시 종로구', '한식 전문점, 미리 예약 완료', 25000),
('남산타워 방문', 'sightseeing', 16, 30, 2, 0, true, 'N서울타워', '서울특별시 용산구 남산공원길 105', '서울 전경 감상', 15000),
('인사동 전통문화 체험', 'culture', 10, 0, 1, 30, true, '인사동', '서울특별시 종로구 인사동', '전통 공예품과 차 문화', 50000);

-- Return success message
SELECT 'Database setup completed successfully!' as message;
`;

async function setupWithPlaywright() {
  console.log('🎭 Starting Playwright automation for Supabase database setup...');
  console.log('=====================================\n');

  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
    slowMo: 50 // Slow down for visibility
  });

  try {
    const context = await browser.newContext({
      // Accept all permissions
      permissions: ['clipboard-read', 'clipboard-write']
    });
    
    const page = await context.newPage();

    // Navigate to Supabase dashboard
    console.log('📍 Navigating to Supabase dashboard...');
    const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}`;
    await page.goto(dashboardUrl, { waitUntil: 'networkidle' });

    // Check if we need to sign in
    const isSignInPage = await page.url().includes('sign-in') || await page.url().includes('login');
    
    if (isSignInPage) {
      console.log('🔐 Sign-in required. Please log in manually.');
      console.log('⏸️  Waiting for manual login...');
      console.log('📌 Once logged in, the script will continue automatically.');
      
      // Wait for navigation away from sign-in page
      await page.waitForURL((url) => !url.includes('sign-in') && !url.includes('login'), {
        timeout: 300000 // 5 minutes timeout for manual login
      });
      
      console.log('✅ Login successful!');
    }

    // Navigate to SQL Editor
    console.log('🗄️ Navigating to SQL Editor...');
    const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
    await page.goto(sqlEditorUrl, { waitUntil: 'networkidle' });

    // Wait for SQL editor to load
    await page.waitForSelector('[data-monaco-editor]', { timeout: 30000 }).catch(() => {
      console.log('⚠️ Monaco editor not found, trying alternative selectors...');
    });

    // Try different methods to input SQL
    console.log('📝 Inserting SQL code...');
    
    // Method 1: Try to find the Monaco editor
    const monacoEditor = await page.$('[data-monaco-editor]');
    if (monacoEditor) {
      await monacoEditor.click();
      // Clear existing content
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      // Type the SQL content
      await page.keyboard.type(SQL_CONTENT);
    } else {
      // Method 2: Try to find a textarea or contenteditable element
      const textArea = await page.$('textarea') || await page.$('[contenteditable="true"]');
      if (textArea) {
        await textArea.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.press('Delete');
        await page.keyboard.type(SQL_CONTENT);
      } else {
        // Method 3: Use page.evaluate to set content directly
        await page.evaluate((sql) => {
          const editor = document.querySelector('.monaco-editor') || 
                         document.querySelector('[data-monaco-editor]') ||
                         document.querySelector('textarea');
          if (editor) {
            if (editor.tagName === 'TEXTAREA') {
              editor.value = sql;
            } else {
              // For Monaco editor, try to access the model
              if (window.monaco && window.monaco.editor) {
                const editors = window.monaco.editor.getEditors();
                if (editors && editors.length > 0) {
                  editors[0].setValue(sql);
                }
              }
            }
          }
        }, SQL_CONTENT);
      }
    }

    console.log('✅ SQL code inserted!');

    // Find and click the Run button
    console.log('🚀 Looking for Run button...');
    
    // Try different selectors for the Run button
    const runButtonSelectors = [
      'button:has-text("Run")',
      'button:has-text("Execute")',
      'button:has-text("RUN")',
      '[data-testid="run-sql-button"]',
      'button[type="submit"]'
    ];

    let runButton = null;
    for (const selector of runButtonSelectors) {
      runButton = await page.$(selector);
      if (runButton) break;
    }

    if (runButton) {
      console.log('▶️ Clicking Run button...');
      await runButton.click();
      
      // Wait for execution to complete
      await page.waitForTimeout(5000);
      
      console.log('✅ SQL executed!');
      
      // Check for success or error messages
      const successMessage = await page.$('text=/success/i') || await page.$('text=/completed/i');
      const errorMessage = await page.$('text=/error/i') || await page.$('.error');
      
      if (successMessage) {
        console.log('🎉 Database setup completed successfully!');
      } else if (errorMessage) {
        const errorText = await errorMessage.textContent();
        console.log('❌ Error occurred:', errorText);
      } else {
        console.log('⚠️ Execution completed (status unknown)');
      }
    } else {
      console.log('❌ Could not find Run button');
      console.log('📌 Please run the SQL manually in the open browser window');
    }

    console.log('\n📸 Taking screenshot for verification...');
    await page.screenshot({ path: path.join(__dirname, '..', 'playwright-result.png'), fullPage: true });
    console.log('📷 Screenshot saved as: playwright-result.png');

    // Keep browser open for manual verification
    console.log('\n⏸️  Browser will remain open for 30 seconds for verification...');
    console.log('📌 You can check the results manually');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Automation failed:', error.message);
    console.log('\n📋 Manual steps:');
    console.log('1. The browser window is open at the Supabase dashboard');
    console.log('2. Navigate to SQL Editor if not already there');
    console.log('3. Paste and run the SQL from: create-tables.sql');
  } finally {
    await browser.close();
    console.log('\n🔒 Browser closed');
  }
}

async function main() {
  console.log('🚀 Playwright Database Setup for TPlan');
  console.log('=====================================\n');
  
  console.log('⚠️ IMPORTANT: This will open a browser window');
  console.log('📌 You may need to log in to Supabase manually\n');
  
  try {
    await setupWithPlaywright();
    
    // Test the connection
    console.log('\n🧪 Testing database connection...');
    const { exec } = require('child_process');
    exec('node scripts/test-connection.js', (error, stdout, stderr) => {
      console.log(stdout);
      if (error) {
        console.error('Test failed:', stderr);
      }
    });
    
  } catch (error) {
    console.error('💥 Setup failed:', error.message);
    console.log('\n📋 Please set up the database manually:');
    console.log('1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql');
    console.log('2. Execute the SQL from: create-tables.sql');
    console.log('3. Test with: node scripts/test-connection.js');
  }
}

// Check if Playwright is installed
try {
  require('playwright');
  main();
} catch (error) {
  console.log('📦 Playwright not found. Installing...');
  const { execSync } = require('child_process');
  execSync('npm install playwright', { stdio: 'inherit' });
  console.log('✅ Playwright installed. Please run this script again.');
}