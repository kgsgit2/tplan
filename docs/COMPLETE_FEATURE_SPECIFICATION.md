# TimePlanBox Adaptive v10.0 - 완전한 기능 명세서

## 📋 문서 개요

이 문서는 TimePlanBox Adaptive v10.0의 모든 기능과 구현 세부사항을 아무것도 모르는 개발자가 완전히 복제할 수 있을 정도로 극세밀하게 기술한 완전한 명세서입니다.

- **파일**: index-adaptive.html (284KB, 7,415줄)
- **버전**: v10.0 ADAPTIVE - Smart Timeline System  
- **철학**: "여행 계획은 한 번에 완성되는게 아니라, 점점 조사해가면서 만들어가는 거야"

---

## 🎯 프로젝트 핵심 개념

### 기본 아키텍처
- **단일 HTML 파일**: 모든 CSS, JavaScript가 인라인으로 통합
- **프레임워크 없음**: 순수 HTML/CSS/JavaScript
- **Material Design**: 구글 머티리얼 아이콘과 색상 체계
- **반응형**: 다양한 화면 크기 지원 (compress-mode, print-mode)

### 핵심 철학
1. **직관적 드래그앤드롭**: 플랜박스를 타임라인에 끌어놓는 방식
2. **1픽셀 = 1분**: 타임라인의 정확한 시간 표현  
3. **적응형 시간대**: 각 날짜마다 독립적인 시간 범위
4. **점진적 개선**: 계획을 수정하고 보완해가는 과정

---

## 🏗️ HTML 구조 분석

### 전체 문서 구조 (7,415줄)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <!-- 1~12줄: 메타 정보 -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Timeplanbox Adaptive v10.0 - Smart Timeline System</title>
    
    <!-- 7~9줄: Google Material Icons -->
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
    
    <!-- 13~2,049줄: 인라인 CSS (2,037줄) -->
    <style>
        /* CSS 전체 내용 */
    </style>
</head>

<body class="edit-mode">
    <!-- 2,051~2,415줄: HTML 마크업 (365줄) -->
    <!-- 2,416~7,413줄: JavaScript 코드 (4,998줄) -->
</body>
</html>
```

### Body 내부 구조 (2,051~2,415줄)

```html
<body class="edit-mode">
    <!-- 헤더 영역 -->
    <div class="header">
        <div class="header-logo">
            <div class="logo-icon">TP</div>
            <h1>TimePlanBox</h1>
        </div>
        <div class="header-controls">
            <input type="text" id="tripTitle" placeholder="여행 제목">
            <div class="view-mode-toggle">
                <button class="view-mode-btn active" data-mode="edit">편집</button>
                <button class="view-mode-btn" data-mode="compress">압축</button>
                <button class="view-mode-btn" data-mode="print">인쇄</button>
            </div>
            <button class="btn-header" onclick="openInitModal()">설정</button>
            <button class="btn-print" onclick="printSchedule()">인쇄</button>
        </div>
    </div>

    <!-- 메인 레이아웃 -->
    <div class="main-layout">
        <!-- 타임라인 영역 -->
        <div class="timeline-area">
            <div class="timeline-container" id="timelineContainer">
                <!-- 동적으로 생성되는 타임라인 -->
            </div>
        </div>

        <!-- 플랜박스 영역 -->
        <div class="planbox-area">
            <!-- 플랜박스 목록이 동적으로 생성 -->
        </div>
    </div>

    <!-- 모달들 (8개) -->
    <div id="initModal" class="modal">...</div>
    <div id="planboxModal" class="modal">...</div>
    <div id="quickPlanboxModal" class="modal">...</div>
    <div id="confirmModal" class="modal">...</div>
    <div id="customTimeModal" class="modal">...</div>
    <div id="settingsModal" class="modal">...</div>
    <div id="conflictModal" class="modal">...</div>
    <div id="editPlanboxModal" class="modal">...</div>

    <!-- JavaScript 전체 코드 -->
    <script>
        /* 4,998줄의 JavaScript 코드 */
    </script>
</body>
```

---

## 🎨 CSS 스타일 시스템 (2,037줄)

### Material Design 색상 체계 (15~25줄)

```css
:root {
    --md-green: #4CAF50;        /* 식사 카테고리 */
    --md-blue: #2196F3;         /* 이동 카테고리 */
    --md-purple: #9C27B0;       /* 활동 카테고리 */
    --md-orange: #FF9800;       /* 관광 카테고리 */
    --md-pink: #E91E63;         /* 쇼핑 카테고리 */
    --md-deep-purple: #673AB7;  /* 숙박 카테고리 */
    --md-primary: #1976D2;      /* 메인 색상 */
    --md-grey: #9E9E9E;         /* 회색 */
    --md-light-grey: #F5F5F5;   /* 연한 회색 */
}
```

### 기본 리셋 및 베이스 스타일 (27~45줄)

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;  /* 모든 요소 박스 모델 통일 */
}

body {
    font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #f8f9fa;     /* 연한 회색 배경 */
    color: #212529;          /* 진한 회색 텍스트 */
    overflow: hidden;        /* 스크롤 숨김 */
    user-select: none;       /* 텍스트 선택 방지 */
}
```

### 뷰 모드 시스템 (41~44줄)

```css
/* 3가지 뷰 모드 지원 */
body.edit-mode { }       /* 편집 모드 (기본값) */
body.compress-mode { }   /* 압축 모드 */
body.print-mode { }      /* 인쇄 모드 */
```

### 헤더 스타일 (46~177줄)

```css
.header {
    height: 56px;                               /* 고정 높이 */
    background: #fff;                           /* 흰색 배경 */
    border-bottom: 2px solid #e9ecef;          /* 하단 테두리 */
    display: flex;                              /* 플렉스 레이아웃 */
    align-items: center;                        /* 세로 중앙 정렬 */
    justify-content: space-between;             /* 양쪽 끝 정렬 */
    padding: 0 24px;                           /* 좌우 패딩 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); /* 그림자 */
}

.logo-icon {
    width: 32px;                                /* 32x32 정사각형 */
    height: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 그라데이션 */
    border-radius: 8px;                         /* 둥근 모서리 */
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 16px;                           /* TP 글자 크기 */
}
```

### 메인 레이아웃 (179~207줄)

```css
.main-layout {
    display: grid;
    grid-template-columns: 1fr 240px;  /* 좌측: 확장 가능, 우측: 240px 고정 */
    height: calc(100vh - 56px);        /* 전체 화면 높이 - 헤더 높이 */
    background: #f8f9fa;
}

.timeline-area {
    background: #fff;                   /* 흰색 배경 */
    overflow: auto;                     /* 스크롤 가능 */
    position: relative;
    margin: 16px;                       /* 16px 여백 */
    border-radius: 12px;                /* 둥근 모서리 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); /* 그림자 */
}
```

### 적응형 타임라인 시스템 (210~360줄)

#### 개별 타임바 시스템 (222~291줄)

```css
.day-timebar {
    width: 25px;                       /* 타임바 너비 (기존 45px에서 44% 감소) */
    background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
    border-right: 1px solid #dee2e6;
    position: relative;
    flex-shrink: 0;                    /* 축소 방지 */
}

.time-range-header {
    height: 48px;                      /* 헤더 높이 */
    border-bottom: 2px solid #333;     /* 진한 하단 테두리 */
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    writing-mode: vertical-rl;         /* 세로 텍스트 */
    text-orientation: mixed;
}

.individual-time-label {
    height: 60px;                      /* 1시간 = 60px (1픽셀 = 1분) */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;                   /* 작은 폰트 */
    color: #495057;
    border-bottom: 1px solid #f1f3f5;
    position: relative;
    font-weight: 600;
}
```

#### 시간 블록 색상 시스템 (323~342줄)

```css
.time-label.dawn-block {
    background: #f3f0ff;              /* 연보라 (새벽 0-6시) */
    color: #6c5ce7;
}

.time-label.morning-block {
    background: #fff3e0;              /* 연주황 (오전 6-12시) */
    color: #f57c00;
}

.time-label.afternoon-block {
    background: #e8f5e9;              /* 연초록 (오후 12-18시) */
    color: #2e7d32;
}

.time-label.evening-block {
    background: #fce4ec;              /* 연분홍 (저녁 18-24시) */
    color: #c2185b;
}
```

### 날짜 컬럼 시스템 (361~396줄)

```css
.day-column {
    width: 150px;                      /* 기본 컬럼 너비 */
    border-right: 1px solid #e9ecef;  /* 우측 테두리 */
    position: relative;
    background: #fff;
}

/* 압축 모드에서 너비 축소 */
body.compress-mode .day-column,
body.print-mode .day-column {
    width: 130px;                      /* 130px로 축소 (13% 감소) */
}

.day-header {
    height: 48px;                      /* 헤더 높이 */
    background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
    border-bottom: 2px solid #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    color: #495057;
    font-weight: 700;                  /* 굵은 글꼴 */
    position: sticky;                  /* 스티키 포지션 */
    top: 0;
    z-index: 10;                       /* 레이어 순서 */
    letter-spacing: -0.3px;            /* 글자 간격 좁히기 */
}
```

