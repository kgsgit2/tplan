import { test, expect } from '@playwright/test';

test.describe('드래그 앤 드롭 문제 분석', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/planner');
    await page.waitForSelector('.planbox-container');
  });

  test('원래 위치 통과 시 드래그 멈춤 현상 테스트', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // 첫 번째 플랜박스 찾기
    const planBox = await page.locator('.planbox-item').first();
    const planBoxBounds = await planBox.boundingBox();
    
    if (!planBoxBounds) {
      throw new Error('Plan box not found');
    }

    // 타임라인의 첫 번째 슬롯 찾기
    const firstSlot = await page.locator('[data-day="0"][data-hour="9"]').first();
    const firstSlotBounds = await firstSlot.boundingBox();
    
    if (!firstSlotBounds) {
      throw new Error('First slot not found');
    }

    // 드래그 시작
    await planBox.hover();
    await page.mouse.down();
    
    // 타임라인으로 드래그하여 배치
    await page.mouse.move(
      firstSlotBounds.x + firstSlotBounds.width / 2,
      firstSlotBounds.y + 20
    );
    await page.mouse.up();
    
    // 배치 확인
    await page.waitForTimeout(500);
    const placedBox = await page.locator('.placed-box').first();
    expect(await placedBox.isVisible()).toBeTruthy();
    
    // 배치된 박스의 원래 위치 저장
    const originalBounds = await placedBox.boundingBox();
    if (!originalBounds) {
      throw new Error('Placed box not found');
    }
    
    // 배치된 박스를 다시 드래그
    await placedBox.hover();
    await page.mouse.down();
    
    // 원래 위치를 통과하며 아래로 이동
    const movements = [
      { x: originalBounds.x + 10, y: originalBounds.y - 50 }, // 위로
      { x: originalBounds.x + 10, y: originalBounds.y + 10 }, // 원래 위치 통과
      { x: originalBounds.x + 10, y: originalBounds.y + 100 }, // 아래로
    ];
    
    for (const move of movements) {
      await page.mouse.move(move.x, move.y, { steps: 5 });
      await page.waitForTimeout(100);
      
      // 각 이동 시점의 DOM 상태 체크
      const draggedOpacity = await placedBox.evaluate(el => 
        window.getComputedStyle(el).opacity
      );
      
      const ghostBoxVisible = await page.locator('.ghost-box').isVisible().catch(() => false);
      
      console.log(`Position: ${move.y}, Opacity: ${draggedOpacity}, Ghost: ${ghostBoxVisible}`);
    }
    
    // 드롭
    await page.mouse.up();
    
    // 로그 분석
    const dragStartLogs = consoleLogs.filter(log => log.includes('Drag started'));
    const dragOverLogs = consoleLogs.filter(log => log.includes('Drag over'));
    const errorLogs = consoleLogs.filter(log => log.includes('Error') || log.includes('error'));
    
    console.log('Drag Start Events:', dragStartLogs.length);
    console.log('Drag Over Events:', dragOverLogs.length);
    console.log('Errors:', errorLogs);
    
    // 박스가 이동되었는지 확인
    const newBounds = await placedBox.boundingBox();
    expect(newBounds?.y).not.toBe(originalBounds.y);
  });

  test('고스트 박스와 원본 박스 충돌 테스트', async ({ page }) => {
    // 박스를 타임라인에 배치
    const planBox = await page.locator('.planbox-item').first();
    const slot = await page.locator('[data-day="0"][data-hour="10"]').first();
    
    await planBox.dragTo(slot);
    await page.waitForTimeout(500);
    
    // 배치된 박스 찾기
    const placedBox = await page.locator('.placed-box').first();
    const placedBoxBounds = await placedBox.boundingBox();
    
    if (!placedBoxBounds) {
      throw new Error('Placed box not found');
    }
    
    // 동일한 위치로 다시 드래그 시작
    await placedBox.hover();
    await page.mouse.down();
    
    // 약간 움직였다가 원래 위치로 돌아오기
    await page.mouse.move(placedBoxBounds.x + 50, placedBoxBounds.y);
    await page.waitForTimeout(100);
    await page.mouse.move(placedBoxBounds.x, placedBoxBounds.y);
    await page.waitForTimeout(100);
    
    // DOM 상태 확인
    const elements = await page.evaluate(() => {
      const placed = document.querySelectorAll('.placed-box');
      const ghost = document.querySelector('[style*="pointer-events: none"]');
      return {
        placedCount: placed.length,
        ghostExists: !!ghost,
        placedOpacity: placed[0] ? window.getComputedStyle(placed[0] as Element).opacity : null
      };
    });
    
    console.log('DOM State:', elements);
    
    await page.mouse.up();
    
    // 원본 박스가 여전히 존재하고 작동하는지 확인
    expect(await placedBox.isVisible()).toBeTruthy();
  });

  test('이벤트 버블링 및 중복 처리 테스트', async ({ page }) => {
    // 이벤트 리스너 추가하여 모니터링
    await page.evaluate(() => {
      let dragOverCount = 0;
      let lastDragOverTime = 0;
      
      document.addEventListener('dragover', (e) => {
        const now = Date.now();
        if (now - lastDragOverTime < 10) {
          console.error('Dragover fired too quickly:', now - lastDragOverTime, 'ms');
        }
        lastDragOverTime = now;
        dragOverCount++;
        
        const target = e.target as HTMLElement;
        if (target.classList.contains('placed-box')) {
          console.log('Dragover on placed-box detected');
        }
      }, true);
      
      (window as any).getDragOverCount = () => dragOverCount;
    });
    
    // 박스 배치 및 드래그 테스트
    const planBox = await page.locator('.planbox-item').first();
    const slot = await page.locator('[data-day="0"][data-hour="11"]').first();
    
    await planBox.dragTo(slot);
    await page.waitForTimeout(500);
    
    const placedBox = await page.locator('.placed-box').first();
    await placedBox.hover();
    await page.mouse.down();
    
    // 작은 원형 움직임
    const center = await placedBox.boundingBox();
    if (center) {
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const x = center.x + center.width / 2 + Math.cos(angle) * 30;
        const y = center.y + center.height / 2 + Math.sin(angle) * 30;
        await page.mouse.move(x, y, { steps: 2 });
        await page.waitForTimeout(50);
      }
    }
    
    await page.mouse.up();
    
    // 이벤트 카운트 확인
    const dragOverCount = await page.evaluate(() => (window as any).getDragOverCount());
    console.log('Total dragover events:', dragOverCount);
    
    // 너무 많은 이벤트가 발생했는지 확인
    expect(dragOverCount).toBeLessThan(100);
  });
});