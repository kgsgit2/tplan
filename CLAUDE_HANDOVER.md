# 🚨 1층 Claude 즉시 읽어주세요!

## 📍 현재 위치: 1층
**작성 시간**: 2025년 9월 13일 오후 6시 30분 (지하에서 작성)
**상태**: ✅ 파일 정리 완료!

---

## 🔥 긴급 작업 필요!

### 1️⃣ **즉시 실행** (파일 동기화)
```bash
# 최신 변경사항 가져오기
git pull origin main

# 패키지 업데이트
npm install
```

### 2️⃣ **파일 정리 상태**
✅ **지하에서 이미 정리 완료!**

삭제된 파일들:
- 이미지 파일들 (planner-*.png) ✅
- 중복 MD 파일들 (docs로 이동) ✅
- 불필요한 .claude 스크립트들 ✅
- nul 파일 ✅
- test-results 내용 ✅

### 3️⃣ **남겨야 할 파일들**
```
✅ .claude/auto-sync.js       # 지하↔1층 동기화
✅ .claude/quick-handover.js  # 빠른 인수인계
✅ .claude/simple-commands.js # 간단 명령어
✅ .claude/session.json       # 세션 정보
```

---

## 🎯 통합된 명령어 체계

### **새로운 표준 명령어** (이것만 사용!)
```bash
# 작업 시작 (자동 pull)
npm run s

# 작업 종료 (자동 commit & push)
npm run e

# 상태 확인
npm run claude:quick
```

### **기존 명령어** (여전히 사용 가능)
```bash
npm run c:s  # 간단 시작
npm run c:e  # 간단 종료
```

---

## 📊 현재 프로젝트 상태

### Git 정보
- **브랜치**: main
- **최신 커밋**: 지하에서 동기화 시스템 구축 완료

### 주요 변경사항
1. ✅ 지하↔1층 자동 동기화 시스템 구축
2. ✅ 파일 구조 정리 (docs/archives로 이동)
3. ✅ 통합 명령어 체계 확립

### 개발 환경
- **포트**: 3003 (`npm run dev`는 포트 3003)
- **DB**: Supabase (fsznctkjtakcvjuhrxpx)

---

## 🔄 작업 순서

### 1층 도착 시:
1. `git pull origin main`
2. 위의 파일들 삭제
3. `npm run s` 실행
4. 작업 진행

### 1층 떠날 때:
1. `npm run e "작업 내용"`
2. 지하에서 `npm run s`로 이어받기

---

## 📁 정리된 폴더 구조

```
tplan/
├── .claude/          # 동기화 스크립트 (정리됨)
├── src/              # 소스 코드
├── docs/             # 문서 (정리됨)
│   └── archives/     # 오래된 문서들
├── proto/            # 프로토타입 (proto_g 아님!)
├── database/         # DB 스키마
└── supabase/         # Supabase 설정
```

---

## ⚠️ 주의사항

1. **proto_g는 삭제**: proto가 정식 폴더
2. **루트의 MD 파일들 정리**: docs 폴더로 이동됨
3. **이미지 파일들 삭제**: Git에서 관리 안 함

---

## 💡 문제 발생 시

```bash
# 강제로 지하 버전으로 맞추기
git fetch origin
git reset --hard origin/main
npm install
```

**지하 Claude가 1층 Claude를 위해 준비했습니다!**
작업 시작하세요! 🚀