### 시간 슬롯 시스템 (397~484줄)

```css
.time-slot {
    height: 60px;                      /* 1시간 = 60px */
    border-bottom: 1px solid #f1f3f5;
    position: relative;
    cursor: pointer;
    transition: all 0.2s;
}

/* 10분 단위 가이드라인 */
.time-slot::before,
.time-slot::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 1px;
    background: #f8f9fa;
    pointer-events: none;              /* 마우스 이벤트 무시 */
}

.time-slot::before {
    top: 33.33%;                       /* 20분 지점 */
}

.time-slot::after {
    top: 66.66%;                       /* 40분 지점 */
}

/* 호버 효과 */
.time-slot:hover {
    background: rgba(102, 126, 234, 0.04);
}

/* 드래그 오버 효과 (6가지 10분 단위) */
.time-slot.drag-over-10 {
    background: linear-gradient(to bottom, 
        rgba(102, 126, 234, 0.2) 0%, 
        rgba(102, 126, 234, 0.2) 16.66%, 
        transparent 16.66%);
}
/* ... drag-over-20, 30, 40, 50, 60 동일한 패턴 */
```

### 플랜박스 스타일 시스템 (500~1,200줄)

#### 기본 플랜박스 구조 (500~600줄)

```css
.planbox {
    width: 140px;                      /* 기본 너비 */
    min-height: 60px;                  /* 최소 높이 (1시간) */
    border: 2px solid #dee2e6;
    border-radius: 8px;                /* 둥근 모서리 */
    background: #fff;
    cursor: move;                      /* 드래그 커서 */
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); /* 부드러운 전환 */
    position: relative;
    display: flex;
    flex-direction: column;
    font-size: 12px;                   /* 기본 폰트 크기 */
    line-height: 1.3;
    overflow: hidden;                  /* 내용 잘림 처리 */
}

/* 카테고리별 색상 */
.planbox.food { border-color: #4CAF50; }
.planbox.transport { border-color: #2196F3; }
.planbox.activity { border-color: #9C27B0; }
.planbox.sightseeing { border-color: #FF9800; }
.planbox.shopping { border-color: #E91E63; }
.planbox.accommodation { border-color: #673AB7; }
```

#### 박스 크기별 적응형 스타일 (700~900줄)

```css
/* 20분 박스 (기본) */
.planbox.size-20 {
    min-height: 20px;
}

.planbox.size-20 .planbox-title {
    font-size: 11px;                   /* 제목 폰트 크기 */
    line-height: 1.2;
    padding: 2px 4px;
}

.planbox.size-20 .planbox-memo {
    display: none;                     /* 메모 숨김 */
}

/* 30분 박스 */
.planbox.size-30 {
    min-height: 30px;
}

.planbox.size-30 .planbox-title {
    font-size: 12px;
    line-height: 1.3;
    padding: 3px 6px;
}

.planbox.size-30 .planbox-memo {
    font-size: 10px;                   /* 작은 메모 텍스트 */
    line-height: 1.2;
    padding: 0 6px 2px;
    max-height: 12px;                  /* 1줄만 표시 */
    overflow: hidden;
    text-overflow: ellipsis;           /* 말줄임표 */
    white-space: nowrap;
}

/* 40분 박스 */
.planbox.size-40 {
    min-height: 40px;
}

.planbox.size-40 .planbox-memo {
    max-height: 24px;                  /* 2줄 표시 */
    white-space: normal;               /* 줄바꿈 허용 */
}

/* 50분 박스 */
.planbox.size-50 {
    min-height: 50px;
}

.planbox.size-50 .planbox-memo {
    max-height: 36px;                  /* 3줄 표시 */
}

/* 60분+ 박스 */
.planbox.size-60 {
    min-height: 60px;
}

.planbox.size-60 .planbox-memo {
    max-height: none;                  /* 제한 없음 */
}
```

#### 플랜박스 내부 요소들 (900~1,100줄)

```css
.planbox-time {
    font-size: 10px;                   /* 시간 표시 폰트 */
    font-weight: 600;
    color: #666;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.05);   /* 연한 회색 배경 */
    border-radius: 4px 4px 0 0;        /* 상단만 둥근 모서리 */
}

.planbox-title {
    font-weight: 600;
    color: #333;
    padding: 4px 6px;
    cursor: text;                      /* 텍스트 편집 커서 */
    border: none;
    background: transparent;
    resize: none;                      /* 리사이즈 불가 */
}

.planbox-memo {
    color: #666;
    padding: 2px 6px;
    flex: 1;                          /* 남은 공간 차지 */
    display: -webkit-box;
    -webkit-line-clamp: var(--memo-lines); /* CSS 변수로 줄 수 제어 */
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.planbox-cost {
    font-size: 11px;
    font-weight: 600;
    color: #e91e63;                   /* 분홍색 */
    padding: 2px 6px;
    background: rgba(233, 30, 99, 0.1); /* 연한 분홍 배경 */
    border-radius: 0 0 6px 6px;       /* 하단만 둥근 모서리 */
}

.planbox-location {
    font-size: 10px;
    color: #999;
    padding: 1px 6px;
    opacity: 0.8;
}
```

### 드래그앤드롭 상태 스타일 (1,100~1,200줄)

```css
.planbox.dragging {
    opacity: 0.8;                      /* 반투명 */
    transform: scale(1.05);            /* 1.05배 확대 */
    z-index: 1000;                     /* 최상위 레이어 */
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3); /* 진한 그림자 */
}

.planbox.placed {
    position: absolute;                /* 절대 위치 */
    left: 4px;                        /* 왼쪽 여백 */
    right: 4px;                       /* 오른쪽 여백 */
    width: auto;                      /* 자동 너비 */
    z-index: 5;
}

.planbox.clone-mode {
    border: 2px dashed #667eea !important; /* 점선 테두리 */
    background: rgba(102, 126, 234, 0.1) !important; /* 연한 파란 배경 */
}

/* 리사이즈 핸들 */
.resize-handle {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 10px;                     /* 하단 10px 영역 */
    cursor: ns-resize;                /* 세로 리사이즈 커서 */
    background: transparent;
}

.resize-handle:hover::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 3px;
    background: #667eea;              /* 파란색 인디케이터 */
    border-radius: 2px;
}
```

### 모달 시스템 (1,200~1,800줄)

#### 기본 모달 구조 (1,200~1,300줄)

```css
.modal {
    display: none;                     /* 기본적으로 숨김 */
    position: fixed;
    z-index: 2000;                     /* 최상위 레이어 */
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5); /* 반투명 배경 */
    animation: fadeIn 0.3s ease;       /* 페이드인 애니메이션 */
}

.modal-content {
    background-color: #fff;
    margin: 5% auto;
    padding: 24px;
    border: none;
    border-radius: 12px;              /* 둥근 모서리 */
    width: 90%;
    max-width: 550px;                 /* 최대 너비 550px */
    position: relative;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); /* 그림자 */
    animation: slideIn 0.3s ease;     /* 슬라이드인 애니메이션 */
}

/* 애니메이션 정의 */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideIn {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}
```

#### 플랜박스 모달 (1,300~1,500줄)

```css
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e9ecef;
}

.modal-title {
    font-size: 18px;
    font-weight: 700;
    color: #333;
    margin: 0;
}

.close {
    color: #999;
    font-size: 24px;
    font-weight: 400;
    cursor: pointer;
    border: none;
    background: none;
    padding: 0;
    transition: color 0.2s;
}

.close:hover {
    color: #333;
}

/* 폼 스타일 */
.form-group {
    margin-bottom: 16px;
}

.form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 600;
    color: #333;
    font-size: 14px;
}

.form-control {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-control:focus {
    outline: none;
    border-color: #667eea;            /* 포커스 시 파란 테두리 */
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); /* 포커스 박스섀도 */
}

textarea.form-control {
    resize: vertical;                  /* 세로 리사이즈만 허용 */
    min-height: 80px;
}
```

### 반응형 및 압축 모드 (1,800~2,049줄)

#### 압축 모드 스타일 (1,800~1,900줄)

```css
body.compress-mode .time-slot.empty {
    height: 20px;                     /* 빈 슬롯 높이 축소 */
    background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 10px,
        #f8f9fa 10px,
        #f8f9fa 20px
    );                               /* 대각선 패턴 */
}

body.compress-mode .planbox {
    font-size: 11px;                 /* 폰트 크기 축소 */
}

body.compress-mode .timeline-area {
    margin: 8px;                     /* 여백 축소 */
}
```

#### 인쇄 모드 스타일 (1,900~2,000줄)

```css
@media print {
    .header {
        display: none;                /* 헤더 숨김 */
    }
    
    .planbox-area {
        display: none;                /* 플랜박스 패널 숨김 */
    }
    
    .main-layout {
        grid-template-columns: 1fr;   /* 단일 컬럼 */
    }
    
    .planbox {
        box-shadow: none;             /* 그림자 제거 */
        border: 1px solid #000 !important; /* 검은색 테두리 */
    }
}

body.print-mode {
    /* 인쇄 모드 시뮬레이션 */
    overflow: visible;
}
```

