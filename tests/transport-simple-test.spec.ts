import { test, expect } from '@playwright/test';

test('이동 박스 경로 계산 간단 테스트', async ({ page }) => {
  console.log('🚀 테스트 시작');
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    console.log('브라우저:', msg.text());
  });
  
  // 1. 플래너 페이지 열기
  await page.goto('http://localhost:3004/planner');
  await page.waitForTimeout(3000);
  console.log('✅ 페이지 로드');
  
  // 초기 스크린샷
  await page.screenshot({ path: 'test-results/simple-1-initial.png', fullPage: true });
  
  // 2. 관광 박스 클릭 (첫 번째 장소)
  console.log('📍 첫 번째 장소: 경복궁');
  await page.locator('div[style*="cursor: pointer"]:has-text("sports_soccer")').first().click();
  await page.waitForTimeout(2000);
  
  // 모달에서 경복궁 입력
  const titleInput = await page.locator('input[type="text"]').first();
  await titleInput.fill('경복궁 관광');
  
  // 장소 검색
  const searchInput = await page.locator('input[placeholder*="장소를 검색"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill('경복궁');
    await page.waitForTimeout(3000);
    
    // 검색 결과 클릭
    const result = await page.locator('div[style*="padding: 10px"]').first();
    if (await result.isVisible()) {
      await result.click();
      console.log('✅ 경복궁 선택');
    }
  }
  
  // 저장
  await page.locator('button:has-text("저장")').click();
  await page.waitForTimeout(2000);
  
  // 경복궁 추가 후 스크린샷
  await page.screenshot({ path: 'test-results/simple-2-gyeongbok.png', fullPage: true });
  
  // 3. 쇼핑 박스 클릭 (두 번째 장소)
  console.log('📍 두 번째 장소: 명동');
  await page.locator('div[style*="cursor: pointer"]:has-text("shopping_bag")').first().click();
  await page.waitForTimeout(2000);
  
  // 모달에서 명동 입력
  const titleInput2 = await page.locator('input[type="text"]').first();
  await titleInput2.fill('명동 쇼핑');
  
  // 장소 검색
  const searchInput2 = await page.locator('input[placeholder*="장소를 검색"]');
  if (await searchInput2.isVisible()) {
    await searchInput2.fill('명동');
    await page.waitForTimeout(3000);
    
    // 검색 결과 클릭
    const result = await page.locator('div[style*="padding: 10px"]').first();
    if (await result.isVisible()) {
      await result.click();
      console.log('✅ 명동 선택');
    }
  }
  
  // 저장
  await page.locator('button:has-text("저장")').click();
  await page.waitForTimeout(2000);
  
  // 명동 추가 후 스크린샷
  await page.screenshot({ path: 'test-results/simple-3-myeongdong.png', fullPage: true });
  
  // 4. 이동 박스 클릭 (경로 자동 계산)
  console.log('🚗 이동 박스 테스트');
  await page.locator('div[style*="cursor: pointer"]:has-text("directions")').first().click();
  await page.waitForTimeout(5000); // 경로 계산 대기
  
  // 모달 스크린샷 (경로 계산 결과)
  await page.screenshot({ path: 'test-results/simple-4-transport-modal.png', fullPage: true });
  
  // 모달 내용 확인
  const modalText = await page.locator('div[style*="position: fixed"]').textContent();
  console.log('모달 내용:', modalText);
  
  // 경로 정보 확인
  if (modalText?.includes('경복궁')) {
    console.log('✅ 출발지: 경복궁 확인');
  }
  if (modalText?.includes('명동')) {
    console.log('✅ 도착지: 명동 확인');
  }
  if (modalText?.includes('km')) {
    console.log('✅ 거리 정보 확인');
  }
  if (modalText?.includes('분')) {
    console.log('✅ 시간 정보 확인');
  }
  
  // 이동 수단 변경
  const walkBtn = await page.locator('button:has-text("도보")');
  if (await walkBtn.isVisible()) {
    await walkBtn.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/simple-5-walk.png', fullPage: true });
    console.log('✅ 도보 모드 테스트');
  }
  
  // 저장
  await page.locator('button:has-text("저장")').click();
  await page.waitForTimeout(2000);
  
  // 최종 스크린샷
  await page.screenshot({ path: 'test-results/simple-6-final.png', fullPage: true });
  
  console.log('🎉 테스트 완료');
});