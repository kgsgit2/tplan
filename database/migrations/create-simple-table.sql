-- TPlan Database - Simple Table Creation
-- Copy and paste this into Supabase SQL Editor

CREATE TABLE IF NOT EXISTS plan_boxes (
  id SERIAL PRIMARY KEY,
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

-- Enable security
ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;

-- Allow all operations for development
CREATE POLICY "Allow all operations" ON plan_boxes 
  FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO plan_boxes (title, category, start_hour, start_minute, duration_hour, duration_minute, has_time_set, location_name, address, memo, estimated_cost) 
VALUES 
  ('경복궁 관람', 'sightseeing', 10, 0, 2, 0, true, '경복궁', '서울특별시 종로구 사직로 161', '한국의 대표적인 궁궐', 3000),
  ('명동 쇼핑', 'shopping', 14, 0, 1, 30, true, '명동', '서울특별시 중구 명동', '서울 중심가 쇼핑', 100000),
  ('점심식사', 'food', 12, 30, 1, 0, true, '전통 한정식집', null, '한식 전문점', 25000);