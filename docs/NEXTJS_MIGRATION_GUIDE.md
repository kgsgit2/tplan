# TimePlanBox Next.js 마이그레이션 완벽 가이드

## 📋 개요

이 문서는 TimePlanBox Adaptive v10.0 (순수 HTML/CSS/JavaScript)를 Next.js + TypeScript + Tailwind CSS + Supabase 기반의 현대적인 웹 애플리케이션으로 완벽하게 마이그레이션하기 위한 상세 가이드입니다.

### 마이그레이션 목표
- 🎯 **100% 기능 동일성**: 모든 기능과 UX 완벽 보존
- 🚀 **성능 향상**: SSR, 코드 스플리팅, 최적화 적용
- 🔄 **실시간 동기화**: Supabase를 통한 실시간 협업
- 📱 **모바일 최적화**: PWA 지원, 터치 인터페이스
- 🎨 **디자인 시스템**: 확장 가능한 컴포넌트 아키텍처

---

## 🏗️ 프로젝트 구조 설계

### 1. **Next.js 13+ App Router 구조**

```
timeplanbox-nextjs/
├── app/
│   ├── (dashboard)/
│   │   ├── trip/
│   │   │   └── [tripId]/
│   │   │       ├── page.tsx           # 메인 타임라인 페이지
│   │   │       ├── edit/page.tsx      # 편집 모드 페이지
│   │   │       ├── settings/page.tsx  # 여행 설정 페이지
│   │   │       └── loading.tsx        # 로딩 UI
│   │   ├── dashboard/
│   │   │   └── page.tsx               # 여행 목록
│   │   └── layout.tsx                 # 대시보드 레이아웃
│   ├── api/
│   │   ├── trips/
│   │   │   ├── route.ts               # 여행 CRUD API
│   │   │   └── [tripId]/
│   │   │       ├── planboxes/route.ts # 플랜박스 API
│   │   │       └── timeline/route.ts  # 타임라인 API
│   │   ├── auth/
│   │   │   └── callback/route.ts      # Supabase Auth 콜백
│   │   └── realtime/
│   │       └── route.ts               # 실시간 업데이트 API
│   ├── globals.css                    # 글로벌 스타일
│   ├── layout.tsx                     # 루트 레이아웃
│   ├── page.tsx                       # 홈페이지
│   └── not-found.tsx                  # 404 페이지
├── components/
│   ├── timeline/
│   │   ├── Timeline.tsx               # 메인 타임라인 컴포넌트
│   │   ├── DayColumn.tsx              # 날짜 컬럼
│   │   ├── TimeGrid.tsx               # 시간 그리드
│   │   ├── TimeSlot.tsx               # 개별 시간 슬롯
│   │   └── DayTimebar.tsx             # 개별 타임바
│   ├── planbox/
│   │   ├── PlanBox.tsx                # 플랜박스 컴포넌트
│   │   ├── PlanBoxModal.tsx           # 생성/편집 모달
│   │   ├── PlanBoxPanel.tsx           # 우측 패널
│   │   ├── CategorySelector.tsx       # 카테고리 선택
│   │   └── CostCalculator.tsx         # 비용 계산기
│   ├── ui/
│   │   ├── Button.tsx                 # 재사용 버튼
│   │   ├── Modal.tsx                  # 재사용 모달
│   │   ├── Input.tsx                  # 재사용 입력 필드
│   │   ├── Select.tsx                 # 재사용 셀렉트
│   │   └── Badge.tsx                  # 배지 컴포넌트
│   ├── layout/
│   │   ├── Header.tsx                 # 헤더 컴포넌트
│   │   ├── Sidebar.tsx                # 사이드바
│   │   └── Footer.tsx                 # 푸터
│   └── providers/
│       ├── SupabaseProvider.tsx       # Supabase 클라이언트
│       ├── RealtimeProvider.tsx       # 실시간 동기화
│       └── ThemeProvider.tsx          # 테마 제공자
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # Supabase 클라이언트
│   │   ├── server.ts                  # 서버사이드 클라이언트
│   │   ├── database.types.ts          # DB 타입 정의
│   │   └── realtime.ts                # 실시간 기능
│   ├── hooks/
│   │   ├── useTimeline.ts             # 타임라인 훅
│   │   ├── usePlanBox.ts              # 플랜박스 훅
│   │   ├── useDragDrop.ts             # 드래그앤드롭 훅
│   │   ├── useLocalStorage.ts         # 로컬 스토리지 훅
│   │   └── useRealtime.ts             # 실시간 동기화 훅
│   ├── utils/
│   │   ├── time.ts                    # 시간 관련 유틸리티
│   │   ├── color.ts                   # 색상 관련 유틸리티
│   │   ├── format.ts                  # 포맷팅 유틸리티
│   │   ├── validation.ts              # 유효성 검사
│   │   └── constants.ts               # 상수 정의
│   ├── stores/
│   │   ├── timelineStore.ts           # Zustand 타임라인 스토어
│   │   ├── planboxStore.ts            # 플랜박스 스토어
│   │   ├── tripStore.ts               # 여행 정보 스토어
│   │   └── uiStore.ts                 # UI 상태 스토어
│   └── types/
│       ├── timeline.ts                # 타임라인 타입
│       ├── planbox.ts                 # 플랜박스 타입
│       ├── trip.ts                    # 여행 타입
│       └── ui.ts                      # UI 타입
├── styles/
│   ├── components.css                 # 컴포넌트 스타일
│   ├── timeline.css                   # 타임라인 전용 스타일
│   └── animations.css                 # 애니메이션 정의
├── public/
│   ├── icons/                         # 아이콘 파일들
│   ├── manifest.json                  # PWA 매니페스트
│   └── sw.js                          # 서비스 워커
├── supabase/
│   ├── migrations/                    # DB 마이그레이션
│   │   ├── 001_initial_schema.sql     # 초기 스키마
│   │   ├── 002_planbox_tables.sql     # 플랜박스 테이블
│   │   └── 003_realtime_policies.sql  # 실시간 정책
│   └── config.toml                    # Supabase 설정
├── __tests__/                         # 테스트 파일
├── .env.local                         # 환경 변수
├── next.config.js                     # Next.js 설정
├── tailwind.config.js                 # Tailwind 설정
├── tsconfig.json                      # TypeScript 설정
└── package.json                       # 프로젝트 설정
```

