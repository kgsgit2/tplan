# 🚀 새로운 환경에서 TPlan 프로젝트 설정하기

**대상**: 다른 컴퓨터에서 이 프로젝트를 이어받아 작업하려는 개발자 (Claude Code 포함)

---

## 📋 **사전 준비사항**

### 1. 필수 소프트웨어 설치
```bash
# Node.js 18 이상 설치 확인
node --version  # v18.0.0 이상이어야 함

# npm 버전 확인  
npm --version   # 8.0.0 이상 권장

# Git 설치 확인
git --version   # 2.0 이상
```

### 2. GitHub 접근 권한 설정 (선택사항)
- SSH 키가 있다면 GitHub에 등록
- 또는 HTTPS로 클론 (push 권한 없어도 됨)

---

## 🔽 **프로젝트 다운로드 및 설치**

### 방법 1: Git Clone (권장)
```bash
# 저장소 클론
git clone https://github.com/kgsgit2/tplan.git

# 프로젝트 폴더로 이동
cd tplan

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

### 방법 2: 폴더 복사 (백업용)
만약 Git이 안 된다면:
1. 전체 `tplan` 폴더를 USB나 클라우드로 복사
2. 새 컴퓨터에 붙여넣기
3. 터미널에서 해당 폴더로 이동
4. `npm install` 실행
5. `npm run dev` 실행

---

## ✅ **설치 확인**

### 1. 개발 서버 실행 확인
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

### 2. 브라우저에서 확인
- **메인 페이지**: http://localhost:3000 
- **플래너 페이지**: http://localhost:3000/planner ⭐ **여기가 핵심!**

### 3. 플래너 페이지 동작 확인
✅ **다음 기능들이 모두 동작해야 함**:
- 헤더의 모든 버튼과 입력 필드
- 좌측 타임라인 영역 (Day 1~7 컬럼들)
- 우측 플랜박스 영역 (카테고리 버튼들)
- 4개 기본 플랜박스 표시 (도쿄역, 아사쿠사 센소지, 이치란 라멘, 심야버스)
- 플랜박스 더블클릭시 편집 모달 열기
- 카테고리 필터링 동작

---

## 🔧 **개발 환경 설정**

### 1. VSCode 추천 확장
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### 2. 유용한 단축키
- `Ctrl + Shift + P` → "TypeScript: Restart TS Server" (타입 오류시)
- `Ctrl + `` ` → 터미널 열기
- `Ctrl + Shift + F5` → 브라우저 하드 새로고침

### 3. 브라우저 개발도구
- F12 → 개발자 도구 
- **Elements 탭**: CSS 스타일 확인/수정
- **Console 탭**: JavaScript 오류 확인
- **Network 탭**: 로딩 상태 확인

---

## 📂 **중요한 파일 위치**

### 핵심 작업 파일:
```
tplan/
├── src/app/globals.css           # ⭐ 모든 스타일 (수정금지)
├── src/app/planner/page.tsx      # ⭐ 메인 로직 (주 작업 파일)
├── docs/CURRENT_STATUS.md        # ⭐ 현재 작업 현황
├── docs/PROGRESS.md              # 전체 프로젝트 진행사항
├── package.json                  # 의존성 관리
└── tailwind.config.js            # Tailwind 설정
```

### 참고 파일:
```
# 프로토타입 원본 (경로는 환경마다 다를 수 있음)
D:\02_2025\02_tplan\dragdrop_web\timeplanbox-enhanced\prototype_backup\index-adaptive.html
```

---

## ⚠️ **주의사항**

### 1. 포트 충돌 해결
만약 3000번 포트가 사용중이면:
```bash
# 다른 포트로 실행
npm run dev -- --port 3001

# 또는 사용중인 프로세스 종료 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID번호> /F
```

### 2. 모듈 설치 오류시
```bash
# 캐시 정리 후 재설치
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 3. TypeScript 오류시
```bash
# Next.js 전체 재빌드
rm -rf .next
npm run dev
```

---

## 🎯 **다음 작업 시작하기**

### 1. 현재 상태 파악
1. **`docs/CURRENT_STATUS.md` 읽기** ⭐ **가장 중요**
2. 플래너 페이지에서 기능 테스트
3. 프로토타입과 시각적 비교

### 2. 우선 작업 목록 (권장 순서)
1. **드래그앤드롭 시스템** - 플랜박스를 타임라인에 배치
2. **리사이징 기능** - 배치된 박스 크기 조절  
3. **자동저장** - localStorage 기반
4. **압축 모드** - 빈 시간 숨기기
5. **인쇄 기능** - 스케줄 출력

### 3. 코딩 시작 전 체크리스트
- [ ] 개발 서버 실행됨 (`npm run dev`)
- [ ] 플래너 페이지 정상 로드
- [ ] 기본 플랜박스 4개 보임
- [ ] 모달 열기/닫기 동작함
- [ ] 프로토타입과 시각적으로 동일함
- [ ] `CURRENT_STATUS.md` 읽음

---

## 🆘 **문제 해결**

### 자주 발생하는 문제들:

**1. 페이지가 안 열려요**
```bash
# 개발 서버 재시작
Ctrl + C (서버 종료)
npm run dev
```

**2. CSS가 적용 안돼요**
- 브라우저 캐시 삭제 (`Ctrl + Shift + F5`)
- Tailwind CSS 재컴파일 확인

**3. TypeScript 오류가 계속 나요**  
```bash
# VSCode에서 TypeScript 서버 재시작
Ctrl + Shift + P → "TypeScript: Restart TS Server"
```

**4. 플랜박스가 안 보여요**
- 초기 데이터 로딩 확인
- 브라우저 Console 탭에서 오류 확인
- `initializeDefaultData()` 함수 호출 여부 확인

**5. 모달이 안 열려요**
- 더블클릭 이벤트 확인
- `setIsModalOpen(true)` 호출 여부 확인
- CSS의 `.modal.show` 클래스 확인

### 긴급 연락처:
- GitHub Issues: https://github.com/kgsgit2/tplan/issues
- 이 문서 위치: `docs/NEW_ENVIRONMENT_SETUP.md`

---

**작성일**: 2025년 9월 10일  
**작성자**: Claude Code  
**업데이트**: 필요시 이 문서도 함께 업데이트 해주세요