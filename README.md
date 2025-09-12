# 🗓️ TPlan - 여행 계획 관리 시스템

**프로젝트 현황 (2025.01.12 기준)** - 이 파일을 먼저 읽어보세요!

## 📋 새 Claude를 위한 필수 정보

### **즉시 읽어야 할 문서들 (순서대로)**
1. **이 README.md** ← 지금 여기!
2. `HANDOVER_GUIDE.md` ← Claude 인수인계 가이드  
3. `CURRENT_STATUS.md` ← 현재 프로젝트 상태
4. `SETUP_DATABASE.md` ← DB 설정 완료 상태

### **프로젝트 개요**
- **목적**: 드래그&드롭 기반 여행 계획 관리 웹앱
- **기술**: Next.js 14 + TypeScript + Supabase + Playwright
- **특징**: 타임라인 기반 계획, 이동 박스 자동 경로 계산, 실시간 협업

## 🚀 현재 구현 완료 상태

### ✅ **완성된 핵심 기능들**
- **플래너 메인 페이지**: 완전한 드래그&드롭 타임라인
- **이동 박스**: 자동 경로 계산 (car/public/walk 모드)
- **Supabase 연동**: 완전한 DB 스키마 + MCP 연동
- **테스트 수트**: 51개 E2E 테스트 (transport 특화)

### 🔧 **진행중/다음 작업**
- **TypeScript 오류 수정**: 60+ 오류 (HIGH 우선순위)
- **테스트 포트 문제**: 3004→3000 포트 동기화 필요
- **성능 최적화**: 1600줄 컴포넌트 리팩토링 필요
- **접근성 개선**: ARIA 라벨, 키보드 네비게이션

## 📁 주요 파일 구조

```
/src/app/planner/page.tsx     ← 메인 플래너 (1600+ 줄)
/src/app/planner/PlanBoxModal.tsx  ← 모달 컴포넌트
/src/types/database.types.ts   ← Supabase 타입 정의
/tests/                       ← 포괄적인 테스트 수트
/supabase/migrations/         ← 완전한 DB 스키마
/config/claude_desktop_config.json ← MCP 설정
```

## 🔗 주요 URL들

- **개발 서버**: http://localhost:3000/planner
- **DB 테스트**: http://localhost:3000/test-connection  
- **Supabase**: https://fsznctkjtakcvjuhrxpx.supabase.co

## ⚡ 빠른 시작

```bash
# 1. 환경 설정
npm install
# .env.local 파일 설정 (사용자가 직접 가져옴)

# 2. 개발 서버 실행
npm run dev

# 3. 테스트 실행
npm run test:e2e
```

## 🤖 Agent 설정

이 프로젝트에는 특화된 Agent들이 있습니다:
- **tplan-refactoring-specialist**: 1600줄 컴포넌트 리팩토링용
- **travel-data-architect**: Supabase/DB 관련 작업용  
- **ux-travel-optimizer**: UX/성능 최적화용
- **travel-planner-test-engineer**: 테스트 관련 작업용

## 📊 프로젝트 통계 (2025.01.12 기준)

- **코드베이스**: ~50개 파일, 15,000+ 줄
- **TypeScript 오류**: 60개 (해결 필요)
- **테스트 커버리지**: 51개 E2E 테스트  
- **DB 테이블**: 12개 (완전 설정됨)
- **개발 진행도**: ~75% 완료

---

## 💡 다음 Claude를 위한 팁

1. **`HANDOVER_GUIDE.md`를 꼭 먼저 읽으세요**
2. **타입 오류부터 수정하는 것을 추천**
3. **테스트는 포트 3000으로 실행하세요**
4. **Supabase MCP 도구들을 적극 활용하세요**
5. **Agent들을 프로액티브하게 사용하세요**

🎯 **목표**: TypeScript 무오류 + 모든 테스트 통과 + 성능 최적화