---

## 🗄️ 데이터베이스 설계 (Supabase)

### 1. **테이블 구조**

#### trips 테이블
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  type TEXT DEFAULT 'domestic' CHECK (type IN ('domestic', 'international')),
  country TEXT,
  currency TEXT DEFAULT 'KRW',
  exchange_rate DECIMAL(10,4) DEFAULT 1.0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT FALSE,
  shared_with TEXT[], -- 공유된 사용자 ID 배열
  view_mode TEXT DEFAULT 'edit' CHECK (view_mode IN ('edit', 'compress', 'print')),
  day_time_ranges JSONB DEFAULT '{}', -- 날짜별 시간 범위 {day: {start, end}}
  
  -- 인덱스
  UNIQUE(user_id, title), -- 사용자별 여행 제목 중복 방지
  INDEX idx_trips_user_id ON trips(user_id),
  INDEX idx_trips_created_at ON trips(created_at DESC)
);

-- RLS (Row Level Security) 정책
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips" ON trips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" ON trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" ON trips
  FOR DELETE USING (auth.uid() = user_id);
```

#### planboxes 테이블
```sql
CREATE TABLE planboxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  memo TEXT,
  cost DECIMAL(10,2),
  cost_currency TEXT DEFAULT 'KRW',
  location TEXT,
  latitude DECIMAL(10,8), -- 위도 (Google Maps 연동용)
  longitude DECIMAL(11,8), -- 경도
  category TEXT NOT NULL CHECK (category IN (
    'food', 'transport', 'activity', 'sightseeing', 'shopping', 'accommodation'
  )),
  start_hour INTEGER CHECK (start_hour >= 0 AND start_hour <= 23),
  start_minute INTEGER CHECK (start_minute >= 0 AND start_minute <= 59),
  duration INTEGER NOT NULL CHECK (duration >= 10 AND duration <= 1440), -- 10분~24시간
  day INTEGER CHECK (day >= 0), -- 몇 번째 날짜인지 (0-based)
  placed_at TIMESTAMP WITH TIME ZONE, -- 타임라인에 배치된 시간
  template_only BOOLEAN DEFAULT FALSE, -- 템플릿용인지 실제 배치된 것인지
  order_index INTEGER DEFAULT 0, -- 같은 시간대 내 정렬 순서
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 제약 조건
  CONSTRAINT planbox_time_valid CHECK (
    (template_only = TRUE) OR 
    (start_hour IS NOT NULL AND start_minute IS NOT NULL AND day IS NOT NULL)
  ),
  
  -- 인덱스
  INDEX idx_planboxes_trip_id ON planboxes(trip_id),
  INDEX idx_planboxes_day_time ON planboxes(trip_id, day, start_hour, start_minute),
  INDEX idx_planboxes_category ON planboxes(category),
  INDEX idx_planboxes_placed ON planboxes(trip_id, placed_at) WHERE placed_at IS NOT NULL
);

-- RLS 정책 (trips와 동일한 권한 상속)
ALTER TABLE planboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access planboxes of owned trips" ON planboxes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = planboxes.trip_id 
      AND trips.user_id = auth.uid()
    )
  );
```

#### activity_logs 테이블 (실시간 협업용)
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'move', 'resize'
  target_type TEXT NOT NULL, -- 'planbox', 'trip', 'timeline'
  target_id UUID,
  changes JSONB, -- 변경된 내용
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 인덱스
  INDEX idx_activity_logs_trip_id ON activity_logs(trip_id, created_at DESC),
  INDEX idx_activity_logs_user_id ON activity_logs(user_id, created_at DESC)
);

-- 7일 후 자동 삭제 정책
CREATE OR REPLACE FUNCTION delete_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM activity_logs 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 매일 실행하는 cron job
SELECT cron.schedule('delete-old-logs', '0 2 * * *', 'SELECT delete_old_activity_logs();');
```

### 2. **실시간 기능 설정**

#### Supabase Realtime 설정
```sql
-- 실시간 구독 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE trips;
ALTER PUBLICATION supabase_realtime ADD TABLE planboxes;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- 실시간 필터 함수
CREATE OR REPLACE FUNCTION public.is_trip_accessible(trip_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM trips 
    WHERE id = trip_id 
    AND (user_id = auth.uid() OR auth.uid() = ANY(shared_with))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 상태 관리 시스템 (Zustand)

### 1. **Timeline Store**

```typescript
// lib/stores/timelineStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface TimelineState {
  // 상태
  tripData: Trip | null;
  dayTimeRanges: Record<number, { start: number; end: number }>;
  occupiedSlots: Record<string, string>; // 'day-hour-minute': boxId
  viewMode: 'edit' | 'compress' | 'print';
  isLoading: boolean;
  
  // 액션
  setTripData: (trip: Trip) => void;
  setDayTimeRange: (day: number, start: number, end: number) => void;
  occupyTimeSlot: (day: number, hour: number, minute: number, duration: number, boxId: string) => void;
  releaseTimeSlots: (boxId: string) => void;
  checkTimeConflict: (day: number, hour: number, minute: number, duration: number, excludeBoxId?: string) => boolean;
  setViewMode: (mode: ViewMode) => void;
  
  // 계산된 값
  getTotalDays: () => number;
  getTimeRange: (day: number) => { start: number; end: number };
  getConflictingBoxes: (day: number, hour: number, minute: number, duration: number) => string[];
}

