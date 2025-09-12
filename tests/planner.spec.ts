import { test, expect } from '@playwright/test';

test.describe('TPlan Planner', () => {
  test.beforeEach(async ({ page }) => {
    // 개발 서버로 이동
    await page.goto('http://localhost:3001/planner');
  });

  test('페이지가 정상적으로 로드되는지 확인', async ({ page }) => {
    // 헤더 확인
    await expect(page.locator('.header')).toBeVisible();
    
    // 타이틀 입력 필드 확인
    const titleInput = page.locator('#tripTitle');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue('도쿄 여행');
  });

  test('플랜박스가 사이드바에 표시되는지 확인', async ({ page }) => {
    // 사이드바 확인
    const sidebar = page.locator('.sidebar-section');
    await expect(sidebar).toBeVisible();
    
    // 플랜박스 아이템들 확인 (최소 1개 이상)
    const planboxItems = page.locator('.planbox-item');
    const count = await planboxItems.count();
    expect(count).toBeGreaterThan(0); // 최소 1개 이상의 플랜박스
  });

  test('드래그 앤 드롭 기능 테스트', async ({ page }) => {
    // 첫 번째 플랜박스 찾기
    const planbox = page.locator('.planbox-item').first();
    const timeSlot = page.locator('.time-slot[data-day="0"][data-hour="9"]').first();
    
    // 드래그 앤 드롭 시뮬레이션
    await planbox.hover();
    await page.mouse.down();
    await timeSlot.hover();
    await page.mouse.up();
    
    // 배치된 박스 확인
    const placedBox = page.locator('.placed-box');
    await expect(placedBox).toHaveCount(1);
  });

  test('날짜 변경 기능 테스트', async ({ page }) => {
    // 날짜 입력 필드
    const startDate = page.locator('#startDate');
    const endDate = page.locator('#endDate');
    
    // 날짜 변경
    await startDate.fill('2025-02-01');
    await endDate.fill('2025-02-05');
    
    // 적용 버튼 클릭
    await page.locator('button:has-text("적용")').click();
    
    // 타임라인 업데이트 확인 (5일)
    const dayColumns = page.locator('.day-column');
    await expect(dayColumns).toHaveCount(5);
  });

  test('플랜박스 편집 모달 테스트', async ({ page }) => {
    // 플랜박스 더블클릭
    const planbox = page.locator('.planbox-item').first();
    await planbox.dblclick();
    
    // 모달 표시 확인
    const modal = page.locator('.planbox-modal');
    await expect(modal).toBeVisible();
    
    // 모달 닫기
    await page.locator('.modal-close').click();
    await expect(modal).not.toBeVisible();
  });

  test('카테고리 필터 테스트', async ({ page }) => {
    // 식사 카테고리 필터 클릭
    await page.locator('.category-item[data-category="food"]').click();
    
    // 식사 카테고리 플랜박스만 표시되는지 확인
    const planboxItems = page.locator('.planbox-item');
    const foodItems = page.locator('.planbox-item.food');
    
    await expect(planboxItems).toHaveCount(await foodItems.count());
  });

  test('localStorage 저장 테스트', async ({ page }) => {
    // localStorage 확인
    const storageData = await page.evaluate(() => {
      return localStorage.getItem('tplan-data');
    });
    
    expect(storageData).toBeTruthy();
    
    // 데이터 파싱 및 확인
    const data = JSON.parse(storageData!);
    expect(data.tripTitle).toBe('도쿄 여행');
    expect(data.planboxData).toBeDefined();
  });
});