---

## 💻 JavaScript 구조 분석 (4,998줄)

### 전역 변수 시스템 (2,418~2,447줄)

```javascript
// 핵심 데이터 구조
let planboxData = [];              // 플랜박스 템플릿 데이터
let placedBoxes = {};              // 배치된 박스들 {id: 박스객체}
let draggedElement = null;         // 현재 드래그 중인 요소
let editingBoxId = null;          // 편집 중인 박스 ID

// 시간 관리
let occupiedSlots = {};           // 점유된 시간 슬롯 {day-hour-minute: boxId}
let timeRangeStart = 7;          // 기본 시작 시간 (7시)
let timeRangeEnd = 23;           // 기본 종료 시간 (23시)
let dayTimeRanges = {};          // 날짜별 개별 시간대 {day: {start, end}}

// UI 상태
let isCloneMode = false;         // 복제 모드
let isDragMode = false;          // 드래그 모드
let viewMode = 'edit';           // 현재 뷰 모드
let tripData = null;             // 여행 기본 정보

// 자동 저장
let autoSaveInterval = null;     // 자동 저장 인터벌
let hasChanges = false;          // 변경 사항 추적
```

### 초기화 시스템 (2,448~2,500줄)

```javascript
function init() {
    console.log('TimePlanBox v10.0 Adaptive - 초기화 시작');
    
    try {
        // 1. localStorage에서 데이터 로드
        loadFromLocalStorage();
        
        // 2. 여행 정보가 없으면 초기 설정 모달
        if (!tripData) {
            openInitModal();
        }
        
        // 3. 플랜박스 패널 생성
        createPlanboxPanel();
        
        // 4. 타임라인 생성
        createTimeLabels();
        createDayColumns();
        
        // 5. 배치된 박스들 복원
        restorePlacedBoxes();
        
        // 6. 이벤트 리스너 등록
        setupEventListeners();
        
        // 7. 리사이즈 이벤트 설정
        setupResizeEvents();
        
        // 8. 자동 저장 활성화
        enableAutoSave();
        
        console.log('초기화 완료');
    } catch (error) {
        console.error('초기화 오류:', error);
    }
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', init);
```

### 타임라인 생성 시스템 (2,500~2,800줄)

#### 시간 라벨 생성 (2,500~2,600줄)

```javascript
function createTimeLabels() {
    const container = document.getElementById('timelineContainer');
    
    // 기존 내용 제거
    container.innerHTML = '';
    
    // 개별 타임바 시스템 생성
    const dayTimebars = document.createElement('div');
    dayTimebars.className = 'day-timebars';
    
    // 각 날짜별 타임바 생성
    for (let day = 0; day < tripData.days; day++) {
        const timebar = createDayTimebar(day);
        dayTimebars.appendChild(timebar);
    }
    
    container.appendChild(dayTimebars);
}

function createDayTimebar(day) {
    const timebar = document.createElement('div');
    timebar.className = 'day-timebar';
    timebar.dataset.day = day;
    
    // 해당 날짜의 시간 범위 가져오기
    const range = dayTimeRanges[day] || {start: timeRangeStart, end: timeRangeEnd};
    
    // 헤더 생성
    const header = document.createElement('div');
    header.className = 'time-range-header';
    
    // 시간 범위 표시
    const rangeText = document.createElement('div');
    rangeText.className = 'time-range-text';
    rangeText.textContent = `${range.start}-${range.end}`;
    header.appendChild(rangeText);
    
    // 프리셋 버튼들
    const presetButtons = document.createElement('div');
    presetButtons.className = 'time-preset-buttons';
    
    const standardBtn = document.createElement('button');
    standardBtn.className = 'preset-btn';
    standardBtn.textContent = '표준';
    standardBtn.onclick = () => setDayTimeRange(day, 7, 23);
    
    const customBtn = document.createElement('button');
    customBtn.className = 'preset-btn';
    customBtn.textContent = '설정';
    customBtn.onclick = () => openCustomTimeModal(day);
    
    presetButtons.appendChild(standardBtn);
    presetButtons.appendChild(customBtn);
    header.appendChild(presetButtons);
    
    timebar.appendChild(header);
    
    // 시간 라벨들 생성
    for (let hour = range.start; hour <= range.end; hour++) {
        const timeLabel = document.createElement('div');
        timeLabel.className = 'individual-time-label';
        
        // 시간대별 색상 적용
        const timeBlock = getTimeBlock(hour);
        timeLabel.classList.add(`${timeBlock}-block`);
        
        // 시간 텍스트 (24시간 → 0시 변환)
        const displayHour = hour === 24 ? 0 : hour;
        timeLabel.textContent = displayHour;
        
        timebar.appendChild(timeLabel);
    }
    
    return timebar;
}
```

#### 날짜 컬럼 생성 (2,600~2,700줄)

```javascript
function createDayColumns() {
    const container = document.getElementById('timelineContainer');
    let columnsContainer = container.querySelector('.day-columns');
    
    if (!columnsContainer) {
        columnsContainer = document.createElement('div');
        columnsContainer.className = 'day-columns';
        container.appendChild(columnsContainer);
    }
    
    columnsContainer.innerHTML = '';
    
    // 각 날짜별 컬럼 생성
    for (let day = 0; day < tripData.days; day++) {
        const dayColumn = createDayColumn(day);
        columnsContainer.appendChild(dayColumn);
    }
}

function createDayColumn(day) {
    const column = document.createElement('div');
    column.className = 'day-column';
    column.dataset.day = day;
    
    // 날짜 헤더
    const header = document.createElement('div');
    header.className = 'day-header';
    
    const date = new Date(tripData.startDate);
    date.setDate(date.getDate() + day);
    
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[date.getDay()];
    const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
    
    header.innerHTML = `
        <div class="day-number">Day ${day + 1}</div>
        <div class="day-date">${monthDay} (${dayName})</div>
    `;
    
    column.appendChild(header);
    
    // 시간 그리드 생성
    const timeGrid = createTimeGrid(day);
    column.appendChild(timeGrid);
    
    return column;
}

function createTimeGrid(day) {
    const grid = document.createElement('div');
    grid.className = 'time-grid';
    grid.dataset.day = day;
    
    const range = dayTimeRanges[day] || {start: timeRangeStart, end: timeRangeEnd};
    
    // 각 시간대별 슬롯 생성
    for (let hour = range.start; hour <= range.end; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        timeSlot.dataset.day = day;
        timeSlot.dataset.hour = hour;
        
        // 빈 시간대인지 확인
        if (!hasEventsInHour(day, hour)) {
            timeSlot.classList.add('empty');
        }
        
        // 드래그앤드롭 이벤트
        timeSlot.addEventListener('dragover', handleDragOver);
        timeSlot.addEventListener('drop', handleDrop);
        timeSlot.addEventListener('click', (e) => {
            const rect = timeSlot.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const minute = Math.floor((y / 60) * 60 / 10) * 10; // 10분 단위
            showAddModal(hour, minute);
        });
        
        grid.appendChild(timeSlot);
    }
    
    return grid;
}
```

### 플랜박스 관리 시스템 (2,800~3,200줄)

#### 플랜박스 생성 (2,800~2,900줄)

```javascript
function createPlanbox(data) {
    const planbox = document.createElement('div');
    planbox.className = `planbox ${data.category}`;
    planbox.draggable = true;
    planbox.dataset.id = data.id;
    
    // 기본 구조 생성
    planbox.innerHTML = `
        <div class="planbox-time">${formatTime(data.startHour, data.startMinute)} (${data.duration}분)</div>
        <textarea class="planbox-title" readonly>${data.title}</textarea>
        <div class="planbox-memo">${data.memo || ''}</div>
        ${data.cost ? `<div class="planbox-cost">${formatCost(data.cost)}</div>` : ''}
        ${data.location ? `<div class="planbox-location">${data.location}</div>` : ''}
        <div class="resize-handle"></div>
    `;
    
    // 박스 크기 클래스 적용
    updateBoxSizeClass(planbox, data.duration);
    
    // 드래그 이벤트
    planbox.addEventListener('dragstart', handleDragStart);
    planbox.addEventListener('dragend', handleDragEnd);
    
    // 더블클릭으로 편집
    planbox.addEventListener('dblclick', () => editPlacedBox(planbox));
    
    // 인라인 제목 편집
    const titleElement = planbox.querySelector('.planbox-title');
    titleElement.addEventListener('click', (e) => {
        e.stopPropagation();
        enableInlineTitleEdit(titleElement);
    });
    
    return planbox;
}

function updateBoxSizeClass(planbox, duration) {
    // 기존 크기 클래스 제거
    planbox.classList.remove('size-20', 'size-30', 'size-40', 'size-50', 'size-60');
    
    // 새 크기 클래스 추가
    if (duration <= 20) {
        planbox.classList.add('size-20');
    } else if (duration <= 30) {
        planbox.classList.add('size-30');
    } else if (duration <= 40) {
        planbox.classList.add('size-40');
    } else if (duration <= 50) {
        planbox.classList.add('size-50');
    } else {
        planbox.classList.add('size-60');
    }
    
    // 메모 줄 수 계산
    calculateMemoLines(planbox, duration);
}

function calculateMemoLines(planbox, duration) {
    let memoLines = 0;
    
    if (duration >= 30) memoLines = 1;      // 30분: 1줄
    if (duration >= 40) memoLines = 2;      // 40분: 2줄
    if (duration >= 50) memoLines = 3;      // 50분: 3줄
    if (duration >= 60) memoLines = 4;      // 60분+: 4줄
    
    const memoElement = planbox.querySelector('.planbox-memo');
    if (memoElement) {
        memoElement.style.setProperty('--memo-lines', memoLines);
        
        // 메모가 없으면 숨김
        if (!memoElement.textContent.trim()) {
            memoElement.style.display = 'none';
        } else {
            memoElement.style.display = memoLines > 0 ? 'block' : 'none';
        }
    }
}
```