export const useTimelineStore = create<TimelineState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 초기 상태
      tripData: null,
      dayTimeRanges: {},
      occupiedSlots: {},
      viewMode: 'edit',
      isLoading: false,
      
      // 액션 구현
      setTripData: (trip) => set((state) => {
        state.tripData = trip;
        // 기본 시간 범위 설정
        for (let day = 0; day < trip.days; day++) {
          if (!state.dayTimeRanges[day]) {
            state.dayTimeRanges[day] = { start: 7, end: 23 };
          }
        }
      }),
      
      setDayTimeRange: (day, start, end) => set((state) => {
        state.dayTimeRanges[day] = { start, end };
      }),
      
      occupyTimeSlot: (day, hour, minute, duration, boxId) => set((state) => {
        // duration 분 동안의 모든 슬롯 점유
        for (let m = 0; m < duration; m++) {
          const currentMinute = minute + m;
          const currentHour = hour + Math.floor(currentMinute / 60);
          const normalizedMinute = currentMinute % 60;
          
          const slotKey = `${day}-${currentHour}-${normalizedMinute}`;
          state.occupiedSlots[slotKey] = boxId;
        }
      }),
      
      releaseTimeSlots: (boxId) => set((state) => {
        // 해당 boxId가 점유한 모든 슬롯 해제
        Object.keys(state.occupiedSlots).forEach(slotKey => {
          if (state.occupiedSlots[slotKey] === boxId) {
            delete state.occupiedSlots[slotKey];
          }
        });
      }),
      
      checkTimeConflict: (day, hour, minute, duration, excludeBoxId) => {
        const state = get();
        for (let m = 0; m < duration; m++) {
          const currentMinute = minute + m;
          const currentHour = hour + Math.floor(currentMinute / 60);
          const normalizedMinute = currentMinute % 60;
          
          const slotKey = `${day}-${currentHour}-${normalizedMinute}`;
          const occupyingBoxId = state.occupiedSlots[slotKey];
          
          if (occupyingBoxId && occupyingBoxId !== excludeBoxId) {
            return true; // 충돌 발생
          }
        }
        return false;
      },
      
      setViewMode: (mode) => set((state) => {
        state.viewMode = mode;
      }),
      
      // 계산된 값
      getTotalDays: () => {
        const state = get();
        return state.tripData?.days || 0;
      },
      
      getTimeRange: (day) => {
        const state = get();
        return state.dayTimeRanges[day] || { start: 7, end: 23 };
      },
      
      getConflictingBoxes: (day, hour, minute, duration) => {
        const state = get();
        const conflictingBoxes = new Set<string>();
        
        for (let m = 0; m < duration; m++) {
          const currentMinute = minute + m;
          const currentHour = hour + Math.floor(currentMinute / 60);
          const normalizedMinute = currentMinute % 60;
          
          const slotKey = `${day}-${currentHour}-${normalizedMinute}`;
          const occupyingBoxId = state.occupiedSlots[slotKey];
          
          if (occupyingBoxId) {
            conflictingBoxes.add(occupyingBoxId);
          }
        }
        
        return Array.from(conflictingBoxes);
      }
    }))
  )
);
```

### 2. **PlanBox Store**

```typescript
// lib/stores/planboxStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface PlanBoxState {
  // 상태
  templates: PlanBox[]; // 템플릿 플랜박스들
  placedBoxes: Record<string, PlacedPlanBox>; // 배치된 플랜박스들
  isLoading: boolean;
  editingBoxId: string | null;
  draggedBoxId: string | null;
  isCloneMode: boolean;
  
  // 액션
  addTemplate: (planbox: Omit<PlanBox, 'id'>) => string;
  updateTemplate: (id: string, updates: Partial<PlanBox>) => void;
  deleteTemplate: (id: string) => void;
  
  placePlanBox: (templateId: string, day: number, hour: number, minute: number) => string | null;
  movePlacedBox: (boxId: string, day: number, hour: number, minute: number) => boolean;
  resizePlacedBox: (boxId: string, newDuration: number) => boolean;
  removePlacedBox: (boxId: string) => void;
  
  setEditingBox: (boxId: string | null) => void;
  setDraggedBox: (boxId: string | null) => void;
  setCloneMode: (enabled: boolean) => void;
  
  // 계산된 값
  getPlacedBoxesByDay: (day: number) => PlacedPlanBox[];
  getTotalCostByDay: (day: number) => number;
  getTotalCost: () => number;
  getBoxById: (id: string) => PlanBox | PlacedPlanBox | null;
}

