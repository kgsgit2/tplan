# 🗺️ TravelPlan - 드래그앤드롭 여행 계획 관리 플랫폼

> **최신 업데이트**: 2025년 9월 13일 | **개발 진행도**: 75%

## 📌 프로젝트 개요
직관적인 드래그앤드롭 인터페이스로 여행 계획을 쉽게 관리하는 웹 애플리케이션

### ✨ 주요 기능
- 📅 **타임라인 기반 일정 관리** - 시각적 일정표
- 🎯 **드래그앤드롭** - 간편한 일정 조정
- 🚗 **이동 경로 자동 계산** - 자동차/대중교통/도보
- 📍 **카카오맵 연동** - 실시간 장소 검색
- 💾 **Supabase 클라우드** - 자동 저장 및 동기화

## 🚀 빠른 시작

### 설치 및 실행
```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
# .env.local 파일 생성 필요

# 3. 개발 서버 실행 (포트 3003)
npm run dev

# 4. 브라우저에서 열기
http://localhost:3003/planner
```

### 필수 환경 변수
```env
NEXT_PUBLIC_KAKAO_API_KEY=your_kakao_key
NEXT_PUBLIC_SUPABASE_URL=https://fsznctkjtakcvjuhrxpx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| **Frontend** | Next.js 15, React 19, TypeScript 5.9 |
| **Styling** | Tailwind CSS, Framer Motion |
| **Backend** | Supabase (PostgreSQL) |
| **Testing** | Playwright |
| **DevOps** | GitHub Actions, Vercel |

## 📁 프로젝트 구조

```
tplan/
├── src/
│   └── app/
│       └── planner/        # 메인 플래너 기능
│           └── page.tsx    # 핵심 컴포넌트 (1600+ 줄)
├── database/               # DB 스키마
├── supabase/              # Supabase 설정
├── tests/                 # E2E 테스트
├── proto/                 # 프로토타입 HTML
└── docs/                  # 문서
    ├── setup/            # 설정 가이드
    └── archives/         # 과거 문서
```

## 🔧 개발 명령어

```bash
# 개발
npm run dev              # 개발 서버 (3003 포트)
npm run build           # 프로덕션 빌드
npm run type-check      # TypeScript 체크

# 테스트
npm test                # 모든 테스트
npm run test:e2e        # E2E 테스트

# 동기화 (지하↔1층)
npm run s               # 작업 시작 (자동 pull)
npm run e               # 작업 종료 (자동 commit & push)
```

## 📊 프로젝트 현황

### ✅ 완료된 기능
- [x] 드래그앤드롭 타임라인
- [x] 이동 박스 자동 경로 계산
- [x] 카카오맵 장소 검색
- [x] Supabase 데이터베이스 연동
- [x] 51개 E2E 테스트 구축

### 🚧 진행 중
- [ ] TypeScript 오류 수정 (60+ 개)
- [ ] 컴포넌트 리팩토링
- [ ] 성능 최적화
- [ ] 접근성 개선

## 🤝 기여 방법

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m '[위치] 작업 내용'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 문서

### Claude 전용
- `CLAUDE_README.md` - Claude 작업 가이드
- `WORK_LOG.md` - 자동 작업 기록

### 개발 문서
- `docs/TECH_STACK_ANALYSIS.md` - 기술 스택 분석
- `docs/CURRENT_STATUS.md` - 현재 상태
- `docs/setup/` - 설정 가이드

## 🔗 관련 링크

- **GitHub**: [github.com/kgsgit2/tplan](https://github.com/kgsgit2/tplan)
- **Supabase**: [프로젝트 대시보드](https://supabase.com/dashboard/project/fsznctkjtakcvjuhrxpx)

## 📄 라이선스

MIT License - 자유롭게 사용하세요!

---

**Made with ❤️ by kgsgit2**