import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🚀 Attempting direct PostgreSQL connection...')
    
    // For now, return SQL that needs to be executed manually
    const createTableSQL = `
-- TPlan Database Schema Creation
-- Execute this SQL in Supabase SQL Editor (https://fsznctkjtakcvjuhrxpx.supabase.co)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create simple plan_boxes table for immediate use
CREATE TABLE IF NOT EXISTS plan_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  start_hour INTEGER,
  start_minute INTEGER,
  duration_hour INTEGER NOT NULL DEFAULT 1,
  duration_minute INTEGER NOT NULL DEFAULT 0,
  has_time_set BOOLEAN DEFAULT false,
  memo TEXT,
  location_name TEXT,
  address TEXT,
  phone TEXT,
  estimated_cost DECIMAL(10,2),
  transport_mode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_plan_boxes_category ON plan_boxes(category);
CREATE INDEX IF NOT EXISTS idx_plan_boxes_created_at ON plan_boxes(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;

-- Create development policy (allow all operations)
CREATE POLICY "Allow all operations for development" ON plan_boxes 
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON plan_boxes TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Insert sample data
INSERT INTO plan_boxes (title, category, start_hour, start_minute, duration_hour, duration_minute, has_time_set, location_name, address, memo, estimated_cost) VALUES
  ('경복궁 관람', 'sightseeing', 10, 0, 2, 0, true, '경복궁', '서울특별시 종로구 사직로 161', '한국의 대표적인 궁궐', 3000),
  ('명동 쇼핑', 'shopping', 14, 0, 1, 30, true, '명동', '서울특별시 중구 명동', '서울 중심가 쇼핑', 100000),
  ('점심식사', 'food', 12, 30, 1, 0, true, '전통 한정식집', null, '한식 전문점, 미리 예약 완료', 25000);
`

    return NextResponse.json({
      success: true,
      message: "SQL 준비 완료! 아래 단계를 따라하세요:",
      steps: [
        "1. 브라우저에서 https://fsznctkjtakcvjuhrxpx.supabase.co 접속",
        "2. 왼쪽 사이드바에서 'SQL Editor' 클릭",
        "3. 'New query' 버튼 클릭",
        "4. 아래 SQL을 복사해서 붙여넣기",
        "5. 'Run' 버튼 클릭하여 실행",
        "6. 성공하면 /api/test-supabase로 연결 테스트"
      ],
      sql: createTableSQL,
      dashboardUrl: "https://fsznctkjtakcvjuhrxpx.supabase.co",
      testUrl: "/api/test-supabase"
    })

  } catch (error: any) {
    console.log('💥 Error:', error)
    return NextResponse.json({
      success: false,
      message: `Error: ${error?.message || error}`,
      error: {
        name: error?.name,
        message: error?.message
      }
    })
  }
}