#### 플랜박스 배치 (2,900~3,000줄)

```javascript
function createPlacedBox(data, day, hour, minute) {
    const placedBox = createPlanbox(data);
    placedBox.classList.add('placed');
    
    // 위치 계산
    const position = calculateBoxPosition(day, hour, minute);
    placedBox.style.top = position.top + 'px';
    placedBox.style.height = data.duration + 'px';  // 1픽셀 = 1분
    
    // 해당 날짜 컬럼에 추가
    const dayColumn = document.querySelector(`[data-day="${day}"] .time-grid`);
    if (dayColumn) {
        dayColumn.appendChild(placedBox);
        
        // 시간 슬롯 점유
        occupyTimeSlots(day, hour, minute, data.duration, placedBox);
        
        // placedBoxes에 등록
        placedBoxes[data.id] = {
            element: placedBox,
            data: data,
            day: day,
            hour: hour,
            minute: minute
        };
        
        console.log(`플랜박스 배치: ${data.title} (${day}일차 ${hour}:${minute.toString().padStart(2, '0')})`);
        
        // 변경 사항 표시
        markAsChanged();
    }
    
    return placedBox;
}

function calculateBoxPosition(day, hour, minute) {
    const range = dayTimeRanges[day] || {start: timeRangeStart, end: timeRangeEnd};
    
    // 헤더 높이 (48px) + (시간 - 시작시간) * 60px + 분
    const headerHeight = 48;
    const hoursFromStart = hour - range.start;
    const top = headerHeight + (hoursFromStart * 60) + minute;
    
    return { top };
}

function movePlacedBox(boxId, newDay, newHour, newMinute) {
    const boxInfo = placedBoxes[boxId];
    if (!boxInfo) return false;
    
    const { element, data } = boxInfo;
    
    // 충돌 검사
    if (checkTimeConflict(newDay, newHour, newMinute, data.duration, element)) {
        showConflictModal();
        return false;
    }
    
    // 기존 슬롯 해제
    releaseOccupiedSlots(element);
    
    // 새 위치로 이동
    const newPosition = calculateBoxPosition(newDay, newHour, newMinute);
    element.style.top = newPosition.top + 'px';
    
    // 다른 날짜로 이동하는 경우 컬럼 변경
    if (newDay !== boxInfo.day) {
        const newDayColumn = document.querySelector(`[data-day="${newDay}"] .time-grid`);
        if (newDayColumn) {
            newDayColumn.appendChild(element);
        }
    }
    
    // 새 슬롯 점유
    occupyTimeSlots(newDay, newHour, newMinute, data.duration, element);
    
    // 정보 업데이트
    boxInfo.day = newDay;
    boxInfo.hour = newHour;
    boxInfo.minute = newMinute;
    data.startHour = newHour;
    data.startMinute = newMinute;
    
    // 시간 표시 업데이트
    const timeElement = element.querySelector('.planbox-time');
    timeElement.textContent = `${formatTime(newHour, newMinute)} (${data.duration}분)`;
    
    markAsChanged();
    return true;
}
```

### 드래그앤드롭 시스템 (3,200~3,600줄)

#### 드래그 시작 (3,200~3,300줄)

```javascript
function handleDragStart(e) {
    draggedElement = e.target.closest('.planbox');
    
    if (!draggedElement) return;
    
    console.log('드래그 시작:', draggedElement.dataset.id);
    
    // 클론 모드 체크 (Alt 키)
    if (e.altKey && !isCloneMode) {
        enableCloneMode();
    }
    
    // 드래그 상태 스타일 적용
    draggedElement.classList.add('dragging');
    
    // 드래그 데이터 설정
    const boxData = getBoxDataById(draggedElement.dataset.id);
    e.dataTransfer.setData('text/plain', JSON.stringify({
        id: draggedElement.dataset.id,
        isPlaced: draggedElement.classList.contains('placed'),
        isClone: isCloneMode,
        ...boxData
    }));
    
    // 고스트 이미지 업데이트
    updateDragGhost(e, boxData);
    
    e.dataTransfer.effectAllowed = isCloneMode ? 'copy' : 'move';
}

function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        draggedElement = null;
    }
    
    // 드래그 오버 효과 제거
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('drag-over', 'drag-over-10', 'drag-over-20', 
                             'drag-over-30', 'drag-over-40', 'drag-over-50', 'drag-over-60');
    });
    
    if (isCloneMode) {
        disableCloneMode();
    }
    
    console.log('드래그 종료');
}

function updateDragGhost(e, boxData) {
    // 커스텀 드래그 고스트 생성
    const ghost = document.createElement('div');
    ghost.className = `planbox ${boxData.category}`;
    ghost.style.width = '140px';
    ghost.style.height = boxData.duration + 'px';
    ghost.innerHTML = `
        <div class="planbox-time">${formatTime(boxData.startHour, boxData.startMinute)} (${boxData.duration}분)</div>
        <div class="planbox-title">${boxData.title}</div>
        <div class="planbox-memo">${boxData.memo || ''}</div>
    `;
    
    document.body.appendChild(ghost);
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';  // 화면 밖에 배치
    
    e.dataTransfer.setDragImage(ghost, 70, boxData.duration / 2);
    
    setTimeout(() => document.body.removeChild(ghost), 0);
}
```

#### 드래그 오버 및 드롭 (3,300~3,500줄)

```javascript
function handleDragOver(e) {
    e.preventDefault();
    
    const timeSlot = e.target.closest('.time-slot');
    if (!timeSlot) return;
    
    // 드롭 가능한 위치 계산
    const rect = timeSlot.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minute = Math.floor((y / 60) * 60 / 10) * 10; // 10분 단위 스냅
    
    // 기존 드래그 오버 효과 제거
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('drag-over', 'drag-over-10', 'drag-over-20', 
                             'drag-over-30', 'drag-over-40', 'drag-over-50', 'drag-over-60');
    });
    
    // 새 드래그 오버 효과 적용
    timeSlot.classList.add('drag-over');
    timeSlot.classList.add(`drag-over-${minute}`);
    
    e.dataTransfer.dropEffect = isCloneMode ? 'copy' : 'move';
}

function handleDrop(e) {
    e.preventDefault();
    
    const timeSlot = e.target.closest('.time-slot');
    if (!timeSlot) return;
    
    try {
        const dropData = JSON.parse(e.dataTransfer.getData('text/plain'));
        
        // 드롭 위치 계산
        const day = parseInt(timeSlot.dataset.day);
        const hour = parseInt(timeSlot.dataset.hour);
        const rect = timeSlot.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const minute = Math.floor((y / 60) * 60 / 10) * 10; // 10분 단위
        
        console.log(`드롭 시도: Day ${day}, ${hour}:${minute.toString().padStart(2, '0')}`);
        
        // 충돌 검사
        const excludeBox = dropData.isPlaced && !dropData.isClone ? 
                          placedBoxes[dropData.id]?.element : null;
        
        if (checkTimeConflict(day, hour, minute, dropData.duration, excludeBox)) {
            showConflictModal();
            return;
        }
        
        if (dropData.isClone) {
            // 복제 모드: 새 박스 생성
            const newBoxData = {
                ...dropData,
                id: 'box_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            };
            createPlacedBox(newBoxData, day, hour, minute);
        } else if (dropData.isPlaced) {
            // 이동 모드: 기존 박스 이동
            movePlacedBox(dropData.id, day, hour, minute);
        } else {
            // 새 배치: 템플릿에서 배치
            createPlacedBox(dropData, day, hour, minute);
        }
        
        // 시간대 자동 확장 체크
        checkExtendedTimeRange(day, hour, minute, dropData.duration);
        
    } catch (error) {
        console.error('드롭 오류:', error);
    } finally {
        // 드래그 오버 효과 제거
        timeSlot.classList.remove('drag-over', 'drag-over-10', 'drag-over-20', 
                                 'drag-over-30', 'drag-over-40', 'drag-over-50', 'drag-over-60');
    }
}

function checkExtendedTimeRange(day, hour, minute, duration) {
    const range = dayTimeRanges[day] || {start: timeRangeStart, end: timeRangeEnd};
    const endHour = hour + Math.ceil((minute + duration) / 60) - 1;
    
    let needUpdate = false;
    
    // 시작 시간 확장 필요한지 체크
    if (hour < range.start) {
        range.start = hour;
        needUpdate = true;
    }
    
    // 종료 시간 확장 필요한지 체크
    if (endHour > range.end) {
        range.end = endHour;
        needUpdate = true;
    }
    
    if (needUpdate) {
        dayTimeRanges[day] = range;
        console.log(`Day ${day} 시간대 확장: ${range.start}:00 - ${range.end}:00`);
        
        // 타임라인 다시 생성
        createTimeLabels();
        createDayColumns();
        restorePlacedBoxes();
    }
}
```