export const usePlanBoxStore = create<PlanBoxState>()(
  subscribeWithSelector(
    immer((set, get) => ({
      // 초기 상태
      templates: [],
      placedBoxes: {},
      isLoading: false,
      editingBoxId: null,
      draggedBoxId: null,
      isCloneMode: false,
      
      // 템플릿 관리
      addTemplate: (planbox) => {
        const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        set((state) => {
          state.templates.push({ ...planbox, id });
        });
        return id;
      },
      
      updateTemplate: (id, updates) => set((state) => {
        const index = state.templates.findIndex(t => t.id === id);
        if (index !== -1) {
          state.templates[index] = { ...state.templates[index], ...updates };
        }
      }),
      
      deleteTemplate: (id) => set((state) => {
        state.templates = state.templates.filter(t => t.id !== id);
      }),
      
      // 배치 관리
      placePlanBox: (templateId, day, hour, minute) => {
        const template = get().templates.find(t => t.id === templateId);
        if (!template) return null;
        
        // 충돌 검사
        const timelineStore = useTimelineStore.getState();
        if (timelineStore.checkTimeConflict(day, hour, minute, template.duration)) {
          return null; // 충돌 발생
        }
        
        const placedId = `placed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        set((state) => {
          state.placedBoxes[placedId] = {
            ...template,
            id: placedId,
            templateId,
            day,
            hour,
            minute,
            placedAt: new Date().toISOString()
          };
        });
        
        // 시간 슬롯 점유
        timelineStore.occupyTimeSlot(day, hour, minute, template.duration, placedId);
        
        return placedId;
      },
      
      movePlacedBox: (boxId, day, hour, minute) => {
        const box = get().placedBoxes[boxId];
        if (!box) return false;
        
        const timelineStore = useTimelineStore.getState();
        
        // 충돌 검사 (자기 자신 제외)
        if (timelineStore.checkTimeConflict(day, hour, minute, box.duration, boxId)) {
          return false;
        }
        
        set((state) => {
          // 기존 슬롯 해제
          timelineStore.releaseTimeSlots(boxId);
          
          // 새 위치로 업데이트
          state.placedBoxes[boxId] = {
            ...state.placedBoxes[boxId],
            day,
            hour,
            minute
          };
          
          // 새 슬롯 점유
          timelineStore.occupyTimeSlot(day, hour, minute, box.duration, boxId);
        });
        
        return true;
      },
      
      resizePlacedBox: (boxId, newDuration) => {
        const box = get().placedBoxes[boxId];
        if (!box) return false;
        
        const timelineStore = useTimelineStore.getState();
        
        // 기존 슬롯 해제
        timelineStore.releaseTimeSlots(boxId);
        
        // 새 duration으로 충돌 검사
        if (timelineStore.checkTimeConflict(box.day, box.hour, box.minute, newDuration, boxId)) {
          // 충돌 발생, 기존 슬롯 다시 점유
          timelineStore.occupyTimeSlot(box.day, box.hour, box.minute, box.duration, boxId);
          return false;
        }
        
        set((state) => {
          state.placedBoxes[boxId] = {
            ...state.placedBoxes[boxId],
            duration: newDuration
          };
        });
        
        // 새 슬롯 점유
        timelineStore.occupyTimeSlot(box.day, box.hour, box.minute, newDuration, boxId);
        
        return true;
      },
      
      removePlacedBox: (boxId) => set((state) => {
        if (state.placedBoxes[boxId]) {
          // 시간 슬롯 해제
          const timelineStore = useTimelineStore.getState();
          timelineStore.releaseTimeSlots(boxId);
          
          // 배치된 박스 제거
          delete state.placedBoxes[boxId];
        }
      }),
      
      // UI 상태 관리
      setEditingBox: (boxId) => set((state) => {
        state.editingBoxId = boxId;
      }),
      
      setDraggedBox: (boxId) => set((state) => {
        state.draggedBoxId = boxId;
      }),
      
      setCloneMode: (enabled) => set((state) => {
        state.isCloneMode = enabled;
      }),
      
      // 계산된 값
      getPlacedBoxesByDay: (day) => {
        const state = get();
        return Object.values(state.placedBoxes)
          .filter(box => box.day === day)
          .sort((a, b) => {
            if (a.hour !== b.hour) return a.hour - b.hour;
            return a.minute - b.minute;
          });
      },
      
      getTotalCostByDay: (day) => {
        const boxes = get().getPlacedBoxesByDay(day);
        return boxes.reduce((total, box) => {
          return total + (parseFloat(box.cost) || 0);
        }, 0);
      },
      
      getTotalCost: () => {
        const state = get();
        return Object.values(state.placedBoxes).reduce((total, box) => {
          return total + (parseFloat(box.cost) || 0);
        }, 0);
      },
      
      getBoxById: (id) => {
        const state = get();
        return state.placedBoxes[id] || state.templates.find(t => t.id === id) || null;
      }
    }))
  )
);
```

---

## 🎨 컴포넌트 구현 전략

### 1. **Timeline 컴포넌트**

```typescript
// components/timeline/Timeline.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useTimelineStore } from '@/lib/stores/timelineStore';
import { usePlanBoxStore } from '@/lib/stores/planboxStore';
import { DayColumn } from './DayColumn';
import { DayTimebar } from './DayTimebar';
import { cn } from '@/lib/utils';

interface TimelineProps {
  tripId: string;
  className?: string;
}

export function Timeline({ tripId, className }: TimelineProps) {
  const { tripData, viewMode, getTotalDays, getTimeRange } = useTimelineStore();
  const { placedBoxes } = usePlanBoxStore();
  
  // 컴포넌트가 마운트될 때 데이터 로드
  useEffect(() => {
    // TODO: tripId로 데이터 로드 로직
  }, [tripId]);
  
  const totalDays = getTotalDays();
  
  const timelineClasses = cn(
    'timeline-container flex min-w-fit relative pb-5',
    {
      'compress-mode': viewMode === 'compress',
      'print-mode': viewMode === 'print'
    },
    className
  );
  
  if (!tripData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className={timelineClasses}>
      {/* 개별 타임바 시스템 */}
      <div className="day-timebars flex">
        {Array.from({ length: totalDays }, (_, day) => (
          <DayTimebar
            key={day}
            day={day}
            timeRange={getTimeRange(day)}
            onTimeRangeChange={(start, end) => {
              useTimelineStore.getState().setDayTimeRange(day, start, end);
            }}
          />
        ))}
      </div>
      
      {/* 날짜 컬럼들 */}
      <div className="day-columns flex">
        {Array.from({ length: totalDays }, (_, day) => (
          <DayColumn
            key={day}
            day={day}
            tripData={tripData}
            timeRange={getTimeRange(day)}
            placedBoxes={Object.values(placedBoxes).filter(box => box.day === day)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 2. **PlanBox 컴포넌트**

```typescript
// components/planbox/PlanBox.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useDragDrop } from '@/lib/hooks/useDragDrop';
import { useResizable } from '@/lib/hooks/useResizable';
import { usePlanBoxStore } from '@/lib/stores/planboxStore';
import { formatTime, formatCost } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { PlanBox as PlanBoxType, PlacedPlanBox } from '@/lib/types/planbox';

interface PlanBoxProps {
  planbox: PlanBoxType | PlacedPlanBox;
  isPlaced?: boolean;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PlanBox({ planbox, isPlaced, className, onEdit, onDelete }: PlanBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const { setEditingBox, setDraggedBox } = usePlanBoxStore();
  
  // 드래그앤드롭 훅
  const { dragHandlers, isDragging, dragPreview } = useDragDrop({
    item: planbox,
    type: 'planbox',
    canDrag: !isResizing,
    onDragStart: () => setDraggedBox(planbox.id),
    onDragEnd: () => setDraggedBox(null)
  });
  
  // 리사이저블 훅 (배치된 박스만)
  const { resizeHandlers, isResizingBottom, isResizingTop, resizeBadge } = useResizable({
    enabled: isPlaced,
    minHeight: 20, // 20분
    maxHeight: 600, // 10시간
    snapToGrid: 10, // 10분 단위
    onResizeStart: () => setIsResizing(true),
    onResizeEnd: () => setIsResizing(false),
    onResize: (newDuration: number) => {
      if ('day' in planbox) {
        usePlanBoxStore.getState().resizePlacedBox(planbox.id, newDuration);
      }
    }
  });
  
  // 박스 크기 클래스 계산
  const sizeClass = useMemo(() => {
    if (planbox.duration <= 20) return 'size-20';
    if (planbox.duration <= 30) return 'size-30';
    if (planbox.duration <= 40) return 'size-40';
    if (planbox.duration <= 50) return 'size-50';
    return 'size-60';
  }, [planbox.duration]);
  
  // 메모 줄 수 계산
  const memoLines = useMemo(() => {
    if (planbox.duration < 30) return 0;
    if (planbox.duration < 40) return 1;
    if (planbox.duration < 50) return 2;
    if (planbox.duration < 60) return 3;
    return 4;
  }, [planbox.duration]);
  
  const boxClasses = cn(
    'planbox relative flex flex-col overflow-hidden rounded-lg border-2 bg-white transition-all duration-200',
    `border-${planbox.category}`,
    sizeClass,
    {
      'opacity-80 scale-105 z-50 shadow-lg': isDragging,
      'placed absolute left-1 right-1 z-10': isPlaced,
      'cursor-move': !isResizing,
      'cursor-ns-resize': isResizing
    },
    className
  );
  
  const handleDoubleClick = () => {
    if (onEdit) {
      onEdit();
    } else {
      setEditingBox(planbox.id);
    }
  };
  
  return (
    <>
      <div
        ref={boxRef}
        className={boxClasses}
        style={{
          height: isPlaced ? `${planbox.duration}px` : undefined,
          minHeight: isPlaced ? undefined : '60px'
        }}
        onDoubleClick={handleDoubleClick}
        {...dragHandlers}
      >
        {/* 시간 표시 */}
        <div className="planbox-time bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-600">
          {isPlaced && 'hour' in planbox && 'minute' in planbox ? (
            `${formatTime(planbox.hour, planbox.minute)} (${planbox.duration}분)`
          ) : (
            `${planbox.duration}분`
          )}
        </div>
        
        {/* 제목 */}
        <div className="planbox-title flex-1 px-2 py-1 text-sm font-semibold text-gray-900 line-clamp-2">
          {planbox.title}
        </div>
        
        {/* 메모 (크기에 따라 표시) */}
        {planbox.memo && memoLines > 0 && (
          <div 
            className="planbox-memo px-2 text-xs text-gray-600 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: memoLines,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {planbox.memo}
          </div>
        )}
        
        {/* 비용 */}
        {planbox.cost && (
          <div className="planbox-cost bg-pink-50 px-2 py-1 text-xs font-semibold text-pink-600">
            {formatCost(planbox.cost)}
          </div>
        )}
        
        {/* 위치 */}
        {planbox.location && (
          <div className="planbox-location px-2 py-1 text-xs text-gray-500 opacity-80">
            {planbox.location}
          </div>
        )}
        
        {/* 리사이즈 핸들 (배치된 박스만) */}
        {isPlaced && (
          <>
            <div
              className="resize-handle absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize"
              {...resizeHandlers}
            />
            
            {/* 호버 시 리사이즈 인디케이터 */}
            <div className="resize-indicator absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-5 h-0.5 bg-primary rounded opacity-0 hover:opacity-100 transition-opacity" />
          </>
        )}
        
        {/* 리사이즈 배지 */}
        {resizeBadge && (
          <div className="resize-badge absolute -top-6 right-1 bg-primary text-white px-2 py-1 rounded text-xs font-semibold">
            {resizeBadge}
          </div>
        )}
      </div>
      
      {/* 드래그 프리뷰 */}
      {dragPreview}
    </>
  );
}

// 카테고리별 색상 CSS (Tailwind 설정에 추가)
// border-food: #4CAF50
// border-transport: #2196F3
// border-activity: #9C27B0
// border-sightseeing: #FF9800
// border-shopping: #E91E63
// border-accommodation: #673AB7
```

### 3. **사용자 정의 훅들**

#### useDragDrop 훅
```typescript
// lib/hooks/useDragDrop.ts
import { useCallback, useState } from 'react';
import { useDndMonitor } from '@dnd-kit/core';

interface UseDragDropProps {
  item: any;
  type: string;
  canDrag?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDrop?: (targetData: any) => void;
}

export function useDragDrop({ 
  item, 
  type, 
  canDrag = true,
  onDragStart,
  onDragEnd,
  onDrop
}: UseDragDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const dragHandlers = {
    draggable: canDrag,
    onDragStart: (e: React.DragEvent) => {
      if (!canDrag) return;
      
      setIsDragging(true);
      onDragStart?.();
      
      // 드래그 데이터 설정
      e.dataTransfer.setData('application/json', JSON.stringify({
        type,
        item
      }));
      
      e.dataTransfer.effectAllowed = 'move';
    },
    
    onDragEnd: () => {
      setIsDragging(false);
      onDragEnd?.();
    }
  };
  
  const dropHandlers = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      
      try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        if (data.type === type) {
          onDrop?.(data);
        }
      } catch (error) {
        console.error('드롭 데이터 파싱 오류:', error);
      }
    }
  };
  
  return {
    dragHandlers,
    dropHandlers,
    isDragging
  };
}
```

#### useResizable 훅
```typescript
// lib/hooks/useResizable.ts
import { useCallback, useState, useRef } from 'react';

interface UseResizableProps {
  enabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  snapToGrid?: number;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onResize?: (newSize: number) => void;
}

export function useResizable({
  enabled = true,
  minHeight = 20,
  maxHeight = 600,
  snapToGrid = 1,
  onResizeStart,
  onResizeEnd,
  onResize
}: UseResizableProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeBadge, setResizeBadge] = useState<string | null>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    startYRef.current = e.clientY;
    startHeightRef.current = e.currentTarget.closest('.planbox')?.offsetHeight || 60;
    
    onResizeStart?.();
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startYRef.current;
      let newHeight = startHeightRef.current + deltaY;
      
      // 제한 적용
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
      
      // 그리드 스냅
      if (snapToGrid > 1) {
        newHeight = Math.round(newHeight / snapToGrid) * snapToGrid;
      }
      
      onResize?.(newHeight);
      
      // 배지 업데이트
      const endTime = calculateEndTime(newHeight);
      setResizeBadge(`~${endTime}`);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeBadge(null);
      onResizeEnd?.();
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [enabled, minHeight, maxHeight, snapToGrid, onResizeStart, onResizeEnd, onResize]);
  
  return {
    resizeHandlers: {
      onMouseDown: handleMouseDown
    },
    isResizing,
    resizeBadge
  };
}

function calculateEndTime(duration: number): string {
  // TODO: 실제 시작 시간 기반으로 종료 시간 계산
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
```

---

## 🔄 실시간 동기화 구현

### 1. **Realtime Provider**

```typescript
// components/providers/RealtimeProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useTimelineStore } from '@/lib/stores/timelineStore';
import { usePlanBoxStore } from '@/lib/stores/planboxStore';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface RealtimeContextValue {
  isConnected: boolean;
  activeUsers: Array<{ id: string; name: string; avatar?: string }>;
  subscribeToTrip: (tripId: string) => void;
  unsubscribeFromTrip: () => void;
  broadcastAction: (action: any) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  const supabase = createClientComponentClient();
  
  const subscribeToTrip = async (tripId: string) => {
    if (channel) {
      await channel.unsubscribe();
    }
    
    // 1. 여행 데이터 변경 구독
    const tripChannel = supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          handleTripChange(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'planboxes',
          filter: `trip_id=eq.${tripId}`
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          handlePlanboxChange(payload);
        }
      )
      // 2. 사용자 실시간 액션 구독
      .on(
        'broadcast',
        { event: 'user_action' },
        (payload) => {
          handleUserAction(payload);
        }
      )
      // 3. 사용자 접속/종료 추적
      .on('presence', { event: 'sync' }, () => {
        const state = tripChannel.presenceState();
        setActiveUsers(
          Object.values(state).flat().map((user: any) => ({
            id: user.user_id,
            name: user.name,
            avatar: user.avatar
          }))
        );
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('사용자 접속:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('사용자 종료:', leftPresences);
      });
    
    // 구독 시작
    tripChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        
        // 현재 사용자 presence 등록
        const user = await supabase.auth.getUser();
        if (user.data.user) {
          await tripChannel.track({
            user_id: user.data.user.id,
            name: user.data.user.user_metadata?.name || 'Anonymous',
            avatar: user.data.user.user_metadata?.avatar_url,
            online_at: new Date().toISOString()
          });
        }
      } else if (status === 'CLOSED') {
        setIsConnected(false);
      }
    });
    
    setChannel(tripChannel);
  };
  
  const unsubscribeFromTrip = async () => {
    if (channel) {
      await channel.unsubscribe();
      setChannel(null);
      setIsConnected(false);
      setActiveUsers([]);
    }
  };
  
  const broadcastAction = async (action: any) => {
    if (channel && isConnected) {
      await channel.send({
        type: 'broadcast',
        event: 'user_action',
        payload: action
      });
    }
  };
  
  // 여행 데이터 변경 처리
  const handleTripChange = (payload: RealtimePostgresChangesPayload<any>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    switch (eventType) {
      case 'UPDATE':
        useTimelineStore.getState().setTripData(newRecord);
        break;
      case 'DELETE':
        // 여행이 삭제된 경우 리다이렉트
        window.location.href = '/dashboard';
        break;
    }
  };
  
  // 플랜박스 변경 처리
  const handlePlanboxChange = (payload: RealtimePostgresChangesPayload<any>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    const planboxStore = usePlanBoxStore.getState();
    
    switch (eventType) {
      case 'INSERT':
        if (newRecord.template_only) {
          // 템플릿 추가
          planboxStore.addTemplate(newRecord);
        } else {
          // 배치된 박스 추가
          planboxStore.placedBoxes[newRecord.id] = newRecord;
        }
        break;
        
      case 'UPDATE':
        if (newRecord.template_only) {
          planboxStore.updateTemplate(newRecord.id, newRecord);
        } else {
          planboxStore.placedBoxes[newRecord.id] = newRecord;
        }
        break;
        
      case 'DELETE':
        if (oldRecord.template_only) {
          planboxStore.deleteTemplate(oldRecord.id);
        } else {
          planboxStore.removePlacedBox(oldRecord.id);
        }
        break;
    }
  };
  
  // 사용자 액션 처리 (드래그, 리사이즈 등)
  const handleUserAction = (payload: any) => {
    const { action, data, userId } = payload.payload;
    
    // 자신의 액션은 무시
    const currentUser = supabase.auth.getUser();
    if (currentUser && userId === (await currentUser).data.user?.id) return;
    
    switch (action) {
      case 'drag_start':
        // 다른 사용자가 드래그 시작 - 시각적 피드백
        showOtherUserDragging(data.boxId, userId);
        break;
        
      case 'drag_end':
        hideOtherUserDragging(data.boxId, userId);
        break;
        
      case 'resize_start':
        showOtherUserResizing(data.boxId, userId);
        break;
        
      case 'resize_end':
        hideOtherUserResizing(data.boxId, userId);
        break;
        
      case 'cursor_move':
        updateOtherUserCursor(userId, data.x, data.y);
        break;
    }
  };
  
  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      unsubscribeFromTrip();
    };
  }, []);
  
  const value: RealtimeContextValue = {
    isConnected,
    activeUsers,
    subscribeToTrip,
    unsubscribeFromTrip,
    broadcastAction
  };
  
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

