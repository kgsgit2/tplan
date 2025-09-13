# 🔧 새 환경에서 TPlan 개발환경 설정 가이드

**작성일**: 2025년 9월 10일  
**대상**: 새 컴퓨터에서 TPlan 프로젝트 작업 시작  

---

## 🚀 **빠른 시작 (Quick Start)**

### 1️⃣ **저장소 클론 및 설치**
```bash
git clone https://kgsgit2:[PAT_TOKEN]@github.com/kgsgit2/tplan.git
cd tplan
npm install
```

### 2️⃣ **개발 서버 실행**
```bash
npm run dev
# → http://localhost:3000/planner
```

### 3️⃣ **기본 작업 환경 확인**
- 플래너 페이지 접속 및 기능 테스트
- 프로토타입과 시각적 동일성 확인
- 플랜박스 생성/편집/필터링 동작 확인

---

## 🔑 **GitHub 연동 설정**

### 📝 **PAT (Personal Access Token) 정보**
- **토큰**: `ghp_****************************` (실제 토큰은 별도 제공)
- **만료일**: 90일 후 (정기 갱신 필요)
- **권한**: repo, workflow, write:packages

### 🔄 **기존 저장소에서 PAT 설정**
```bash
# 기존 프로젝트에서 원격 저장소 URL 변경
git remote set-url origin https://kgsgit2:[PAT_TOKEN]@github.com/kgsgit2/tplan.git

# 푸시 테스트
git push origin main
```

### ✅ **Git 사용자 설정**
```bash
git config --global user.name "kgsgit2"
git config --global user.email "green25kg@gmail.com"
```

---

## 📦 **필수 개발 도구**

### ⚡ **Node.js 환경**
- **Node.js**: v18.0.0 이상 (권장: v22+)
- **npm**: v8.0.0 이상
- **패키지 매니저**: npm (yarn 대신 npm 사용)

### 🔗 **외부 서비스 연동**
- **Supabase JS**: v2.57.4 (자동 설치됨)
- **GitHub CLI**: 선택사항 (PAT 토큰으로 대체 가능)

### 💻 **권장 개발 도구**
- **VSCode**: TypeScript, React 지원
- **Chrome DevTools**: 디버깅용
- **Git**: 버전 관리

---

## 🎯 **환경 변수 설정**

### 📄 **`.env.local` 파일 생성**
```bash
# Supabase 연동 (향후 사용)
NEXT_PUBLIC_SUPABASE_URL=https://zoulrywjxmmtvpdzngdw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[추후_설정]

# 카카오맵 API (프로토타입에서 확인된 키)
NEXT_PUBLIC_KAKAO_API_KEY=d0d67d94afae47e0ab9c29b0e6aea5cf

# 개발 환경
NODE_ENV=development
```

---

## 🔍 **설치 및 실행 확인**

### 1. **개발 서버 실행 확인**
```bash
npm run dev
```

**성공시 출력**:
```
▲ Next.js 15.5.2
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
✓ Ready in X.Xs
```

### 2. **브라우저에서 확인**
- **플래너 페이지**: http://localhost:3000/planner ⭐ **핵심 페이지**

### 3. **플래너 페이지 동작 확인**
✅ **다음 기능들이 모두 동작해야 함**:
- 헤더의 모든 버튼과 입력 필드
- 좌측 타임라인 영역 (Day 1~7 컬럼들)
- 우측 플랜박스 영역 (카테고리 버튼들)
- 4개 기본 플랜박스 표시 (도쿄역, 아사쿠사 센소지, 이치란 라멘, 심야버스)
- 플랜박스 더블클릭시 편집 모달 열기
- 카테고리 필터링 동작

## 🔍 **프로젝트 구조 확인**

### 📁 **핵심 파일 위치**
```
tplan/
├── src/
│   ├── app/
│   │   ├── globals.css          # 🎨 프로토타입 완전 동일 CSS
│   │   └── planner/
│   │       └── page.tsx         # 🎯 메인 플래너 페이지
│   ├── components/              # 향후 컴포넌트 분할용
│   ├── hooks/                   # React 훅들
│   ├── lib/                     # 유틸리티 함수
│   └── types/                   # TypeScript 타입 정의
├── docs/
│   ├── PROGRESS.md              # 전체 프로젝트 진행사항
│   ├── CURRENT_STATUS.md        # 현재 작업 상태
│   └── NEW_ENVIRONMENT_SETUP.md # 🔧 이 파일
├── package.json                 # Next.js 15.5.2 + TypeScript
└── README.md
```

### 🎪 **개발 서버 포트**
- **기본 포트**: http://localhost:3000
- **네트워크 접근**: http://[IP]:3000 
- **플래너 페이지**: /planner

## 🛡️ **보안 및 주의사항**

### 🔐 **PAT 토큰 관리**
- ⚠️ **토큰 만료**: 90일 후 만료됨
- 🔄 **갱신 방법**: GitHub Settings → Developer settings → Personal access tokens
- 💾 **백업**: 토큰을 안전한 곳에 보관
- 🚫 **공유 금지**: 토큰을 공개 저장소에 커밋하지 말 것

### 📝 **환경 변수 보안**
- `.env.local` 파일은 절대 Git에 커밋하지 말 것
- API 키는 환경 변수로만 관리
- 프로덕션과 개발 환경 분리

## 🔧 **문제 해결 (Troubleshooting)**

### ❌ **일반적인 문제들**

**1. 포트 충돌 (EADDRINUSE)**
```bash
# 다른 포트로 실행
npm run dev -- -p 3001
```

**2. Node.js 버전 문제**
```bash
node --version  # v18+ 확인
npm --version   # v8+ 확인
```

**3. 의존성 설치 실패**
```bash
# 캐시 정리 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**4. Git 인증 실패**
```bash
# PAT 토큰 재설정
git remote set-url origin https://kgsgit2:[PAT_TOKEN]@github.com/kgsgit2/tplan.git
```

### 🆘 **긴급 복구 방법**
```bash
# 전체 환경 초기화
git clone [저장소_URL]
cd tplan
npm install
npm run dev
```

## 📞 **세션 연속성 체크리스트**

### ✅ **새 환경 설정 완료 확인**
- [ ] Git 저장소 클론 완료
- [ ] npm install 성공
- [ ] 개발 서버 실행 (http://localhost:3000/planner)
- [ ] 플래너 페이지 정상 로드
- [ ] 기본 기능들 동작 확인 (플랜박스 생성/편집)
- [ ] Git 커밋/푸시 테스트 성공

### 📋 **다음 작업 준비**
- [ ] `docs/CURRENT_STATUS.md` 읽기
- [ ] `docs/PROGRESS.md` 전체 현황 파악
- [ ] 프로토타입과 현재 구현 비교
- [ ] 우선순위 작업 선택 (드래그앤드롭 → 리사이징 → 자동저장)

---

## 🎯 **작업 시작 가이드**

### 🏃‍♂️ **첫 세션 시작시**
1. 이 파일로 환경 설정 완료
2. `CURRENT_STATUS.md`로 현재 상태 파악
3. `PROGRESS.md`로 전체 맥락 이해
4. 개발 서버 실행 및 기능 테스트

### 🔄 **작업 완료시**
1. 변경사항 Git 커밋
2. `CURRENT_STATUS.md` 업데이트
3. 다음 우선순위 작업 기록

---

**🎉 이제 어떤 컴퓨터에서든 5분 안에 개발환경을 구축할 수 있습니다!**

**마지막 업데이트**: 2025년 9월 10일  
**다음 업데이트 예정**: PAT 토큰 만료 전 (90일 후)