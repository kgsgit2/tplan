import { test, expect } from '@playwright/test';

test.describe('플래너 페이지 시각적 테스트', () => {
  test('플래너 페이지 단계별 스크린샷 테스트', async ({ page }) => {
    console.log('🚀 플래너 페이지 시각적 테스트 시작');
    
    // 1. 페이지 로드
    await page.goto('/planner');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 초기 페이지 스크린샷
    await page.screenshot({ 
      path: 'test-results/visual-step1-initial.png', 
      fullPage: true 
    });
    console.log('✅ Step 1: 초기 페이지 스크린샷 저장완료');

    // 2. 우측 사이드바의 모든 클릭 가능한 요소들 찾기
    const clickableElements = await page.locator('div, button, [role="button"]').filter({
      has: page.locator('text')
    }).all();
    
    console.log(`🔍 클릭 가능한 요소 ${clickableElements.length}개 발견`);

    // 3. 첫 번째 플랜박스 클릭 시도 (여러 선택자 시도)
    const possibleSelectors = [
      'div[class*="planbox"]',
      '[data-category]',
      'div:has-text("restaurant")',
      'div:has-text("🍽️")',
      '.sidebar div:nth-child(1)',
      'div[style*="background"]'
    ];

    let firstPlanBox = null;
    for (const selector of possibleSelectors) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        try {
          await element.click({ timeout: 5000 });
          firstPlanBox = element;
          console.log(`✅ 첫 번째 플랜박스 클릭 성공: ${selector}`);
          break;
        } catch (e) {
          console.log(`❌ ${selector} 클릭 실패, 다음 시도...`);
        }
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/visual-step2-first-click.png', 
      fullPage: true 
    });
    console.log('✅ Step 2: 첫 번째 클릭 후 스크린샷 저장완료');

    // 4. 모달이 열렸는지 확인하고 처리
    const modalSelectors = [
      '[data-testid="planbox-modal"]',
      '.planbox-modal',
      '.modal',
      'div[role="dialog"]',
      'div:has-text("장소 검색")',
      'div:has-text("카카오")',
      'input[placeholder*="검색"]'
    ];

    let modalFound = false;
    for (const selector of modalSelectors) {
      const modal = page.locator(selector);
      if (await modal.count() > 0) {
        console.log(`✅ 모달 발견: ${selector}`);
        modalFound = true;
        
        // 모달에서 검색 시도
        const searchInput = modal.locator('input').first();
        if (await searchInput.count() > 0) {
          await searchInput.fill('경복궁');
          await page.waitForTimeout(1000);
          
          // 엔터키 또는 검색 버튼 클릭
          await searchInput.press('Enter');
          await page.waitForTimeout(2000);
          
          console.log('✅ "경복궁" 검색 완료');
        }
        break;
      }
    }

    await page.screenshot({ 
      path: 'test-results/visual-step3-search-gyeongbok.png', 
      fullPage: true 
    });
    console.log('✅ Step 3: 경복궁 검색 후 스크린샷 저장완료');

    // 5. 검색 결과가 있다면 첫 번째 결과 클릭
    const searchResults = page.locator('li, .search-result, div:has-text("경복궁")').first();
    if (await searchResults.count() > 0) {
      try {
        await searchResults.click();
        console.log('✅ 검색 결과 선택 완료');
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log('❌ 검색 결과 클릭 실패');
      }
    }

    // 6. 저장 버튼 찾아서 클릭
    const saveButtons = ['button:has-text("저장")', 'button:has-text("확인")', 'button:has-text("Save")'];
    for (const buttonSelector of saveButtons) {
      const button = page.locator(buttonSelector);
      if (await button.count() > 0) {
        try {
          await button.click();
          console.log(`✅ 저장 버튼 클릭 완료: ${buttonSelector}`);
          break;
        } catch (e) {
          console.log(`❌ ${buttonSelector} 클릭 실패`);
        }
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/visual-step4-after-save.png', 
      fullPage: true 
    });
    console.log('✅ Step 4: 저장 후 스크린샷 저장완료');

    // 7. 두 번째 플랜박스로 명동 추가 시도
    console.log('🛍️ 명동 추가 시도...');
    
    // 다른 플랜박스 클릭 (shopping 관련 또는 두 번째)
    const secondPlanBox = page.locator('div[class*="planbox"], [data-category]').nth(1);
    if (await secondPlanBox.count() > 0) {
      try {
        await secondPlanBox.click();
        console.log('✅ 두 번째 플랜박스 클릭 성공');
        await page.waitForTimeout(2000);
        
        // 모달에서 명동 검색
        const searchInput2 = page.locator('input').first();
        if (await searchInput2.count() > 0) {
          await searchInput2.fill('명동');
          await searchInput2.press('Enter');
          await page.waitForTimeout(2000);
          
          // 결과 선택
          const result2 = page.locator('li, .search-result').first();
          if (await result2.count() > 0) {
            await result2.click();
            await page.waitForTimeout(1000);
          }
          
          // 저장
          for (const buttonSelector of saveButtons) {
            const button = page.locator(buttonSelector);
            if (await button.count() > 0) {
              try {
                await button.click();
                break;
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.log('❌ 두 번째 플랜박스 처리 실패');
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/visual-step5-myeongdong-added.png', 
      fullPage: true 
    });
    console.log('✅ Step 5: 명동 추가 후 스크린샷 저장완료');

    // 8. 이동 박스 추가 시도
    console.log('🚗 이동 박스 추가 시도...');
    
    // directions 또는 이동 관련 박스 클릭
    const transportBox = page.locator('div:has-text("directions"), div[class*="transport"], div[class*="directions"]').first();
    if (await transportBox.count() > 0) {
      try {
        await transportBox.click();
        console.log('✅ 이동 박스 클릭 성공');
        await page.waitForTimeout(3000); // 경로 계산 대기
        
        // 저장
        for (const buttonSelector of saveButtons) {
          const button = page.locator(buttonSelector);
          if (await button.count() > 0) {
            try {
              await button.click();
              break;
            } catch (e) {}
          }
        }
      } catch (e) {
        console.log('❌ 이동 박스 처리 실패');
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'test-results/visual-step6-transport-added.png', 
      fullPage: true 
    });
    console.log('✅ Step 6: 이동 박스 추가 후 스크린샷 저장완료');

    // 9. 최종 완성 상태
    await page.screenshot({ 
      path: 'test-results/visual-final-complete.png', 
      fullPage: true 
    });
    console.log('🎉 최종 완료 스크린샷 저장완료');

    console.log('✨ 플래너 페이지 시각적 테스트 완료!');
  });
});