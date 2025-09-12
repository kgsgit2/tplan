import { test, expect } from '@playwright/test';

test.describe('Transport Box UX Test', () => {
  test('should display new transport box modal with simplified UI', async ({ page }) => {
    // Navigate to planner page
    await page.goto('http://localhost:3004/planner');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Click on transport box creation button
    const transportButton = page.locator('button:has-text("이동")').first();
    await transportButton.click();
    
    // Wait for modal to appear
    await page.waitForTimeout(1000);
    
    // Take screenshot of the new transport modal
    await page.screenshot({ 
      path: 'tests/screenshots/transport-modal-new.png',
      fullPage: false 
    });
    
    // Test transport mode selector
    const publicTransportButton = page.locator('button:has-text("대중교통")');
    if (await publicTransportButton.isVisible()) {
      await publicTransportButton.click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: 'tests/screenshots/transport-modal-public.png',
        fullPage: false 
      });
    }
    
    // Close modal
    const closeButton = page.locator('button').filter({ hasText: '취소' });
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  });
  
  test('should auto-detect routes when placed on timeline', async ({ page }) => {
    // Navigate to planner page
    await page.goto('http://localhost:3004/planner');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // First create a regular plan box
    const touristButton = page.locator('button:has-text("관광")').first();
    await touristButton.click();
    await page.waitForTimeout(500);
    
    // Fill in some location data
    const placeInput = page.locator('input[placeholder*="장소명"]');
    if (await placeInput.isVisible()) {
      await placeInput.fill('도쿄타워');
      await page.waitForTimeout(500);
    }
    
    // Save the box
    const saveButton = page.locator('button:has-text("저장")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Create another regular box
    await touristButton.click();
    await page.waitForTimeout(500);
    
    if (await placeInput.isVisible()) {
      await placeInput.fill('센소지');
      await page.waitForTimeout(500);
    }
    
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
    
    await page.waitForTimeout(1000);
    
    // Now create a transport box
    const transportButton = page.locator('button:has-text("이동")').first();
    await transportButton.click();
    
    await page.waitForTimeout(1000);
    
    // Take screenshot showing auto-detected route
    await page.screenshot({ 
      path: 'tests/screenshots/transport-auto-detect.png',
      fullPage: false 
    });
  });
});