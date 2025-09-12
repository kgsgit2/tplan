const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 개발 서버 접속
  await page.goto('http://localhost:3002/planner');
  
  // 페이지 로드 대기
  await page.waitForTimeout(3000);
  
  // 사이드바에서 관광 카테고리 박스 클릭
  const tourismBox = await page.locator('div:has-text("관광").first').first();
  if (await tourismBox.isVisible()) {
    await tourismBox.click();
    console.log('관광 박스 클릭 성공');
  } else {
    // 만약 없다면 새로 생성
    await page.locator('button:has-text("+ 새 계획")').click();
    await page.waitForTimeout(500);
  }
  
  // 모달이 열릴 때까지 대기
  await page.waitForSelector('div[style*="position: fixed"]', { timeout: 5000 });
  
  // 스크린샷 캡처
  await page.screenshot({ 
    path: 'modal-screenshot-tourism.png',
    fullPage: false 
  });
  console.log('관광 모달 스크린샷 저장: modal-screenshot-tourism.png');
  
  // ESC로 모달 닫기
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  
  // 이동 카테고리 테스트
  const transportBox = await page.locator('div:has-text("이동")').first();
  if (await transportBox.isVisible()) {
    await transportBox.click();
    console.log('이동 박스 클릭 성공');
    
    await page.waitForSelector('div[style*="position: fixed"]', { timeout: 5000 });
    await page.screenshot({ 
      path: 'modal-screenshot-transport.png',
      fullPage: false 
    });
    console.log('이동 모달 스크린샷 저장: modal-screenshot-transport.png');
  }
  
  await page.waitForTimeout(2000);
  await browser.close();
})();