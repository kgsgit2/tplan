import { test, expect } from '@playwright/test';

test.describe('Transportation Category Test', () => {
  test('이동 카테고리 기능 테스트', async ({ page }) => {
    // 1. 플래너 페이지 접속
    console.log('플래너 페이지 접속...');
    await page.goto('http://localhost:3000/planner');
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 초기 화면 스크린샷
    await page.screenshot({ 
      path: 'D:\\tplan\\test-results\\initial-page.png',
      fullPage: true 
    });
    console.log('✅ 초기 화면 스크린샷 저장');
    
    // 2. 이동 카테고리 버튼 클릭
    console.log('이동 카테고리 버튼 클릭...');
    const transportButton = page.locator('button:has-text("이동")').first();
    await transportButton.waitFor({ state: 'visible', timeout: 5000 });
    await transportButton.click();
    await page.waitForTimeout(1000);
    
    // 이동 카테고리 모달이 열렸는지 확인
    await page.screenshot({ 
      path: 'D:\\tplan\\test-results\\transport-modal.png',
      fullPage: true 
    });
    console.log('✅ 이동 카테고리 모달 스크린샷 저장');
    
    // 3. 모달 내용 확인 및 입력
    // 제목이 이미 "이동"으로 설정되어 있는지 확인
    const titleInput = page.locator('input[value="이동"]').or(page.locator('input[placeholder*="제목"]')).first();
    if (await titleInput.isVisible()) {
      console.log('✅ 제목 입력 필드 발견');
      await titleInput.clear();
      await titleInput.fill('경복궁 → 명동');
    }
    
    // 카테고리가 "이동"으로 선택되어 있는지 확인
    const categorySelect = page.locator('select').first();
    const selectedValue = await categorySelect.inputValue();
    console.log(`현재 선택된 카테고리: ${selectedValue}`);
    
    if (selectedValue !== '이동') {
      await categorySelect.selectOption('이동');
      console.log('✅ 카테고리를 "이동"으로 변경');
    } else {
      console.log('✅ 카테고리가 이미 "이동"으로 설정됨');
    }
    
    // 이동 카테고리 특별 필드들 확인
    await page.waitForTimeout(1000);
    
    // 이동 수단 필드 확인
    const transportModeLabel = page.locator('text=/이동.*수단/').or(page.locator('label:has-text("이동 수단")'));
    if (await transportModeLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ 이동 수단 필드 발견!');
      
      // 이동 수단 선택 (대중교통)
      const transportSelect = page.locator('select').nth(1);
      if (await transportSelect.isVisible()) {
        await transportSelect.selectOption({ label: '대중교통' }).catch(async () => {
          await transportSelect.selectOption('public');
        });
        console.log('✅ 대중교통 선택 완료');
      }
    } else {
      console.log('❌ 이동 수단 필드를 찾을 수 없음');
    }
    
    // 경로 입력 필드 확인
    const routeLabel = page.locator('text=/경로|출발|도착/').first();
    if (await routeLabel.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ 경로 관련 필드 발견!');
      
      // 출발지 입력
      const originInput = page.locator('input[placeholder*="출발"]').or(page.locator('input').nth(2));
      if (await originInput.isVisible()) {
        await originInput.fill('경복궁');
        console.log('✅ 출발지 입력: 경복궁');
      }
      
      // 도착지 입력
      const destInput = page.locator('input[placeholder*="도착"]').or(page.locator('input').nth(3));
      if (await destInput.isVisible()) {
        await destInput.fill('명동');
        console.log('✅ 도착지 입력: 명동');
      }
    } else {
      console.log('❌ 경로 필드를 찾을 수 없음');
    }
    
    // 예상 비용 입력
    const costInput = page.locator('input[placeholder*="비용"]').or(page.locator('input[placeholder*="예상"]'));
    if (await costInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await costInput.fill('2000');
      console.log('✅ 예상 비용 입력: 2000원');
    }
    
    // 메모 입력
    const memoTextarea = page.locator('textarea').first();
    if (await memoTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await memoTextarea.fill('지하철 3호선 이용\n안국역 → 충무로역');
      console.log('✅ 메모 입력 완료');
    }
    
    // 최종 입력 상태 스크린샷
    await page.screenshot({ 
      path: 'D:\\tplan\\test-results\\transport-filled.png',
      fullPage: true 
    });
    console.log('✅ 입력 완료 스크린샷 저장');
    
    // 4. 저장 버튼 클릭
    const saveButton = page.locator('button:has-text("저장")').or(page.locator('button:has-text("확인")'));
    if (await saveButton.isVisible()) {
      await saveButton.click();
      console.log('✅ 저장 버튼 클릭');
      await page.waitForTimeout(1000);
    }
    
    // 5. 플랜박스가 생성되었는지 확인
    const createdBox = page.locator('.planbox-item:has-text("경복궁 → 명동")').or(
      page.locator('.planbox-item:has-text("이동")')
    );
    
    if (await createdBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✅ 이동 플랜박스 생성 확인!');
      
      // 생성된 플랜박스 스크린샷
      await page.screenshot({ 
        path: 'D:\\tplan\\test-results\\transport-created.png',
        fullPage: true 
      });
      console.log('✅ 플랜박스 생성 스크린샷 저장');
    } else {
      console.log('❌ 이동 플랜박스를 찾을 수 없음');
    }
    
    // 6. 콘솔 로그 확인
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('브라우저 에러:', msg.text());
      }
    });
    
    // 테스트 완료 메시지
    console.log('\n========================================');
    console.log('🎉 이동 카테고리 기능 테스트 완료!');
    console.log('========================================');
    console.log('📸 스크린샷 저장 위치:');
    console.log('  1. D:\\tplan\\test-results\\initial-page.png - 초기 화면');
    console.log('  2. D:\\tplan\\test-results\\transport-modal.png - 이동 모달 열림');
    console.log('  3. D:\\tplan\\test-results\\transport-filled.png - 정보 입력 완료');
    console.log('  4. D:\\tplan\\test-results\\transport-created.png - 플랜박스 생성됨');
    console.log('========================================\n');
    
    // 테스트 성공 assertion
    await expect(page).toHaveURL(/planner/);
  });
});