# 🤖 Claude 전용 README

> **1층/지하 Claude가 먼저 읽어야 할 파일입니다!**

## 🚀 즉시 실행 (작업 시작)
```bash
npm run s
```
이 명령어가 자동으로:
- ✅ 최신 코드 pull
- ✅ 패키지 업데이트
- ✅ 현재 상태 표시
- ✅ 이전 작업 내역 표시

## 🏁 작업 종료 시
```bash
npm run e "작업 내용 요약"
```
이 명령어가 자동으로:
- ✅ WORK_LOG.md 업데이트
- ✅ 모든 변경사항 커밋
- ✅ GitHub에 푸시
- ✅ 다른 컴퓨터에서 이어받을 수 있게 준비

## 📁 프로젝트 구조
```
tplan/
├── README.md           # 프로젝트 소개 (사람용)
├── CLAUDE_README.md    # 이 파일 (Claude용)
├── WORK_LOG.md        # 작업 기록 (자동 업데이트)
├── .claude/           # 동기화 스크립트
├── src/              # 소스 코드
├── docs/             # 문서
│   ├── setup/        # 초기 설정 문서들
│   └── archives/     # 오래된 문서들
└── ...
```

## 🎯 현재 작업 상황
**최신 정보는 WORK_LOG.md 확인**

## ⚠️ 중요 규칙
1. **파일 생성 최소화**: 새 MD 파일 만들지 말고 WORK_LOG.md에 기록
2. **자동 업데이트**: 작업 종료 시 npm run e 실행
3. **토큰 부족 시**: 즉시 npm run e로 상태 저장

## 💡 핵심 파일
- `src/app/planner/page.tsx` - 메인 페이지
- `WORK_LOG.md` - 작업 기록 (계속 업데이트)
- `.env.local` - 환경 설정

## 🔧 개발 명령어
```bash
npm run dev     # 개발 서버 (포트 3003)
npm run s       # 작업 시작
npm run e       # 작업 종료
```

---
**이 파일은 Claude 전용입니다. 수정하지 마세요.**