// 다른 사용자 상태 시각화 함수들
function showOtherUserDragging(boxId: string, userId: string) {
  const boxElement = document.querySelector(`[data-box-id="${boxId}"]`);
  if (boxElement) {
    boxElement.classList.add('other-user-dragging');
    boxElement.setAttribute('data-dragging-user', userId);
  }
}

function hideOtherUserDragging(boxId: string, userId: string) {
  const boxElement = document.querySelector(`[data-box-id="${boxId}"]`);
  if (boxElement && boxElement.getAttribute('data-dragging-user') === userId) {
    boxElement.classList.remove('other-user-dragging');
    boxElement.removeAttribute('data-dragging-user');
  }
}

function showOtherUserResizing(boxId: string, userId: string) {
  const boxElement = document.querySelector(`[data-box-id="${boxId}"]`);
  if (boxElement) {
    boxElement.classList.add('other-user-resizing');
    boxElement.setAttribute('data-resizing-user', userId);
  }
}

function hideOtherUserResizing(boxId: string, userId: string) {
  const boxElement = document.querySelector(`[data-box-id="${boxId}"]`);
  if (boxElement && boxElement.getAttribute('data-resizing-user') === userId) {
    boxElement.classList.remove('other-user-resizing');
    boxElement.removeAttribute('data-resizing-user');
  }
}

