# 🤖 Agent 동기화 설정 가이드

> **이 파일을 읽으면 새 Claude에서도 동일한 Agent 환경을 구성할 수 있습니다**

## 🎯 Agent 활용 전략

이 프로젝트는 **특화된 Agent들을 적극 활용**하도록 설계되었습니다. 
각 Agent는 특정 작업에 최적화되어 있어 수동 작업보다 훨씬 효율적입니다.

---

## 🛠️ 핵심 Agent 목록

### 1. **tplan-refactoring-specialist** 🔧
```yaml
용도: 대규모 Next.js 컴포넌트 리팩토링
트리거: "1600줄 page.tsx 리팩토링", "컴포넌트 분할", "TypeScript 오류 수정"
우선순위: ⭐⭐⭐ (HIGH)
```

**언제 사용하나요?**
- `src/app/planner/page.tsx` (1600+ 줄) 리팩토링 시
- TypeScript 오류가 많을 때
- 코드 구조 개선이 필요할 때

**사용 예시:**
```
"메인 페이지 컴포넌트가 1600줄이 넘어서 리팩토링이 필요해. TypeScript 오류도 많고."
```

### 2. **travel-data-architect** 🏗️
```yaml
용도: Supabase/DB 관련 모든 작업
트리거: "데이터베이스", "Supabase", "마이그레이션", "스키마"
우선순위: ⭐⭐ (MEDIUM)
```

**언제 사용하나요?**
- 새 테이블 추가
- DB 스키마 수정
- Supabase 연동 문제
- 실시간 동기화 설정

**사용 예시:**
```
"새로운 여행 템플릿 기능을 위해 테이블을 추가하고 싶어"
"Supabase 실시간 동기화가 안되는데 확인해줘"
```

### 3. **ux-travel-optimizer** 🎨
```yaml
용도: UX/성능 최적화, 접근성 개선
트리거: "성능", "UX", "접근성", "드래그앤드롭", "최적화"
우선순위: ⭐⭐ (MEDIUM)
```

**언제 사용하나요?**
- 드래그앤드롭 성능 개선
- 접근성 문제 해결
- Core Web Vitals 최적화
- 모바일 반응형 개선

**사용 예시:**
```
"드래그앤드롭이 끊기는 현상이 있어서 성능 최적화가 필요해"
"접근성 기준에 맞게 ARIA 라벨을 추가하고 싶어"
```

### 4. **travel-planner-test-engineer** 🧪
```yaml
용도: 테스트 자동화, E2E 테스트, 시각적 회귀 테스트
트리거: "테스트", "Playwright", "E2E", "포트 문제"
우선순위: ⭐⭐⭐ (HIGH)
```

**언제 사용하나요?**
- 테스트 포트 3004→3000 수정
- 새 기능 테스트 추가
- 테스트 실패 문제 해결
- 시각적 회귀 테스트

**사용 예시:**
```
"테스트가 3004 포트로 설정되어 있는데 3000으로 변경해줘"
"새로 추가한 기능에 대한 E2E 테스트를 작성해줘"
```

### 5. **travel-api-integrator** 🔗
```yaml
용도: API 통합, 카카오 맵, 결제 시스템 연동
트리거: "API", "카카오", "결제", "외부 서비스"
우선순위: ⭐ (LOW)
```

**언제 사용하나요?**
- 카카오 맵 API 문제
- 결제 시스템 연동
- 외부 API 통합

---

## 📋 Agent 사용 가이드라인

### ✅ **즉시 사용해야 하는 경우**
1. **TypeScript 오류 60개** → `tplan-refactoring-specialist`
2. **테스트 포트 문제** → `travel-planner-test-engineer`  
3. **성능 최적화** → `ux-travel-optimizer`
4. **DB 관련 작업** → `travel-data-architect`

### ⚡ **Agent 호출 패턴**

**단일 Agent 호출:**
```
"tplan-refactoring-specialist를 사용해서 page.tsx를 리팩토링해줘"
```

**병렬 Agent 호출:**
```
"동시에 실행해줘:
1. tplan-refactoring-specialist로 TypeScript 오류 수정
2. travel-planner-test-engineer로 테스트 포트 수정"
```

### 🚨 **주의사항**

**❌ Agent를 사용하지 말아야 할 경우:**
- 단순한 파일 읽기/쓰기
- 간단한 텍스트 변경
- 2-3줄 코드 수정

**✅ Agent를 적극 사용해야 할 경우:**
- 복잡한 리팩토링
- 다중 파일 수정
- 전체 시스템 분석
- 최적화 작업

---

## 🎯 **우선순위별 Agent 활용 계획**

### **Phase 1: 안정화 (HIGH)**
```bash
# 1. TypeScript 오류 수정
→ tplan-refactoring-specialist 활용

# 2. 테스트 인프라 수정  
→ travel-planner-test-engineer 활용
```

### **Phase 2: 최적화 (MEDIUM)**
```bash
# 3. 성능 개선
→ ux-travel-optimizer 활용

# 4. 코드 구조 개선
→ tplan-refactoring-specialist 재활용
```

### **Phase 3: 확장 (LOW)**
```bash
# 5. 새 기능 추가
→ travel-data-architect + travel-api-integrator 조합
```

---

## 🔄 **Agent 상태 동기화**

새 Claude에서 Agent가 제대로 작동하는지 확인:

```bash
# 1. 간단한 Agent 테스트
"tplan-refactoring-specialist를 사용해서 현재 프로젝트 상태를 분석해줘"

# 2. MCP 도구와 함께 사용
"travel-data-architect를 사용해서 Supabase 테이블 상태를 확인해줘"

# 3. 복합 작업 테스트  
"ux-travel-optimizer와 travel-planner-test-engineer를 병렬로 실행해서 성능 테스트를 해줘"
```

---

## 📊 **Agent 효율성 지표**

각 Agent의 예상 작업 시간:

- **tplan-refactoring-specialist**: 1-2시간 (TypeScript 오류 수정)
- **travel-planner-test-engineer**: 30분-1시간 (테스트 포트 수정)
- **ux-travel-optimizer**: 2-3시간 (성능 최적화)
- **travel-data-architect**: 1시간 (DB 작업)

---

## 💡 **새 Claude를 위한 Agent 활용 팁**

1. **프로액티브 사용**: 사용자가 명시하지 않아도 적절한 Agent 제안
2. **병렬 실행**: 독립적인 작업은 동시 실행
3. **결과 검증**: Agent 작업 후 반드시 테스트 실행
4. **문서 업데이트**: Agent 작업 후 상태 문서 업데이트

**성공적인 Agent 활용의 핵심은 "적극성"입니다!** 🚀