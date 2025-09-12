# ⚡ 새 Claude 빠른 시작 가이드 (2025.01.12)

> **다른 컴퓨터의 새 Claude가 5분 안에 프로젝트를 파악할 수 있도록!**

## 🚀 첫 5분 체크리스트

### 1️⃣ **즉시 읽을 파일들 (2분)**
```bash
1. README.md                 # 전체 개요
2. HANDOVER_GUIDE.md         # 인수인계 가이드  
3. docs/CURRENT_STATUS.md    # 현재 상태
4. AGENT_SYNC_CONFIG.md      # Agent 설정
```

### 2️⃣ **환경 확인 (2분)**
```bash
# 프로젝트 상태 확인
git status
git log --oneline -5

# 개발 서버 실행
npm run dev
# → http://localhost:3000/planner 접속 확인

# MCP 도구 확인
mcp__supabase__list_tables
```

### 3️⃣ **핵심 문제 파악 (1분)**
```bash
# TypeScript 오류 확인 (60개 예상)
npm run build

# 테스트 상태 확인
npm run test:e2e
```

---

## 🎯 **즉시 해야 할 작업 (우선순위별)**

### **🔥 HIGH 우선순위 (즉시 해결)**

#### 1. TypeScript 오류 수정 ⚡
```bash
Agent: tplan-refactoring-specialist
위치: src/app/planner/page.tsx (1600+ 줄)
문제: 60개 타입 오류, null 안전성 위반
```
**Agent 활용법:**
```
"tplan-refactoring-specialist를 사용해서 TypeScript 오류를 수정해줘. 
특히 startHour, startMinute null 안전성 위반과 transportMode 타입 불일치 문제부터 해결해줘."
```

#### 2. 테스트 포트 동기화 ⚡
```bash  
Agent: travel-planner-test-engineer
문제: 테스트는 3004 포트, 앱은 3000 포트
파일: playwright.config.ts
```
**Agent 활용법:**
```
"travel-planner-test-engineer를 사용해서 모든 테스트를 3000 포트로 통일해줘. 
51개 테스트가 모두 통과하도록 설정해줘."
```

### **⚡ MEDIUM 우선순위 (다음 작업)**

#### 3. 성능 최적화
```bash
Agent: ux-travel-optimizer  
문제: 1600줄 컴포넌트, 메모이제이션 없음
```

#### 4. 접근성 개선
```bash
Agent: ux-travel-optimizer
문제: ARIA 라벨 없음, 키보드 네비게이션 누락
```

---

## 📱 **핵심 기능 테스트 (5분)**

### ✅ **작동 확인할 기능들**
1. **드래그앤드롭**: 사이드바 박스 → 타임라인 배치
2. **이동 박스**: 자동 경로 계산 (🚗🚌🚶‍♂️)  
3. **리사이징**: 배치된 박스 크기 조절
4. **모달 편집**: 더블클릭으로 박스 편집
5. **시간 배지**: 드래그 중 시간 표시

### 🧪 **테스트 실행**
```bash
# 주요 기능 테스트
npx playwright test tests/transport-test.spec.ts --headed

# 전체 테스트 (시간이 있을 때)
npm run test:e2e
```

---

## 🔗 **중요한 URL들**

```bash
개발 서버:    http://localhost:3000/planner
DB 테스트:    http://localhost:3000/test-connection
Supabase:     https://fsznctkjtakcvjuhrxpx.supabase.co
GitHub:       https://github.com/kgsgit2/tplan
```

---

## 📊 **현재 프로젝트 상태 요약**

### ✅ **완료된 것들**
- 완전한 드래그앤드롭 시스템 ✅
- 이동 박스 자동 경로 계산 ✅  
- Supabase 완전 연동 (12개 테이블) ✅
- 51개 E2E 테스트 작성 ✅
- MCP 서버 설정 완료 ✅

### ⚠️ **수정이 필요한 것들**
- TypeScript 오류 60개 ❌
- 테스트 포트 불일치 ❌
- 1600줄 컴포넌트 리팩토링 필요 ❌
- 접근성 개선 필요 ❌

---

## 🤖 **Agent 빠른 활용법**

### **병렬 작업 (추천)**
```bash
"동시에 실행해줘:
1. tplan-refactoring-specialist로 TypeScript 오류 수정
2. travel-planner-test-engineer로 테스트 포트 통일"
```

### **순차 작업**
```bash
"tplan-refactoring-specialist로 TypeScript 오류를 먼저 수정하고, 
그 다음 ux-travel-optimizer로 성능 최적화를 해줘"
```

---

## 💡 **새 Claude를 위한 필수 팁**

### **✅ 하면 좋은 것들**
1. Agent를 적극적으로 활용하세요
2. 작은 단위로 자주 커밋하세요
3. 테스트를 먼저 실행해서 현재 상태를 파악하세요
4. MCP 도구들을 활용하세요

### **❌ 하지 말아야 할 것들**
1. page.tsx에 더 많은 코드 추가 (이미 1600줄!)
2. 테스트 포트를 3004로 변경
3. Supabase 스키마 직접 수정

---

## 📋 **5분 후 상태 체크**

새 Claude가 다음을 확인할 수 있다면 성공:

- [ ] 프로젝트 전체 구조 이해
- [ ] 현재 주요 문제점 파악 
- [ ] Agent 사용법 숙지
- [ ] 개발 환경 정상 작동
- [ ] 다음 작업 우선순위 파악

**🎯 목표: TypeScript 무오류 + 모든 테스트 통과!**

---

**Good Luck! 🚀 이전 Claude가 응원합니다!**