### 리사이즈 시스템 (3,600~3,800줄)

#### 리사이즈 이벤트 설정 (3,600~3,700줄)

```javascript
function setupResizeEvents() {
    let isResizing = false;
    let resizeBox = null;
    let startY = 0;
    let startHeight = 0;
    let resizeDirection = null; // 'bottom' 또는 'top'
    
    // 이벤트 위임으로 동적 요소 처리
    document.addEventListener('mousedown', (e) => {
        const planbox = e.target.closest('.planbox.placed');
        if (!planbox) return;
        
        const rect = planbox.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        // 하단 10px 영역에서 리사이즈
        if (y > rect.height - 10) {
            startResize(e, planbox, 'bottom');
        }
        // 상단 10px 영역에서 리사이즈 (Ctrl+마우스)
        else if (y < 10 && e.ctrlKey) {
            startResize(e, planbox, 'top');
        }
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) {
            // 커서 변경 로직
            const planbox = e.target.closest('.planbox.placed');
            if (planbox) {
                const rect = planbox.getBoundingClientRect();
                const y = e.clientY - rect.top;
                
                if (y > rect.height - 10) {
                    planbox.style.cursor = 'ns-resize';
                    showResizeBadge(planbox, 'bottom');
                } else if (y < 10 && e.ctrlKey) {
                    planbox.style.cursor = 'ns-resize';
                    showResizeBadge(planbox, 'top');
                } else {
                    planbox.style.cursor = 'move';
                    hideResizeBadge(planbox);
                }
            }
            return;
        }
        
        // 리사이즈 진행
        e.preventDefault();
        performResize(e);
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            finishResize();
        }
    });
    
    function startResize(e, planbox, direction) {
        e.preventDefault();
        e.stopPropagation();
        
        isResizing = true;
        resizeBox = planbox;
        resizeDirection = direction;
        startY = e.clientY;
        startHeight = planbox.offsetHeight;
        
        planbox.classList.add('resizing');
        console.log(`리사이즈 시작: ${direction} 방향`);
    }
    
    function performResize(e) {
        if (!resizeBox) return;
        
        const deltaY = e.clientY - startY;
        let newHeight;
        
        if (resizeDirection === 'bottom') {
            newHeight = startHeight + deltaY;
        } else { // top
            newHeight = startHeight - deltaY;
        }
        
        // 최소/최대 높이 제한
        newHeight = Math.max(20, Math.min(600, newHeight)); // 20분~10시간
        
        // 10분 단위로 스냅
        newHeight = Math.round(newHeight / 10) * 10;
        
        // 높이 적용
        resizeBox.style.height = newHeight + 'px';
        
        // 실시간 시간 배지 표시
        updateResizeBadge(resizeBox, newHeight, resizeDirection);
    }
    
    function finishResize() {
        if (!resizeBox) return;
        
        const newDuration = parseInt(resizeBox.style.height);
        const boxData = getBoxDataById(resizeBox.dataset.id);
        const boxInfo = placedBoxes[resizeBox.dataset.id];
        
        if (boxData && boxInfo) {
            // 데이터 업데이트
            boxData.duration = newDuration;
            
            // 상단 리사이즈의 경우 시작 시간도 조정
            if (resizeDirection === 'top') {
                const timeDiff = (parseInt(resizeBox.style.height) - startHeight);
                const newStartMinute = boxInfo.minute - timeDiff;
                
                if (newStartMinute >= 0) {
                    boxInfo.minute = newStartMinute;
                    boxData.startMinute = newStartMinute;
                    
                    // 위치 재계산
                    const newPosition = calculateBoxPosition(boxInfo.day, boxInfo.hour, newStartMinute);
                    resizeBox.style.top = newPosition.top + 'px';
                }
            }
            
            // 박스 크기 클래스 업데이트
            updateBoxSizeClass(resizeBox, newDuration);
            
            // 시간 표시 업데이트
            const timeElement = resizeBox.querySelector('.planbox-time');
            timeElement.textContent = `${formatTime(boxData.startHour, boxData.startMinute)} (${newDuration}분)`;
            
            // 충돌 재검사 (필요한 경우)
            const conflicts = checkTimeConflictDetail(boxInfo.day, boxInfo.hour, boxInfo.minute, newDuration, resizeBox);
            if (conflicts.length > 0) {
                console.warn('리사이즈 후 충돌 감지:', conflicts);
            }
            
            markAsChanged();
            console.log(`리사이즈 완료: ${boxData.title} -> ${newDuration}분`);
        }
        
        // 정리
        resizeBox.classList.remove('resizing');
        hideResizeBadge(resizeBox);
        
        isResizing = false;
        resizeBox = null;
        resizeDirection = null;
    }
}
```

#### 리사이즈 UI 피드백 (3,700~3,800줄)

```javascript
function showResizeBadge(planbox, direction) {
    let badge = planbox.querySelector('.resize-badge');
    
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'resize-badge';
        planbox.appendChild(badge);
    }
    
    const boxData = getBoxDataById(planbox.dataset.id);
    const currentDuration = boxData.duration;
    
    if (direction === 'bottom') {
        const endTime = calculateEndTime(boxData.startHour, boxData.startMinute, currentDuration);
        badge.textContent = `~${formatTime(endTime.hour, endTime.minute)}`;
        badge.className = 'resize-badge bottom';
    } else {
        badge.textContent = `${formatTime(boxData.startHour, boxData.startMinute)}~`;
        badge.className = 'resize-badge top';
    }
    
    badge.style.display = 'block';
}

function updateResizeBadge(planbox, newHeight, direction) {
    const badge = planbox.querySelector('.resize-badge');
    if (!badge) return;
    
    const boxData = getBoxDataById(planbox.dataset.id);
    const newDuration = newHeight; // 1px = 1분
    
    if (direction === 'bottom') {
        const endTime = calculateEndTime(boxData.startHour, boxData.startMinute, newDuration);
        badge.textContent = `~${formatTime(endTime.hour, endTime.minute)}`;
    } else {
        // 상단 리사이즈: 시작 시간 계산
        const boxInfo = placedBoxes[planbox.dataset.id];
        const timeDiff = newHeight - planbox.offsetHeight;
        const newStartMinute = boxInfo.minute - timeDiff;
        
        if (newStartMinute >= 0) {
            badge.textContent = `${formatTime(boxInfo.hour, newStartMinute)}~`;
        }
    }
}

function hideResizeBadge(planbox) {
    const badge = planbox.querySelector('.resize-badge');
    if (badge) {
        badge.style.display = 'none';
    }
}

// 시간 계산 유틸리티
function calculateEndTime(startHour, startMinute, duration) {
    const totalMinutes = startHour * 60 + startMinute + duration;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = totalMinutes % 60;
    
    return { hour: endHour, minute: endMinute };
}
```

### 충돌 감지 시스템 (3,800~4,000줄)

#### 기본 충돌 검사 (3,800~3,900줄)

```javascript
function checkTimeConflict(day, hour, minute, duration, excludeBox = null) {
    const conflicts = checkTimeConflictDetail(day, hour, minute, duration, excludeBox);
    return conflicts.length > 0;
}

function checkTimeConflictDetail(day, hour, minute, duration, excludeBox = null) {
    const conflicts = [];
    
    // 점유할 시간 슬롯들 계산
    const slotsToCheck = [];
    for (let m = 0; m < duration; m++) {
        const currentMinute = minute + m;
        const currentHour = hour + Math.floor(currentMinute / 60);
        const normalizedMinute = currentMinute % 60;
        
        slotsToCheck.push(`${day}-${currentHour}-${normalizedMinute}`);
    }
    
    // 충돌 검사
    for (const slot of slotsToCheck) {
        const occupyingBoxId = occupiedSlots[slot];
        if (occupyingBoxId) {
            const occupyingBox = placedBoxes[occupyingBoxId];
            
            // 제외할 박스가 아니고, 실제 존재하는 박스인 경우
            if (occupyingBox && occupyingBox.element !== excludeBox) {
                conflicts.push({
                    slot: slot,
                    conflictBox: occupyingBox,
                    time: slot.split('-').slice(1).join(':')
                });
            }
        }
    }
    
    return conflicts;
}

function occupyTimeSlots(day, hour, minute, duration, box) {
    const boxId = box.dataset.id;
    
    console.log(`시간 슬롯 점유: ${boxId} (${day}일차 ${hour}:${minute.toString().padStart(2, '0')}, ${duration}분)`);
    
    for (let m = 0; m < duration; m++) {
        const currentMinute = minute + m;
        const currentHour = hour + Math.floor(currentMinute / 60);
        const normalizedMinute = currentMinute % 60;
        
        const slotKey = `${day}-${currentHour}-${normalizedMinute}`;
        occupiedSlots[slotKey] = boxId;
    }
}

function releaseOccupiedSlots(box) {
    const boxId = box.dataset.id;
    
    console.log(`시간 슬롯 해제: ${boxId}`);
    
    // 해당 박스가 점유한 모든 슬롯 해제
    for (const [slotKey, occupyingBoxId] of Object.entries(occupiedSlots)) {
        if (occupyingBoxId === boxId) {
            delete occupiedSlots[slotKey];
        }
    }
}
```

