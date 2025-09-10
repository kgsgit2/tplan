# TPlan 기술 스택 및 비즈니스 모델 분석

**작성일**: 2025년 9월 10일  
**프로젝트**: TPlan (tplan.kr)  
**상태**: 기술 아키텍처 설계 단계

---

## 📋 현재 상황 요약

### 🎯 프로토타입 현황
- **완성도**: 90% (거의 완성된 상태)
- **핵심 기능**: 드래그앤드롭 기반 여행 계획 시스템
- **기술**: Vanilla HTML/CSS/JavaScript (7,400줄)
- **위치**: `D:\02_2025\02_tplan\dragdrop_web\timeplanbox-enhanced\prototype_backup\index-adaptive.html`

### 🚀 구현된 기능들
1. **적응형 타임라인 시스템** - 날짜별 독립적 시간대 설정
2. **드래그앤드롭 플래너** - 10분 단위 스냅, 충돌 감지
3. **6개 카테고리 시스템** - 식사/이동/활동/관광/쇼핑/숙박
4. **리사이즈 기능** - 플랜박스 크기 조절
5. **자동 저장** - localStorage 기반
6. **Material Design UI** - 완성된 디자인 시스템

### 🔧 미완성 기능들 (구현 예정)
1. **경로 계산 시스템** - 이동박스 간 자동 거리/시간 계산
2. **실시간 공유 기능** - 협업 플랜박스 공유
3. **지도 API 통합** - 카카오맵/구글맵 연동
4. **장소 검색 시스템** - POI 정보 자동 입력

---

## 🏗️ 추천 기술 스택 전환

### ❌ 현재 Vanilla JS의 한계
- **상태 관리**: 전역 변수로 복잡한 데이터 관리의 어려움
- **코드 재사용성**: 컴포넌트 기반 개발 불가
- **확장성**: 회원가입, DB 연동 등 복잡한 기능 구현의 한계
- **유지보수**: 7,400줄의 단일 파일 관리 어려움

### ✅ 추천 현대 기술 스택

#### 🎨 Frontend: Next.js (React 기반) - 강력 추천
```
장점:
- 서버 사이드 렌더링 (SEO 최적화)
- 컴포넌트 기반 개발 (플랜박스, 타임라인 등 재사용)
- 강력한 상태 관리 (Redux/Zustand)
- 풍부한 생태계 (UI 라이브러리, 차트, 지도 연동)
- Vercel 간편 배포
```

#### 🖥️ Backend: Node.js (NestJS) - 추천
```
기능:
- 회원 관리 시스템
- 데이터베이스 연동
- API 서버 (지도 API 키 보안 관리)
- 실시간 공유 (WebSocket/Socket.IO)
- 경로 계산 API 연동
```

#### 🗄️ Database: PostgreSQL + PostGIS - 강력 추천
```
이유:
- 관계형 데이터 구조에 최적 (사용자 → 여행 → 플랜박스)
- PostGIS: 지리 정보 처리 (경로 계산, 장소 검색 최적화)
- 데이터 무결성 및 안정성
- 위치 기반 서비스 DB 레벨 최적화
```

---

## 💰 비즈니스 모델 설계

### 🎯 추천: 하이브리드 Freemium 모델

#### 🆓 무료 회원 (Free Tier)
```
목표: 서비스 핵심 가치 경험 제공
제한:
- 여행 계획: 2개
- 여행 기간: 5일
- 플랜박스: 30개
- 기능 제한: 공유 불가, 경로 계산 불가, PDF 내보내기 불가
```

#### 💫 개인 사용자 (1회성 결제) - 메인 타겟
```
스타터 (9,900원):
- 여행 계획: 1개 (10일)
- 플랜박스: 100개
- 경로 자동 계산 ✅
- PDF 내보내기 ✅

프로 (29,900원):
- 여행 계획: 무제한
- 플랜박스: 무제한
- 모든 기능 ✅
- 개인 공유: 5명까지
```

#### 👥 팀/기업 (구독 모델)
```
팀 (월 19,900원):
- 실시간 협업 편집
- 팀 브랜딩 커스터마이징
- 고급 분석 리포트
- 우선 고객지원
```

### 📊 수익화 전략
1. **1회성 결제 중심** - 여행 계획의 비정기적 특성에 적합
2. **플랜박스 개수 + 여행일수 조합 제한** - 명확한 가치 구분
3. **기업/팀 대상 구독** - 안정적 수익 창출

---

## 🛠️ 기술적 구현 계획

### 🎯 Phase 1: 기반 전환 (2-3주)
1. **Next.js 프로젝트 셋업**
2. **기존 코드 컴포넌트화**
   - `<PlanBox />` 컴포넌트
   - `<Timeline />` 컴포넌트  
   - `<DragDropProvider />` 컨텍스트
3. **PostgreSQL + Supabase 연동**
4. **기본 회원 시스템**

### 🎯 Phase 2: 고급 기능 (3-4주)
1. **경로 계산 시스템**
   - 카카오모빌리티 API 연동
   - Google Maps Directions API
   - PostGIS 기반 최적화
2. **실시간 공유 기능**
   - WebSocket (Socket.IO)
   - 실시간 동기화
3. **장소 검색 API**
   - 카카오/구글 장소 API
   - POI 정보 자동 입력

### 🎯 Phase 3: 서비스 완성 (2주)
1. **결제 시스템** (토스페이먼츠)
2. **PWA 설정** (모바일 앱화)
3. **성능 최적화**
4. **배포 및 운영**

---

## 🔧 핵심 기술 구현 방법

### 📍 경로 계산 시스템
```javascript
// 백엔드에서 API 호출
const calculateRoute = async (origin, destination, mode) => {
  // 카카오모빌리티 또는 Google Directions API
  const response = await fetch('/api/route', {
    method: 'POST',
    body: JSON.stringify({ origin, destination, mode })
  });
  
  // 결과를 이동박스에 자동 입력
  return response.json(); // { duration, distance, cost }
}
```

### 🔄 실시간 공유
```javascript
// WebSocket으로 실시간 동기화
socket.on('planbox-moved', (data) => {
  // A 사용자의 변경사항이 B 사용자 화면에 실시간 반영
  updatePlanboxPosition(data.boxId, data.newPosition);
});
```

### 🗺️ 장소 정보 연동
```javascript
// 장소 검색 시 정보 자동 입력
const searchPlace = async (query) => {
  const placeInfo = await kakaoAPI.searchPlace(query);
  return {
    name: placeInfo.name,
    address: placeInfo.address,
    photos: placeInfo.photos,
    rating: placeInfo.rating,
    hours: placeInfo.operatingHours
  };
}
```

---

## 📝 다음 세션 작업 계획

### 🎯 즉시 진행사항
1. **Next.js 프로젝트 생성** 및 기초 셋업
2. **기존 프로토타입 컴포넌트 분석** 및 전환 계획
3. **Supabase 데이터베이스 스키마** 설계
4. **개발환경 및 워크플로우** 확정

### 📋 장기 목표
- **3개월 내 MVP 런칭**
- **사용자 피드백 기반 개선**
- **수익화 모델 검증**

---

**마지막 업데이트**: 2025년 9월 10일  
**다음 세션 시 참조**: 이 문서를 읽고 컨텍스트 복원