function updateOtherUserCursor(userId: string, x: number, y: number) {
  let cursor = document.querySelector(`[data-cursor-user="${userId}"]`);
  
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.className = 'other-user-cursor';
    cursor.setAttribute('data-cursor-user', userId);
    document.body.appendChild(cursor);
  }
  
  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;
}
```

---

## 📱 PWA 및 모바일 최적화

### 1. **PWA 설정**

```json
// public/manifest.json
{
  "name": "TimePlanBox - 여행 계획 도구",
  "short_name": "TimePlanBox",
  "description": "드래그앤드롭으로 간편하게 만드는 여행 일정표",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976D2",
  "orientation": "portrait-primary",
  "categories": ["travel", "productivity", "lifestyle"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png", 
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128", 
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "shortcuts": [
    {
      "name": "새 여행 만들기",
      "short_name": "새 여행",
      "description": "새로운 여행 계획 시작하기",
      "url": "/dashboard?action=new",
      "icons": [{ "src": "/icons/new-trip-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "최근 여행",
      "short_name": "최근 여행", 
      "description": "최근 작업한 여행 보기",
      "url": "/dashboard?filter=recent",
      "icons": [{ "src": "/icons/recent-96x96.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### 2. **터치 인터페이스 최적화**

```typescript
// lib/hooks/useTouchDragDrop.ts
import { useRef, useState, useCallback } from 'react';

interface TouchDragDropProps {
  onDragStart?: (e: TouchEvent) => void;
  onDragMove?: (e: TouchEvent, deltaX: number, deltaY: number) => void;
  onDragEnd?: (e: TouchEvent) => void;
  threshold?: number;
}

export function useTouchDragDrop({
  onDragStart,
  onDragMove, 
  onDragEnd,
  threshold = 10
}: TouchDragDropProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const dragElementRef = useRef<HTMLElement | null>(null);
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
    dragElementRef.current = e.target as HTMLElement;
    
    // 스크롤 방지
    e.preventDefault();
  }, []);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!startRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startRef.current.x;
    const deltaY = touch.clientY - startRef.current.y;
    
    // 임계값 확인
    if (!isDragging && (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold)) {
      setIsDragging(true);
      onDragStart?.(e);
    }
    
    if (isDragging) {
      onDragMove?.(e, deltaX, deltaY);
      
      // 드래그 중 스크롤 방지
      e.preventDefault();
    }
  }, [isDragging, threshold, onDragStart, onDragMove]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (isDragging) {
      onDragEnd?.(e);
    }
    
    setIsDragging(false);
    startRef.current = null;
    dragElementRef.current = null;
  }, [isDragging, onDragEnd]);
  
  return {
    touchHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    },
    isDragging
  };
}
```

### 3. **반응형 디자인 시스템**

```typescript
// tailwind.config.js 확장
module.exports = {
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px', 
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // 특별한 디바이스 대응
        'iphone-se': { 'raw': '(max-width: 375px) and (max-height: 667px)' },
        'ipad': { 'raw': '(min-width: 768px) and (max-width: 1024px)' },
        'desktop-small': { 'raw': '(min-width: 1024px) and (max-width: 1280px)' }
      },
      spacing: {
        // 타임라인 전용 스페이싱
        'timeline-header': '48px',
        'timeline-slot': '60px',
        'timebar-width': '25px',
        'timebar-width-mobile': '20px',
        'day-column': '150px',
        'day-column-mobile': '120px',
        'day-column-tablet': '140px'
      },
      fontSize: {
        // 타임라인 전용 폰트 크기
        'timeline-header': ['13px', '1.2'],
        'timeline-time': ['11px', '1.1'],
        'planbox-title': ['12px', '1.3'],
        'planbox-time': ['10px', '1.1'],
        'planbox-memo': ['10px', '1.2']
      }
    }
  }
};
```

---

## 🚀 배포 및 운영

### 1. **Vercel 배포 설정**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google 프로필 이미지
      'zoulrywjxmmtvpdzngdw.supabase.co' // Supabase 스토리지
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/supabase/:path*',
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/:path*`
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options', 
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          }
        ]
      }
    ];
  },
  // PWA 설정
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false
      };
    }
    return config;
  }
};

module.exports = nextConfig;
```

### 2. **환경 변수 설정**

```bash
# .env.local (로컬 개발용)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps API (선택사항)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# Kakao Maps API (한국 사용자용)
NEXT_PUBLIC_KAKAO_API_KEY=your-kakao-api-key

# 분석 및 모니터링
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
SENTRY_DSN=your-sentry-dsn

# 배포 환경
NODE_ENV=production
VERCEL_URL=your-app-url.vercel.app
```

### 3. **성능 모니터링**

```typescript
// lib/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

function sendToAnalytics(metric: any) {
  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true
    });
  }
  
  // Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', 'Web Vitals', {
      metric: metric.name,
      value: metric.value,
      id: metric.id
    });
  }
}

// 사용량 추적
export function trackPlanboxAction(action: string, planbox: any) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'planbox_action', {
      event_category: 'PlanBox',
      event_label: action,
      custom_parameters: {
        category: planbox.category,
        duration: planbox.duration
      }
    });
  }
}

export function trackTimelineInteraction(action: string, data: any) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timeline_interaction', {
      event_category: 'Timeline',
      event_label: action,
      custom_parameters: data
    });
  }
}
```

---

## ✅ 마이그레이션 체크리스트

### Phase 1: 기초 설정 (1-2주)
- [ ] Next.js 13 App Router 프로젝트 생성
- [ ] TypeScript, Tailwind CSS, ESLint 설정
- [ ] Supabase 프로젝트 생성 및 데이터베이스 스키마 구축
- [ ] 기본 인증 시스템 구현 (Supabase Auth)
- [ ] 상태 관리 (Zustand) 스토어 구조 설계

### Phase 2: 핵심 기능 (2-3주)
- [ ] Timeline 컴포넌트 기본 구조
- [ ] PlanBox 컴포넌트 및 카테고리 시스템
- [ ] 드래그앤드롭 기능 (react-dnd 또는 dnd-kit)
- [ ] 리사이즈 기능 구현
- [ ] 충돌 감지 시스템
- [ ] 모달 시스템 (생성/편집/설정)

### Phase 3: 데이터 관리 (1-2주)
- [ ] Supabase CRUD API 연동
- [ ] 실시간 동기화 구현
- [ ] 로컬 스토리지 백업/복원
- [ ] 데이터 유효성 검증
- [ ] 오프라인 지원 (PWA)

### Phase 4: UX/UI 개선 (1-2주)
- [ ] 반응형 디자인 완성
- [ ] 모바일 터치 인터페이스
- [ ] 애니메이션 및 트랜지션
- [ ] 접근성 (a11y) 개선
- [ ] 다크 모드 지원

### Phase 5: 고급 기능 (2-3주)  
- [ ] 비용 계산 및 환율 시스템
- [ ] 지도 연동 (Google Maps/Kakao Maps)
- [ ] 여행 공유 및 협업 기능
- [ ] PDF/이미지 내보내기
- [ ] 템플릿 시스템

### Phase 6: 운영 준비 (1주)
- [ ] 성능 최적화
- [ ] SEO 최적화
- [ ] 에러 모니터링 (Sentry)
- [ ] 분석 도구 연동
- [ ] 배포 자동화 (Vercel)

---

## 🎯 성공 지표

### 기능적 완성도
- ✅ 모든 기존 기능 100% 동일하게 작동
- ✅ 드래그앤드롭 정확도 99% 이상
- ✅ 실시간 동기화 지연 시간 < 200ms
- ✅ 모바일 터치 인터페이스 완벽 지원

### 성능 지표
- ✅ Lighthouse Performance Score > 90
- ✅ First Contentful Paint < 1.5s
- ✅ Largest Contentful Paint < 2.5s
- ✅ Cumulative Layout Shift < 0.1

### 사용성 지표
- ✅ 모바일 사용성 점수 > 95
- ✅ 접근성 점수 > 95
- ✅ 크로스 브라우저 호환성 100%

이 마이그레이션 가이드를 따라 진행하면 TimePlanBox의 모든 기능을 현대적인 웹 기술 스택으로 완벽하게 이전할 수 있습니다.