#### 충돌 해결 모달 (3,900~4,000줄)

```javascript
function showConflictModal(conflicts = []) {
    const modal = document.getElementById('conflictModal');
    const conflictList = modal.querySelector('.conflict-list');
    
    conflictList.innerHTML = '';
    
    if (conflicts.length === 0) {
        conflictList.innerHTML = '<p>시간이 겹치는 다른 일정이 있습니다.</p>';
    } else {
        conflicts.forEach(conflict => {
            const item = document.createElement('div');
            item.className = 'conflict-item';
            item.innerHTML = `
                <strong>${conflict.conflictBox.data.title}</strong>
                <br>
                <small>${conflict.time} - 시간 충돌</small>
            `;
            conflictList.appendChild(item);
        });
    }
    
    modal.style.display = 'block';
}

function closeConflictModal() {
    document.getElementById('conflictModal').style.display = 'none';
}

// 충돌 해결 옵션
function resolveConflict(action) {
    switch (action) {
        case 'cancel':
            closeConflictModal();
            break;
            
        case 'force':
            // 강제 배치 (기존 박스 제거)
            closeConflictModal();
            // TODO: 강제 배치 로직 구현
            break;
            
        case 'adjust':
            // 시간 조정 제안
            closeConflictModal();
            // TODO: 자동 시간 조정 로직 구현
            break;
    }
}
```

### 모달 관리 시스템 (4,000~4,400줄)

#### 플랜박스 생성/편집 모달 (4,000~4,200줄)

```javascript
function showAddModal(presetHour = null, presetMinute = null) {
    const modal = document.getElementById('planboxModal');
    const form = modal.querySelector('.planbox-form');
    
    // 폼 초기화
    clearModalForm();
    
    // 현재 시간 기준 기본값 설정
    const now = new Date();
    const currentHour = presetHour !== null ? presetHour : Math.max(7, Math.min(23, now.getHours()));
    const currentMinute = presetMinute !== null ? presetMinute : Math.floor(now.getMinutes() / 10) * 10;
    
    // 시간 선택 초기화
    initializeTimeSelects();
    
    // 프리셋 시간 설정
    const startHourSelect = document.getElementById('startHour');
    const startMinuteSelect = document.getElementById('startMinute');
    
    if (startHourSelect && startMinuteSelect) {
        startHourSelect.value = currentHour;
        startMinuteSelect.value = currentMinute;
        
        // 종료 시간 자동 계산
        updateEndTimeDisplay();
    }
    
    // 모달 제목 설정
    modal.querySelector('.modal-title').textContent = '새 플랜박스 만들기';
    
    // 편집 모드 해제
    editingBoxId = null;
    
    modal.style.display = 'block';
    
    // 제목 입력 필드에 포커스
    const titleInput = document.getElementById('planboxTitle');
    if (titleInput) {
        setTimeout(() => titleInput.focus(), 100);
    }
    
    console.log(`새 플랜박스 모달 - 시간: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
}

function editPlacedBox(box) {
    const boxId = box.dataset.id;
    const boxData = getBoxDataById(boxId);
    
    if (!boxData) {
        console.error('박스 데이터를 찾을 수 없습니다:', boxId);
        return;
    }
    
    const modal = document.getElementById('planboxModal');
    
    // 폼에 데이터 채우기
    document.getElementById('planboxTitle').value = boxData.title || '';
    document.getElementById('planboxMemo').value = boxData.memo || '';
    document.getElementById('planboxCost').value = boxData.cost || '';
    document.getElementById('planboxLocation').value = boxData.location || '';
    document.getElementById('planboxCategory').value = boxData.category || 'activity';
    document.getElementById('planboxDuration').value = boxData.duration || 60;
    
    // 시간 선택 초기화 및 설정
    initializeTimeSelects();
    document.getElementById('startHour').value = boxData.startHour || 9;
    document.getElementById('startMinute').value = boxData.startMinute || 0;
    
    // 종료 시간 표시 업데이트
    updateEndTimeDisplay();
    
    // 모달 제목 설정
    modal.querySelector('.modal-title').textContent = '플랜박스 편집';
    
    // 편집 모드 설정
    editingBoxId = boxId;
    
    modal.style.display = 'block';
    
    console.log(`플랜박스 편집: ${boxData.title}`);
}

function savePlanbox() {
    const title = document.getElementById('planboxTitle').value.trim();
    
    if (!title) {
        alert('제목을 입력해주세요.');
        return;
    }
    
    const boxData = {
        id: editingBoxId || 'box_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: title,
        memo: document.getElementById('planboxMemo').value.trim(),
        cost: document.getElementById('planboxCost').value.trim(),
        location: document.getElementById('planboxLocation').value.trim(),
        category: document.getElementById('planboxCategory').value,
        duration: parseInt(document.getElementById('planboxDuration').value) || 60,
        startHour: parseInt(document.getElementById('startHour').value),
        startMinute: parseInt(document.getElementById('startMinute').value)
    };
    
    if (editingBoxId) {
        // 편집 모드: 기존 박스 업데이트
        updateExistingBox(editingBoxId, boxData);
    } else {
        // 생성 모드: 새 박스를 planboxData에 추가
        planboxData.push(boxData);
        
        // 플랜박스 패널 다시 생성
        createPlanboxPanel();
    }
    
    // 모달 닫기
    closeModal('planboxModal');
    
    // 변경 사항 저장
    markAsChanged();
    
    console.log('플랜박스 저장:', boxData);
}

function updateExistingBox(boxId, newData) {
    // 1. planboxData 업데이트
    const templateIndex = planboxData.findIndex(item => item.id === boxId);
    if (templateIndex !== -1) {
        planboxData[templateIndex] = { ...planboxData[templateIndex], ...newData };
    }
    
    // 2. 배치된 박스가 있으면 업데이트
    if (placedBoxes[boxId]) {
        const { element, day, hour, minute } = placedBoxes[boxId];
        
        // 박스 데이터 업데이트
        placedBoxes[boxId].data = newData;
        
        // DOM 요소 업데이트
        updateBoxDOM(element, newData);
        
        // 크기나 시간이 변경된 경우 위치 조정
        if (newData.startHour !== hour || newData.startMinute !== minute) {
            movePlacedBox(boxId, day, newData.startHour, newData.startMinute);
        }
        
        if (element.offsetHeight !== newData.duration) {
            element.style.height = newData.duration + 'px';
            updateBoxSizeClass(element, newData.duration);
        }
    }
    
    // 3. 플랜박스 패널 다시 생성
    createPlanboxPanel();
}

function updateBoxDOM(element, boxData) {
    // 카테고리 클래스 업데이트
    element.className = `planbox ${boxData.category} placed size-${Math.ceil(boxData.duration / 10) * 10}`;
    
    // 내부 HTML 업데이트
    element.innerHTML = `
        <div class="planbox-time">${formatTime(boxData.startHour, boxData.startMinute)} (${boxData.duration}분)</div>
        <textarea class="planbox-title" readonly>${boxData.title}</textarea>
        <div class="planbox-memo">${boxData.memo || ''}</div>
        ${boxData.cost ? `<div class="planbox-cost">${formatCost(boxData.cost)}</div>` : ''}
        ${boxData.location ? `<div class="planbox-location">${boxData.location}</div>` : ''}
        <div class="resize-handle"></div>
    `;
    
    // 크기 클래스 및 메모 줄 수 업데이트
    updateBoxSizeClass(element, boxData.duration);
}
```

#### 초기 설정 모달 (4,200~4,300줄)

```javascript
function openInitModal() {
    const modal = document.getElementById('initModal');
    
    // 기존 데이터가 있으면 미리 채우기
    if (tripData) {
        document.getElementById('tripTitle').value = tripData.title || '';
        document.getElementById('startDate').value = tripData.startDate || '';
        document.getElementById('endDate').value = tripData.endDate || '';
        document.getElementById('tripType').value = tripData.type || 'domestic';
        
        if (tripData.days) {
            const endDate = new Date(tripData.startDate);
            endDate.setDate(endDate.getDate() + tripData.days - 1);
            document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
        }
    } else {
        // 기본값 설정
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        document.getElementById('startDate').value = today.toISOString().split('T')[0];
        document.getElementById('endDate').value = tomorrow.toISOString().split('T')[0];
    }
    
    modal.style.display = 'block';
    
    // 제목 입력에 포커스
    setTimeout(() => {
        const titleInput = document.getElementById('tripTitle');
        if (titleInput) titleInput.focus();
    }, 100);
}

