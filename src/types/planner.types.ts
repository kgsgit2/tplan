// TPlan 플래너 관련 타입 정의

export type CategoryType = 
  | 'food'          // 식사
  | 'transport'     // 이동  
  | 'activity'      // 활동
  | 'sightseeing'   // 관광
  | 'shopping'      // 쇼핑
  | 'accommodation' // 숙박

export type TimeBlockType = 'dawn' | 'morning' | 'afternoon' | 'evening'

export interface PlanBox {
  id: string
  tripId: string
  day: number
  startTime: string        // "HH:MM" 형식
  duration: number         // 분 단위
  category: CategoryType
  title: string
  memo?: string
  location?: string
  cost?: number
  currency?: string
  position?: {
    x: number
    y: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface Trip {
  id: string
  userId: string
  title: string
  startDate: Date
  endDate: Date
  destination: string
  isDomestic: boolean
  settings?: TripSettings
  planBoxes: PlanBox[]
  createdAt: Date
  updatedAt: Date
}

export interface TripSettings {
  timeRange?: {
    start: number  // 시작 시간 (0-23)
    end: number    // 종료 시간 (0-23)
  }
  currency?: string
  timezone?: string
  isPublic?: boolean
}

export interface DragDropContext {
  draggedItem: PlanBox | null
  dragPosition: { x: number, y: number }
  isCloneMode: boolean
  dropTarget: string | null
}

export interface TimeSlot {
  day: number
  hour: number
  minute: number
  isOccupied: boolean
  occupiedBy?: string  // PlanBox ID
}

// 드래그앤드롭 이벤트 타입
export interface DragEvent {
  planBox: PlanBox
  sourcePosition: { day: number, time: string }
  targetPosition: { day: number, time: string }
  isClone: boolean
}

// 타임라인 설정
export interface TimelineConfig {
  minHour: number
  maxHour: number
  snapToMinutes: number
  pixelsPerMinute: number
}

// 충돌 감지 결과
export interface ConflictResult {
  hasConflict: boolean
  conflictingBoxes: PlanBox[]
  suggestedTime?: string
}