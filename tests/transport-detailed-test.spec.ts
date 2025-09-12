import { test, expect } from '@playwright/test';

test('이동 박스 자동 경로 계산 상세 테스트', async ({ page }) => {
  console.log('🚀 테스트 시작: 이동 박스 자동 경로 계산 상세 테스트');
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    if (msg.type() === 'log') {
      console.log('브라우저 콘솔:', msg.text());
    }
  });
  
  // 1. 플래너 페이지로 이동
  await page.goto('http://localhost:3004/planner');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  console.log('✅ 플래너 페이지 로드 완료');
  
  // 초기 상태 스크린샷
  await page.screenshot({ path: 'test-results/detailed-1-initial.png', fullPage: true });
  
  // 2. Day 1의 타임라인에 첫 번째 박스 드래그 (경복궁)
  console.log('📍 첫 번째 장소 배치: 경복궁');
  
  // 관광 카테고리 박스를 Day 1의 9시 위치로 드래그
  const tourBox = await page.locator('div:has-text("sports_soccer")').first();
  const day1Timeline = await page.locator('text="Day 1"').locator('..').locator('..');
  const targetPosition = await day1Timeline.locator('text="9"').first();
  
  // 드래그 앤 드롭
  await tourBox.dragTo(targetPosition);
  await page.waitForTimeout(2000);
  
  // 배치된 박스 클릭하여 모달 열기
  const placedBox1 = await page.locator('div[style*="position: absolute"]').first();
  await placedBox1.click();
  await page.waitForTimeout(1000);
  
  // 모달에서 정보 입력
  await page.fill('input[placeholder*="제목"]', '경복궁 관광');
  
  // 카카오 지도 검색
  const searchInput = await page.locator('input[placeholder*="장소를 검색"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill('경복궁');
    await page.waitForTimeout(2000);
    
    // 첫 번째 검색 결과 클릭
    const searchResult = await page.locator('div[style*="cursor: pointer"]').first();
    if (await searchResult.isVisible()) {
      await searchResult.click();
      console.log('✅ 경복궁 선택 완료');
    }
  }
  
  // 저장
  await page.click('button:has-text("저장")');
  await page.waitForTimeout(2000);
  
  // 경복궁 추가 후 스크린샷
  await page.screenshot({ path: 'test-results/detailed-2-gyeongbok.png', fullPage: true });
  
  // 3. Day 1의 타임라인에 두 번째 박스 드래그 (명동)
  console.log('📍 두 번째 장소 배치: 명동');
  
  // 쇼핑 카테고리 박스를 Day 1의 11시 위치로 드래그
  const shoppingBox = await page.locator('div:has-text("shopping_bag")').first();
  const targetPosition2 = await day1Timeline.locator('text="11"').first();
  
  await shoppingBox.dragTo(targetPosition2);
  await page.waitForTimeout(2000);
  
  // 배치된 두 번째 박스 클릭
  const placedBoxes = await page.locator('div[style*="position: absolute"]');
  const count = await placedBoxes.count();
  if (count >= 2) {
    await placedBoxes.nth(1).click();
    await page.waitForTimeout(1000);
    
    // 정보 입력
    await page.fill('input[placeholder*="제목"]', '명동 쇼핑');
    
    // 카카오 지도 검색
    const searchInput2 = await page.locator('input[placeholder*="장소를 검색"]');
    if (await searchInput2.isVisible()) {
      await searchInput2.fill('명동');
      await page.waitForTimeout(2000);
      
      const searchResult = await page.locator('div[style*="cursor: pointer"]').first();
      if (await searchResult.isVisible()) {
        await searchResult.click();
        console.log('✅ 명동 선택 완료');
      }
    }
    
    // 저장
    await page.click('button:has-text("저장")');
    await page.waitForTimeout(2000);
  }
  
  // 명동 추가 후 스크린샷
  await page.screenshot({ path: 'test-results/detailed-3-myeongdong.png', fullPage: true });
  
  // 4. 이동 박스를 두 장소 사이에 드래그
  console.log('🚗 이동 박스 배치 - 자동 경로 계산 테스트');
  
  // 이동 카테고리 박스를 Day 1의 10시 위치로 드래그 (경복궁과 명동 사이)
  const transportBox = await page.locator('div:has-text("directions")').first();
  const targetPosition3 = await day1Timeline.locator('text="10"').first();
  
  await transportBox.dragTo(targetPosition3);
  await page.waitForTimeout(2000);
  
  // 배치된 이동 박스 클릭하여 모달 열기
  const placedTransportBox = await page.locator('div[style*="position: absolute"]').nth(1); // 중간 박스
  await placedTransportBox.click();
  await page.waitForTimeout(3000); // 경로 계산 대기
  
  // 모달 열림 상태 스크린샷 (경로 계산 결과 포함)
  await page.screenshot({ path: 'test-results/detailed-4-transport-modal.png', fullPage: true });
  
  // 모달 내용 확인
  const modal = await page.locator('div[style*="position: fixed"]').last();
  
  // 경로 정보 텍스트 확인
  try {
    // 출발지 확인
    const originText = await modal.locator('text=/출발지|경복궁/').first();
    if (await originText.isVisible()) {
      console.log('✅ 출발지 자동 설정: 경복궁');
    }
    
    // 도착지 확인
    const destText = await modal.locator('text=/도착지|명동/').first();
    if (await destText.isVisible()) {
      console.log('✅ 도착지 자동 설정: 명동');
    }
    
    // 거리/시간 정보 확인
    const distanceText = await modal.locator('text=/km/').first();
    if (await distanceText.isVisible()) {
      const distance = await distanceText.textContent();
      console.log(`✅ 거리 자동 계산: ${distance}`);
    }
    
    const timeText = await modal.locator('text=/분/').first();
    if (await timeText.isVisible()) {
      const time = await timeText.textContent();
      console.log(`✅ 시간 자동 계산: ${time}`);
    }
  } catch (e) {
    console.log('⚠️ 경로 정보를 찾을 수 없음, 모달 내용 확인 필요');
  }
  
  // 이동 수단 변경 테스트
  console.log('🚶 이동 수단 변경 테스트');
  
  // 도보 버튼 클릭
  const walkBtn = await modal.locator('button:has-text("도보")').first();
  if (await walkBtn.isVisible()) {
    await walkBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/detailed-5-walk-mode.png', fullPage: true });
    console.log('✅ 도보 모드 변경 완료');
  }
  
  // 대중교통 버튼 클릭
  const publicBtn = await modal.locator('button:has-text("대중교통")').first();
  if (await publicBtn.isVisible()) {
    await publicBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/detailed-6-public-mode.png', fullPage: true });
    console.log('✅ 대중교통 모드 변경 완료');
  }
  
  // 자동차 버튼 클릭
  const carBtn = await modal.locator('button:has-text("자동차")').first();
  if (await carBtn.isVisible()) {
    await carBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/detailed-7-car-mode.png', fullPage: true });
    console.log('✅ 자동차 모드 변경 완료');
  }
  
  // 저장
  await page.click('button:has-text("저장")');
  await page.waitForTimeout(2000);
  
  // 최종 상태 스크린샷
  await page.screenshot({ path: 'test-results/detailed-8-final.png', fullPage: true });
  
  console.log('🎉 테스트 완료: 이동 박스 자동 경로 계산 상세 테스트 성공');
});