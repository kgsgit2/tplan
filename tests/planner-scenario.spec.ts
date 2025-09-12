import { test, expect } from '@playwright/test';

test.describe('플래너 페이지 시나리오 테스트', () => {
  test('플래너 페이지 전체 시나리오 - 경복궁, 명동, 이동 박스 추가', async ({ page }) => {
    // 1. http://localhost:3003/planner 페이지 열기
    console.log('1. 플래너 페이지 열기');
    await page.goto('/planner');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 첫 번째 스크린샷 - 초기 페이지
    await page.screenshot({ 
      path: 'test-results/step1-initial-page.png', 
      fullPage: true 
    });
    console.log('✓ 초기 페이지 스크린샷 저장됨');

    // 2. 첫 번째 플랜 박스 추가 - "경복궁" (관광 카테고리)
    console.log('2. 경복궁 플랜 박스 추가');
    
    // 관광/사진 관련 플랜 박스 클릭 (photo 카테고리 또는 비슷한)
    let tourismPlanBox = page.locator('[class*="photo"], [data-category="photo"]').first();
    
    // 만약 photo가 없다면 다른 관광 관련 카테고리 시도
    if (await tourismPlanBox.count() === 0) {
      tourismPlanBox = page.locator('[class*="tourist"], [class*="attraction"], [class*="sight"]').first();
    }
    
    // 그래도 없다면 첫 번째 플랜박스 클릭
    if (await tourismPlanBox.count() === 0) {
      tourismPlanBox = page.locator('.planbox-item, [data-testid*="planbox"], div[class*="planbox"]').first();
    }
    
    await tourismPlanBox.click();
    await page.waitForTimeout(1000);
    
    // 모달이 열렸는지 확인
    const modal = page.locator('[data-testid="planbox-modal"], .planbox-modal, .modal');
    await expect(modal.first()).toBeVisible();
    
    // 모달에서 카카오 검색으로 "경복궁" 검색
    const searchInput = page.locator('input[placeholder*="검색"], input[type="text"]').first();
    await searchInput.fill('경복궁');
    await page.waitForTimeout(1000);
    
    // 검색 버튼 클릭 또는 엔터키
    const searchButton = page.locator('button').filter({ hasText: /검색|Search/ });
    if (await searchButton.count() > 0) {
      await searchButton.first().click();
    } else {
      await searchInput.press('Enter');
    }
    
    await page.waitForTimeout(2000);
    
    // 검색 결과에서 첫 번째 결과 선택
    const searchResults = page.locator('.search-result, [data-testid="search-result"], li');
    if (await searchResults.count() > 0) {
      await searchResults.first().click();
      await page.waitForTimeout(1000);
    }
    
    // 저장 버튼 클릭
    const saveButton = page.locator('button').filter({ hasText: /저장|Save|확인/ });
    await saveButton.first().click();
    await page.waitForTimeout(2000);
    
    // 두 번째 스크린샷 - 경복궁 추가 후
    await page.screenshot({ 
      path: 'test-results/step2-gyeongbokgung-added.png', 
      fullPage: true 
    });
    console.log('✓ 경복궁 추가 후 스크린샷 저장됨');

    // 3. 두 번째 플랜 박스 추가 - "명동" (쇼핑 카테고리)
    console.log('3. 명동 플랜 박스 추가');
    
    // 쇼핑 카테고리 플랜 박스 클릭
    let shoppingPlanBox = page.locator('[class*="shopping"], [data-category="shopping"]').first();
    
    // shopping_bag 카테고리 시도
    if (await shoppingPlanBox.count() === 0) {
      shoppingPlanBox = page.locator('[class*="shopping_bag"]').first();
    }
    
    // 그래도 없다면 두 번째 플랜박스 클릭
    if (await shoppingPlanBox.count() === 0) {
      shoppingPlanBox = page.locator('.planbox-item, [data-testid*="planbox"], div[class*="planbox"]').nth(1);
    }
    
    await shoppingPlanBox.click();
    await page.waitForTimeout(1000);
    
    // 모달이 열렸는지 확인
    await expect(modal.first()).toBeVisible();
    
    // 카카오 검색으로 "명동" 검색
    const searchInput2 = page.locator('input[placeholder*="검색"], input[type="text"]').first();
    await searchInput2.fill('명동');
    await page.waitForTimeout(1000);
    
    // 검색 실행
    const searchButton2 = page.locator('button').filter({ hasText: /검색|Search/ });
    if (await searchButton2.count() > 0) {
      await searchButton2.first().click();
    } else {
      await searchInput2.press('Enter');
    }
    
    await page.waitForTimeout(2000);
    
    // 검색 결과에서 첫 번째 결과 선택
    const searchResults2 = page.locator('.search-result, [data-testid="search-result"], li');
    if (await searchResults2.count() > 0) {
      await searchResults2.first().click();
      await page.waitForTimeout(1000);
    }
    
    // 저장 버튼 클릭
    const saveButton2 = page.locator('button').filter({ hasText: /저장|Save|확인/ });
    await saveButton2.first().click();
    await page.waitForTimeout(2000);
    
    // 세 번째 스크린샷 - 명동 추가 후
    await page.screenshot({ 
      path: 'test-results/step3-myeongdong-added.png', 
      fullPage: true 
    });
    console.log('✓ 명동 추가 후 스크린샷 저장됨');

    // 4. 이동 박스 추가
    console.log('4. 이동 박스 추가');
    
    // 이동 카테고리 플랜 박스 클릭 (directions 카테고리)
    let transportPlanBox = page.locator('[class*="directions"], [data-category="directions"]').first();
    
    // transport 관련 다른 클래스 시도
    if (await transportPlanBox.count() === 0) {
      transportPlanBox = page.locator('[class*="transport"], [class*="move"]').first();
    }
    
    // 그래도 없다면 세 번째 플랜박스 클릭
    if (await transportPlanBox.count() === 0) {
      transportPlanBox = page.locator('.planbox-item, [data-testid*="planbox"], div[class*="planbox"]').nth(2);
    }
    
    await transportPlanBox.click();
    await page.waitForTimeout(1000);
    
    // 이동 모달이 열렸는지 확인
    await expect(modal.first()).toBeVisible();
    await page.waitForTimeout(2000);
    
    // 자동 경로 계산이 표시되는지 확인
    const routeInfo = page.locator('.route-info, [data-testid="route-info"]');
    if (await routeInfo.count() > 0) {
      console.log('✓ 자동 경로 계산 정보 표시됨');
      
      // 출발지/도착지 정보 확인
      const originInfo = page.locator('.origin, [data-testid="origin"]');
      const destinationInfo = page.locator('.destination, [data-testid="destination"]');
      
      if (await originInfo.count() > 0) {
        const originText = await originInfo.first().textContent();
        console.log('출발지:', originText);
      }
      
      if (await destinationInfo.count() > 0) {
        const destinationText = await destinationInfo.first().textContent();
        console.log('도착지:', destinationText);
      }
      
      // 거리와 시간 정보 확인
      const distanceInfo = page.locator('.distance, [data-testid="distance"]');
      const durationInfo = page.locator('.duration, [data-testid="duration"]');
      
      if (await distanceInfo.count() > 0) {
        const distanceText = await distanceInfo.first().textContent();
        console.log('거리:', distanceText);
      }
      
      if (await durationInfo.count() > 0) {
        const durationText = await durationInfo.first().textContent();
        console.log('소요시간:', durationText);
      }
    }
    
    await page.waitForTimeout(2000);
    
    // 저장 버튼 클릭
    const saveButton3 = page.locator('button').filter({ hasText: /저장|Save|확인/ });
    await saveButton3.first().click();
    await page.waitForTimeout(2000);
    
    // 네 번째 스크린샷 - 이동 박스 추가 후
    await page.screenshot({ 
      path: 'test-results/step4-transport-added.png', 
      fullPage: true 
    });
    console.log('✓ 이동 박스 추가 후 스크린샷 저장됨');

    // 최종 스크린샷 - 전체 완료
    await page.screenshot({ 
      path: 'test-results/final-complete.png', 
      fullPage: true 
    });
    console.log('✓ 최종 완료 스크린샷 저장됨');
    
    console.log('🎉 플래너 시나리오 테스트 완료!');
  });

  // 대안적인 테스트 - 더 간단한 접근법
  test('플래너 기본 기능 테스트', async ({ page }) => {
    console.log('기본 기능 테스트 시작');
    
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 페이지 기본 요소들이 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible();
    
    // 초기 상태 스크린샷
    await page.screenshot({ 
      path: 'test-results/basic-test-initial.png', 
      fullPage: true 
    });
    
    // 사이드바나 플랜 박스 영역이 있는지 확인
    const sidebar = page.locator('.sidebar, [data-testid="sidebar"], .planbox');
    if (await sidebar.count() > 0) {
      console.log('✓ 사이드바/플랜박스 영역 발견');
      
      // 클릭 가능한 요소들 찾기
      const clickableItems = page.locator('button, .clickable, [role="button"]');
      const itemCount = await clickableItems.count();
      console.log(`클릭 가능한 요소 ${itemCount}개 발견`);
      
      if (itemCount > 0) {
        // 첫 번째 클릭 가능한 요소 클릭
        await clickableItems.first().click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ 
          path: 'test-results/basic-test-after-click.png', 
          fullPage: true 
        });
      }
    }
    
    console.log('✓ 기본 기능 테스트 완료');
  });
});