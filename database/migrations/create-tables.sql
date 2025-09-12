-- TPlan Database Schema Creation
-- Execute this SQL in Supabase SQL Editor

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