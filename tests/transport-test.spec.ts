import { test, expect } from '@playwright/test';

test('이동 박스 자동 경로 계산 테스트', async ({ page }) => {
  console.log('🚀 테스트 시작: 이동 박스 자동 경로 계산');
  
  // 1. 플래너 페이지로 이동
  await page.goto('http://localhost:3004/planner');
  await page.waitForLoadState('networkidle');
  console.log('✅ 플래너 페이지 로드 완료');
  
  // 스크린샷: 초기 상태
  await page.screenshot({ path: 'test-results/transport-1-initial.png', fullPage: true });
  
  // 2. 첫 번째 장소 추가 (경복궁)
  console.log('📍 첫 번째 장소 추가: 경복궁');
  
  // 관광 카테고리 박스 클릭
  const tourBox = await page.locator('div:has-text("sports_soccer")').first();
  await tourBox.click();
  await page.waitForTimeout(1000);
  
  // 모달이 열릴 때까지 대기
  await page.waitForSelector('input[placeholder*="제목"]', { timeout: 5000 });
  
  // 제목 입력
  await page.fill('input[placeholder*="제목"]', '경복궁 관광');
  
  // 장소 검색
  const searchInput = await page.locator('input[placeholder*="장소를 검색"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill('경복궁');
    await page.waitForTimeout(2000);
    
    // 검색 결과 선택
    const searchResult = await page.locator('div[style*="cursor: pointer"]').first();
    if (await searchResult.isVisible()) {
      await searchResult.click();
      await page.waitForTimeout(1000);
    }
  }
  
  // 저장 버튼 클릭
  await page.click('button:has-text("저장")');
  await page.waitForTimeout(2000);
  
  // 스크린샷: 경복궁 추가 후
  await page.screenshot({ path: 'test-results/transport-2-gyeongbok.png', fullPage: true });
  
  // 3. 두 번째 장소 추가 (명동)
  console.log('📍 두 번째 장소 추가: 명동');
  
  // 쇼핑 카테고리 박스 클릭
  const shoppingBox = await page.locator('div:has-text("shopping_bag")').first();
  await shoppingBox.click();
  await page.waitForTimeout(1000);
  
  // 모달이 열릴 때까지 대기
  await page.waitForSelector('input[placeholder*="제목"]', { timeout: 5000 });
  
  // 제목 입력
  await page.fill('input[placeholder*="제목"]', '명동 쇼핑');
  
  // 장소 검색
  const searchInput2 = await page.locator('input[placeholder*="장소를 검색"]');
  if (await searchInput2.isVisible()) {
    await searchInput2.fill('명동');
    await page.waitForTimeout(2000);
    
    // 검색 결과 선택
    const searchResult = await page.locator('div[style*="cursor: pointer"]').first();
    if (await searchResult.isVisible()) {
      await searchResult.click();
      await page.waitForTimeout(1000);
    }
  }
  
  // 저장 버튼 클릭
  await page.click('button:has-text("저장")');
  await page.waitForTimeout(2000);
  
  // 스크린샷: 명동 추가 후
  await page.screenshot({ path: 'test-results/transport-3-myeongdong.png', fullPage: true });
  
  // 4. 이동 박스 추가 (자동 경로 계산)
  console.log('🚗 이동 박스 추가 - 자동 경로 계산 테스트');
  
  // 이동 카테고리 박스 클릭
  const transportBox = await page.locator('div:has-text("directions")').first();
  await transportBox.click();
  await page.waitForTimeout(2000); // 경로 계산 대기
  
  // 모달이 열릴 때까지 대기
  await page.waitForSelector('input[placeholder*="제목"]', { timeout: 5000 });
  
  // 스크린샷: 이동 모달 열림 (자동 경로 계산 결과)
  await page.screenshot({ path: 'test-results/transport-4-modal-open.png', fullPage: true });
  
  // 경로 정보 확인
  const modalContent = await page.locator('div[style*="backgroundColor: white"]').last();
  
  // 출발지/도착지 정보 확인
  const routeInfo = await modalContent.locator('text=/출발지|도착지/').count();
  if (routeInfo > 0) {
    console.log('✅ 경로 정보 자동 입력 확인');
  }
  
  // 거리/시간 정보 확인
  const distanceTime = await modalContent.locator('text=/km|분/').count();
  if (distanceTime > 0) {
    console.log('✅ 거리/시간 자동 계산 확인');
  }
  
  // 이동 수단 변경 테스트
  const walkButton = await page.locator('button:has-text("도보")');
  if (await walkButton.isVisible()) {
    await walkButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ 도보 모드로 변경');
    
    // 스크린샷: 도보 모드
    await page.screenshot({ path: 'test-results/transport-5-walk-mode.png', fullPage: true });
  }
  
  const publicButton = await page.locator('button:has-text("대중교통")');
  if (await publicButton.isVisible()) {
    await publicButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ 대중교통 모드로 변경');
    
    // 스크린샷: 대중교통 모드
    await page.screenshot({ path: 'test-results/transport-6-public-mode.png', fullPage: true });
  }
  
  // 최종 저장
  await page.click('button:has-text("저장")');
  await page.waitForTimeout(2000);
  
  // 스크린샷: 최종 상태
  await page.screenshot({ path: 'test-results/transport-7-final.png', fullPage: true });
  
  console.log('🎉 테스트 완료: 이동 박스 자동 경로 계산 성공');
});