function saveInitialSettings() {
    const title = document.getElementById('tripTitle').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const type = document.getElementById('tripType').value;
    
    if (!title || !startDate || !endDate) {
        alert('모든 항목을 입력해주세요.');
        return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    if (days < 1 || days > 30) {
        alert('여행 기간은 1일 이상 30일 이하로 설정해주세요.');
        return;
    }
    
    // 여행 데이터 설정
    tripData = {
        title: title,
        startDate: startDate,
        endDate: endDate,
        type: type,
        days: days,
        createdAt: new Date().toISOString(),
        version: '10.0'
    };
    
    // 헤더 제목 업데이트
    const tripTitleInput = document.querySelector('.header-controls input[type="text"]');
    if (tripTitleInput) {
        tripTitleInput.value = title;
    }
    
    // 일별 기본 시간대 초기화
    for (let day = 0; day < days; day++) {
        if (!dayTimeRanges[day]) {
            dayTimeRanges[day] = { start: 7, end: 23 };
        }
    }
    
    // 타임라인 생성
    createTimeLabels();
    createDayColumns();
    
    // 모달 닫기
    closeModal('initModal');
    
    // 저장
    markAsChanged();
    
    console.log(`여행 설정 완료: ${title} (${days}일간)`);
}
```

### 데이터 관리 시스템 (4,400~4,800줄)

#### 로컬 스토리지 (4,400~4,600줄)

```javascript
function saveToLocalStorage() {
    const saveData = {
        version: '2.0',
        tripData: tripData,
        planboxData: planboxData,
        placedBoxesData: convertPlacedBoxesToSaveData(),
        dayTimeRanges: dayTimeRanges,
        viewMode: viewMode,
        savedAt: new Date().toISOString()
    };
    
    try {
        localStorage.setItem('timeplanbox_autosave', JSON.stringify(saveData));
        console.log('로컬 저장 완료:', new Date().toLocaleTimeString());
        
        // 저장 성공 표시
        showSaveIndicator('저장됨');
        
    } catch (error) {
        console.error('로컬 저장 실패:', error);
        showSaveIndicator('저장 실패', 'error');
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('timeplanbox_autosave');
        
        if (!savedData) {
            console.log('저장된 데이터가 없습니다.');
            return false;
        }
        
        const data = JSON.parse(savedData);
        
        // 버전 확인 및 마이그레이션
        if (data.version !== '2.0') {
            console.log('구버전 데이터 감지, 마이그레이션 수행...');
            migrateOldData(data);
            return true;
        }
        
        // 데이터 복원
        tripData = data.tripData;
        planboxData = data.planboxData || [];
        dayTimeRanges = data.dayTimeRanges || {};
        viewMode = data.viewMode || 'edit';
        
        // 배치된 박스 데이터 복원
        if (data.placedBoxesData) {
            restorePlacedBoxesFromSaveData(data.placedBoxesData);
        }
        
        console.log('로컬 데이터 로드 완료');
        return true;
        
    } catch (error) {
        console.error('로컬 데이터 로드 실패:', error);
        return false;
    }
}

function convertPlacedBoxesToSaveData() {
    const saveData = {};
    
    for (const [boxId, boxInfo] of Object.entries(placedBoxes)) {
        saveData[boxId] = {
            data: boxInfo.data,
            day: boxInfo.day,
            hour: boxInfo.hour,
            minute: boxInfo.minute
        };
    }
    
    return saveData;
}

function restorePlacedBoxesFromSaveData(saveData) {
    placedBoxes = {};
    occupiedSlots = {};
    
    for (const [boxId, boxInfo] of Object.entries(saveData)) {
        try {
            createPlacedBox(boxInfo.data, boxInfo.day, boxInfo.hour, boxInfo.minute);
        } catch (error) {
            console.error(`박스 복원 실패 (${boxId}):`, error);
        }
    }
    
    console.log(`${Object.keys(saveData).length}개 박스 복원 완료`);
}

function migrateOldData(oldData) {
    // v1.x -> v2.0 마이그레이션
    console.log('구버전에서 v2.0으로 업그레이드');
    
    // 기본값 설정
    if (oldData.tripData && !oldData.dayTimeRanges) {
        const days = oldData.tripData.days || 1;
        dayTimeRanges = {};
        
        for (let day = 0; day < days; day++) {
            dayTimeRanges[day] = { start: 7, end: 23 };
        }
    }
    
    // 샘플 데이터 제거
    if (oldData.planboxData) {
        const sampleTitles = ['이치란 라멘', '스카이트리', '아사쿠사 사원'];
        oldData.planboxData = oldData.planboxData.filter(box => 
            !sampleTitles.some(title => box.title.includes(title))
        );
    }
    
    // 데이터 적용
    tripData = oldData.tripData;
    planboxData = oldData.planboxData || [];
    
    // 즉시 새 버전으로 저장
    saveToLocalStorage();
}
```

#### 자동 저장 시스템 (4,600~4,700줄)

```javascript
function enableAutoSave() {
    // 기존 인터벌 제거
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // 5초마다 자동 저장
    autoSaveInterval = setInterval(() => {
        if (hasChanges) {
            saveToLocalStorage();
            hasChanges = false;
        }
    }, 5000);
    
    console.log('자동 저장 활성화 (5초 간격)');
}

function markAsChanged() {
    hasChanges = true;
    
    // 변경 사항 표시
    showSaveIndicator('수정됨...');
}

function showSaveIndicator(message, type = 'info') {
    let indicator = document.getElementById('saveIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'saveIndicator';
        indicator.className = 'save-indicator';
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = message;
    indicator.className = `save-indicator ${type}`;
    indicator.style.display = 'block';
    
    // 3초 후 자동 숨김
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 3000);
}

// 페이지 이탈 시 저장 확인
window.addEventListener('beforeunload', (e) => {
    if (hasChanges) {
        saveToLocalStorage();
        e.preventDefault();
        e.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 페이지를 나가시겠습니까?';
        return e.returnValue;
    }
});
```

### 뷰 모드 시스템 (4,700~4,900줄)

#### 뷰 모드 전환 (4,700~4,800줄)

```javascript
function setViewMode(mode) {
    const validModes = ['edit', 'compress', 'print'];
    
    if (!validModes.includes(mode)) {
        console.error('유효하지 않은 뷰 모드:', mode);
        return;
    }
    
    // 기존 모드 클래스 제거
    document.body.classList.remove('edit-mode', 'compress-mode', 'print-mode');
    
    // 새 모드 클래스 추가
    document.body.classList.add(`${mode}-mode`);
    
    // 전역 변수 업데이트
    viewMode = mode;
    
    // 버튼 상태 업데이트
    document.querySelectorAll('.view-mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    // 모드별 처리
    switch (mode) {
        case 'edit':
            enableEditMode();
            break;
        case 'compress':
            enableCompressMode();
            break;
        case 'print':
            enablePrintMode();
            break;
    }
    
    console.log(`뷰 모드 변경: ${mode}`);
    markAsChanged();
}

function enableEditMode() {
    // 편집 모드: 모든 인터랙션 활성화
    document.querySelectorAll('.planbox').forEach(box => {
        box.draggable = true;
        box.style.cursor = 'move';
    });
    
    // 플랜박스 패널 표시
    const planboxArea = document.querySelector('.planbox-area');
    if (planboxArea) {
        planboxArea.style.display = 'flex';
    }
    
    // 타임라인 여백 복원
    const timelineArea = document.querySelector('.timeline-area');
    if (timelineArea) {
        timelineArea.style.margin = '16px';
    }
}

function enableCompressMode() {
    // 압축 모드: 공간 효율 최적화
    updateCompressView();
    
    // 드래그 비활성화
    document.querySelectorAll('.planbox').forEach(box => {
        box.draggable = false;
        box.style.cursor = 'default';
    });
    
    // 여백 축소
    const timelineArea = document.querySelector('.timeline-area');
    if (timelineArea) {
        timelineArea.style.margin = '8px';
    }
}

function enablePrintMode() {
    // 인쇄 모드: 인쇄 최적화
    
    // 플랜박스 패널 숨김
    const planboxArea = document.querySelector('.planbox-area');
    if (planboxArea) {
        planboxArea.style.display = 'none';
    }
    
    // 메인 레이아웃을 단일 컬럼으로
    const mainLayout = document.querySelector('.main-layout');
    if (mainLayout) {
        mainLayout.style.gridTemplateColumns = '1fr';
    }
    
    // 드래그 비활성화
    document.querySelectorAll('.planbox').forEach(box => {
        box.draggable = false;
        box.style.cursor = 'default';
    });
}
```

#### 압축 뷰 업데이트 (4,800~4,900줄)

```javascript
function updateCompressView() {
    if (viewMode !== 'compress') return;
    
    // 빈 시간 슬롯들 축소
    document.querySelectorAll('.time-slot').forEach(slot => {
        const day = parseInt(slot.dataset.day);
        const hour = parseInt(slot.dataset.hour);
        
        if (!hasEventsInHour(day, hour)) {
            slot.classList.add('empty');
        } else {
            slot.classList.remove('empty');
        }
    });
    
    // 타임라인 컬럼 너비 축소
    document.querySelectorAll('.day-column').forEach(column => {
        column.style.width = '130px';
    });
    
    // 플랜박스 폰트 크기 축소
    document.querySelectorAll('.planbox').forEach(box => {
        box.style.fontSize = '11px';
    });
    
    console.log('압축 뷰 업데이트 완료');
}

function hasEventsInHour(day, hour) {
    // 해당 시간에 이벤트가 있는지 확인
    for (let minute = 0; minute < 60; minute++) {
        const slotKey = `${day}-${hour}-${minute}`;
        if (occupiedSlots[slotKey]) {
            return true;
        }
    }
    return false;
}

function toggleCompressionMode() {
    const currentMode = viewMode;
    const newMode = currentMode === 'compress' ? 'edit' : 'compress';
    setViewMode(newMode);
}
```

### 유틸리티 함수들 (4,900~5,000줄)

#### 시간 포맷팅 (4,900~4,950줄)

```javascript
function formatTime(hour, minute) {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
}

function getTimeBlock(hour) {
    if (hour >= 0 && hour < 6) return 'dawn';      // 새벽
    if (hour >= 6 && hour < 12) return 'morning';  // 오전  
    if (hour >= 12 && hour < 18) return 'afternoon'; // 오후
    if (hour >= 18 && hour < 24) return 'evening';  // 저녁
    return 'morning'; // 기본값
}

function formatCost(cost) {
    if (!cost) return '';
    
    // 숫자인지 확인
    const numericCost = parseFloat(cost.toString().replace(/[^0-9.]/g, ''));
    
    if (isNaN(numericCost)) return cost;
    
    // 천 단위 콤마 추가
    return numericCost.toLocaleString() + '원';
}

function parseTimeString(timeString) {
    const [hour, minute] = timeString.split(':').map(Number);
    return { hour: hour || 0, minute: minute || 0 };
}
```

#### DOM 조작 유틸리티 (4,950~5,000줄)

```javascript
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        
        // 모달별 후처리
        if (modalId === 'planboxModal') {
            editingBoxId = null;
        }
    }
}

