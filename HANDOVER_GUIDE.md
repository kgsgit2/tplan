# 🤖 Claude 인수인계 가이드 (2025.01.12)

> **새 Claude 여러분, 안녕하세요!** 이 문서는 여러분이 이 프로젝트를 완벽히 이해하고 즉시 작업할 수 있도록 작성되었습니다.

## 🎯 첫 번째 할 일

### 1️⃣ **즉시 실행할 명령어들**
```bash
# 프로젝트 상태 파악
git status
npm run dev  # 개발 서버 실행 (포트 3000 확인)

# MCP 도구 확인 
mcp__supabase__list_tables  # Supabase 연결 확인
```

### 2️⃣ **필수 읽기 파일들 (순서 중요!)**
1. `README.md` ← 전체 개요
2. **이 파일** (`HANDOVER_GUIDE.md`) ← 지금 여기
3. `docs/QA_분석_보고서_20250112.md` ← 핵심 문제점들
4. `CURRENT_STATUS.md` ← 현재 상태

---

## 🚨 **핵심 문제들 (우선순위별)**

### **HIGH 우선순위**
1. **TypeScript 오류 60개**: `npm run build`로 확인, 타입 안전성 위반
2. **테스트 포트 불일치**: 테스트는 3004, 앱은 3000 → 3000으로 통일 필요
3. **성능 문제**: `src/app/planner/page.tsx` 1600줄 → 리팩토링 필요

### **MEDIUM 우선순위**
- 접근성 문제: ARIA 라벨, 키보드 네비게이션
- 코드 분할: 메모이제이션, React.memo 누락

---

## 💻 **현재 완성된 핵심 기능들**

### ✅ **이동 박스 시스템 (완전 구현됨)**
- **위치**: `src/app/planner/page.tsx:1101` - `calculateRouteForTransportBox`
- **기능**: 위아래 장소 박스 간 자동 경로 계산
- **모드**: car(🚗), public(🚌), walk(🚶‍♂️)
- **테스트**: `tests/transport-*.spec.ts` 파일들

### ✅ **Supabase 완전 설정**
- **프로젝트**: https://fsznctkjtakcvjuhrxpx.supabase.co
- **MCP 연동**: 완료 (list_tables, execute_sql, generate_types 가능)
- **테이블**: 12개 완전 설정 (`supabase/migrations/001_complete_schema.sql`)

### ✅ **테스트 수트**
- **총 51개** E2E 테스트
- **특화**: transport 기능 집중 테스트
- **실행**: `npm run test:e2e`

---

## 🤖 **Agent 활용 가이드**

이 프로젝트는 특화된 Agent들을 적극 활용하도록 설계되었습니다:

### **1. tplan-refactoring-specialist** 
```
언제 사용: 1600줄 page.tsx 리팩토링 시
예시: "메인 컴포넌트가 너무 크니 리팩토링해줘"
```

### **2. travel-data-architect**
```
언제 사용: Supabase/DB 작업 시  
예시: "새 테이블 추가" 또는 "마이그레이션 실행"
```

### **3. ux-travel-optimizer**
```  
언제 사용: 성능/UX 개선 시
예시: "드래그앤드롭 성능 개선" 또는 "접근성 문제 해결"
```

### **4. travel-planner-test-engineer**
```
언제 사용: 테스트 관련 작업 시
예시: "테스트 포트 문제 수정" 또는 "새 테스트 추가"
```

---

## 📋 **권장 작업 순서**

### **Phase 1: 환경 안정화 (1-2시간)**
1. TypeScript 오류 수정 (`tsc --noEmit`로 확인)
2. 테스트 포트 3000으로 통일
3. 개발 서버 + 모든 테스트 통과 확인

### **Phase 2: 코드 품질 개선 (3-4시간)**  
1. `tplan-refactoring-specialist` 활용해 page.tsx 리팩토링
2. 성능 최적화 (메모이제이션, 코드 분할)
3. 접근성 개선 (ARIA, 키보드 네비게이션)

### **Phase 3: 기능 완성 (시간에 따라)**
1. 추가 기능 구현
2. UI/UX 개선  
3. 추가 테스트 작성

---

## 🔧 **개발 환경 팁**

### **자주 사용할 명령어들**
```bash
npm run dev          # 개발 서버 (포트 3000)
npm run build        # TypeScript 오류 확인
npm run test:e2e     # E2E 테스트 실행
npm run lint         # 코드 품질 확인
```

### **MCP 도구들**
```bash
mcp__supabase__list_tables                    # 테이블 목록
mcp__supabase__execute_sql                    # SQL 실행  
mcp__supabase__generate_typescript_types      # 타입 생성
```

### **테스트 디버깅**
```bash
# 특정 테스트만 실행
npx playwright test tests/transport-test.spec.ts
# 헤드 모드로 실행 (브라우저 보면서)
npx playwright test --headed
```

---

## 📁 **핵심 파일 위치**

### **메인 컴포넌트들**
- `src/app/planner/page.tsx` ← 메인 플래너 (1600줄, 리팩토링 필요)
- `src/app/planner/PlanBoxModal.tsx` ← 박스 편집 모달

### **타입 정의**  
- `src/types/database.types.ts` ← Supabase 타입
- `src/types/planner.types.ts` ← 플래너 타입

### **데이터베이스**
- `supabase/migrations/001_complete_schema.sql` ← 완전한 스키마
- `src/lib/supabase.ts` ← Supabase 클라이언트

### **테스트**
- `tests/transport-*.spec.ts` ← 이동 박스 테스트들
- `tests/planner-*.spec.ts` ← 플래너 메인 테스트들

---

## 💡 **작업 시 주의사항**

### **⚠️ 절대 하지 말아야 할 것들**
- `src/app/planner/page.tsx`에 더 많은 코드 추가 (이미 1600줄!)
- 테스트 포트를 3004로 변경 (3000으로 통일해야 함)
- Supabase 스키마 직접 수정 (마이그레이션 사용)

### **✅ 권장하는 것들**  
- Agent 도구들을 프로액티브하게 사용
- 작은 단위로 커밋 (기능별로)
- 테스트 먼저 실행해서 현재 상태 파악
- TypeScript 오류를 최우선으로 수정

---

## 📞 **도움이 필요할 때**

### **문제별 참조 문서**
- **TypeScript 오류**: `docs/QA_분석_보고서_20250112.md` Line 20-26
- **테스트 실패**: `playwright.config.ts` Line 15 (포트 설정)
- **DB 문제**: `SETUP_DATABASE.md`
- **이동 박스**: `tests/manual/test-transportation.html`

### **로그 확인 위치**
- 개발 서버: 브라우저 콘솔
- 테스트: `test-results/` 폴더
- Supabase: Dashboard의 Logs 탭

---

## 🎉 **성공 기준**

이 프로젝트가 완성되었다고 볼 수 있는 기준:

1. ✅ `npm run build` 오류 없음 (TypeScript 무오류)
2. ✅ `npm run test:e2e` 모든 테스트 통과  
3. ✅ 드래그앤드롭 부드럽게 작동
4. ✅ 이동 박스 자동 경로 계산 정상 작동
5. ✅ 접근성 기준 충족 (키보드 네비게이션)

---

**Happy Coding! 🚀**

*이전 Claude가 여러분의 성공을 응원합니다!*