function clearModalForm() {
    const inputs = ['planboxTitle', 'planboxMemo', 'planboxCost', 'planboxLocation'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.value = '';
    });
    
    // 기본값 설정
    const category = document.getElementById('planboxCategory');
    const duration = document.getElementById('planboxDuration');
    
    if (category) category.value = 'activity';
    if (duration) duration.value = '60';
}

function getBoxDataById(id) {
    // placedBoxes에서 먼저 찾기
    if (placedBoxes[id]) {
        return placedBoxes[id].data;
    }
    
    // planboxData에서 찾기
    return planboxData.find(box => box.id === id);
}

function generateUniqueId() {
    return 'box_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        
        // 편집 모드 해제
        if (event.target.id === 'planboxModal') {
            editingBoxId = null;
        }
    }
};

console.log('TimePlanBox Adaptive v10.0 - 스크립트 로드 완료');
```

---

## 🔗 기능 간 상호작용 분석

### 1. 드래그앤드롭 ↔ 시간 관리
- 드래그 시작 시 `occupiedSlots` 확인
- 드롭 시 `checkTimeConflict()` 호출
- 성공 시 `occupyTimeSlots()` 실행
- 실패 시 `showConflictModal()` 표시

### 2. 리사이즈 ↔ 박스 크기 관리
- 리사이즈 시 `updateBoxSizeClass()` 호출
- 메모 줄 수 `calculateMemoLines()`으로 재계산
- 시간 표시 `formatTime()`으로 업데이트
- 충돌 재검사 `checkTimeConflictDetail()` 수행

### 3. 모달 ↔ 데이터 관리
- 모달 저장 시 `markAsChanged()` 호출
- 자동 저장 `enableAutoSave()` 트리거
- localStorage 업데이트 `saveToLocalStorage()`
- 플랜박스 패널 재생성 `createPlanboxPanel()`

### 4. 뷰 모드 ↔ UI 상태
- 모드 변경 시 CSS 클래스 전환
- 이벤트 리스너 활성화/비활성화
- 레이아웃 구조 동적 변경
- 드래그 가능성 토글

### 5. 시간대 확장 ↔ 타임라인 재생성
- 새 박스 배치 시 `checkExtendedTimeRange()` 호출
- 필요 시 `dayTimeRanges` 업데이트
- 타임라인 완전 재생성 (`createTimeLabels()`, `createDayColumns()`)
- 기존 박스들 `restorePlacedBoxes()`로 복원

---

## 📐 정확한 수치 및 스타일 명세

### 크기 및 위치

| 요소 | 크기/위치 | 설명 |
|------|-----------|------|
| 헤더 높이 | 56px | 고정 높이 |
| 로고 아이콘 | 32x32px | 정사각형, 8px 둥근 모서리 |
| 타임바 너비 | 25px | v10.0에서 44% 감소 |
| 날짜 컬럼 너비 | 150px (압축시 130px) | 동적 조절 |
| 시간 슬롯 높이 | 60px | 1시간 = 60px (1분 = 1px) |
| 플랜박스 최소 높이 | 20px | 20분 최소 |
| 플랜박스 기본 너비 | 140px | 컬럼 내부 |
| 모달 최대 너비 | 550px | v10.0 컴팩트화 |

### 색상 팔레트 (Material Design)

| 카테고리 | 색상 코드 | 용도 |
|----------|-----------|------|
| 식사 | #4CAF50 | 플랜박스 테두리 |
| 이동 | #2196F3 | 플랜박스 테두리 |
| 활동 | #9C27B0 | 플랜박스 테두리 |
| 관광 | #FF9800 | 플랜박스 테두리 |
| 쇼핑 | #E91E63 | 플랜박스 테두리 |
| 숙박 | #673AB7 | 플랜박스 테두리 |
| 주 색상 | #1976D2 | 버튼, 포커스 |
| 배경 | #f8f9fa | 전체 배경 |

### 시간 블록 색상

| 시간대 | 배경 색상 | 텍스트 색상 | 시간 범위 |
|--------|-----------|-------------|-----------|
| 새벽 | #f3f0ff | #6c5ce7 | 0-6시 |
| 오전 | #fff3e0 | #f57c00 | 6-12시 |
| 오후 | #e8f5e9 | #2e7d32 | 12-18시 |
| 저녁 | #fce4ec | #c2185b | 18-24시 |

### 폰트 크기

| 요소 | 폰트 크기 | 용도 |
|------|-----------|------|
| 헤더 제목 | 18px | 로고 텍스트 |
| 날짜 헤더 | 13px | 날짜 표시 |
| 시간 라벨 | 11px | 타임바 시간 |
| 플랜박스 제목 | 12px (기본) | 크기별 조절 |
| 플랜박스 시간 | 10px | 시간 표시 |
| 플랜박스 메모 | 10px | 메모 텍스트 |
| 모달 제목 | 18px | 모달 헤더 |

### 애니메이션 및 트랜지션

| 요소 | 효과 | 지속 시간 | 이징 |
|------|------|-----------|------|
| 모든 요소 기본 | transition | 0.2s | ease |
| 버튼 호버 | transform | 0.3s | cubic-bezier(0.4, 0, 0.2, 1) |
| 모달 페이드인 | fadeIn | 0.3s | ease |
| 모달 슬라이드인 | slideIn | 0.3s | ease |
| 플랜박스 드래그 | scale(1.05) | 즉시 | - |

---

## 🎯 마이그레이션을 위한 핵심 포인트

### 1. **상태 관리 구조**
```javascript
// 현재 전역 변수들을 React/Vue 상태로 변환 필요
const [planboxData, setPlanboxData] = useState([]);
const [placedBoxes, setPlacedBoxes] = useState({});
const [tripData, setTripData] = useState(null);
const [dayTimeRanges, setDayTimeRanges] = useState({});
```

### 2. **컴포넌트 분할 전략**
- `<Header />` - 헤더 및 뷰 모드 토글
- `<Timeline />` - 타임라인 전체 구조
- `<DayColumn />` - 개별 날짜 컬럼
- `<PlanBox />` - 플랜박스 컴포넌트
- `<PlanBoxModal />` - 모달 컴포넌트

### 3. **이벤트 시스템**
- 현재 DOM 이벤트 리스너들을 React 이벤트로 변환
- 드래그앤드롭 라이브러리 (react-dnd 등) 고려
- 전역 이벤트 (beforeunload 등) 유지

### 4. **데이터 흐름**
```
LocalStorage ↔ Context/Redux ↔ Components
                     ↕
                Database (Supabase)
```

### 5. **CSS-in-JS 변환**
- Styled-components 또는 Emotion 사용
- CSS 변수들을 테마 객체로 변환
- 반응형 브레이크포인트 정의

이 명세서는 TimePlanBox Adaptive v10.0의 모든 기능을 완벽하게 복제하기 위한 완전한 가이드입니다.