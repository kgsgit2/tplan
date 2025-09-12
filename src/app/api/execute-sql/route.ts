import { NextResponse } from 'next/server'

export async function POST() {
  const sqlScript = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for profile management
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'Asia/Seoul',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create travel plans table for organizing trips
CREATE TABLE IF NOT EXISTS travel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  destination TEXT,
  destination_coordinates POINT,
  budget DECIMAL(10,2),
  currency TEXT DEFAULT 'KRW',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  is_public BOOLEAN DEFAULT false,
  collaboration_settings JSONB DEFAULT '{"allowEdit": false, "allowComment": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table for better organization
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced plan_boxes table with scalability
CREATE TABLE IF NOT EXISTS plan_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_plan_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  title TEXT NOT NULL,
  description TEXT,
  
  -- Time scheduling
  scheduled_date DATE,
  start_hour INTEGER CHECK (start_hour >= 0 AND start_hour <= 23),
  start_minute INTEGER CHECK (start_minute >= 0 AND start_minute <= 59),
  duration_hour INTEGER NOT NULL DEFAULT 1 CHECK (duration_hour >= 0),
  duration_minute INTEGER NOT NULL DEFAULT 0 CHECK (duration_minute >= 0 AND duration_minute <= 59),
  has_time_set BOOLEAN DEFAULT false,
  
  -- Location data
  location_name TEXT,
  address TEXT,
  coordinates POINT,
  phone TEXT,
  website_url TEXT,
  
  -- Financial data
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  currency TEXT DEFAULT 'KRW',
  
  -- Transport and logistics
  transport_mode TEXT CHECK (transport_mode IN ('walk', 'taxi', 'bus', 'subway', 'car', 'bicycle', 'other')),
  transport_duration INTEGER,
  transport_cost DECIMAL(10,2),
  
  -- Content and media
  memo TEXT,
  tags TEXT[],
  attachments JSONB DEFAULT '[]',
  
  -- Collaboration and status
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  
  -- Versioning and sync
  version INTEGER DEFAULT 1,
  last_modified_by UUID REFERENCES profiles(id),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'conflict')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaboration table for sharing plans
CREATE TABLE IF NOT EXISTS plan_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_plan_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer', 'commenter')),
  permissions JSONB DEFAULT '{"canEdit": false, "canDelete": false, "canInvite": false}',
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(travel_plan_id, user_id)
);

-- Create activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_plan_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('plan_box', 'travel_plan', 'collaboration')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'share', 'comment')),
  changes JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_travel_plans_user_id ON travel_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_plans_dates ON travel_plans(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_plan_boxes_travel_plan_id ON plan_boxes(travel_plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_boxes_user_id ON plan_boxes(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_boxes_category_id ON plan_boxes(category_id);
CREATE INDEX IF NOT EXISTS idx_plan_boxes_scheduled_date ON plan_boxes(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_plan_boxes_coordinates ON plan_boxes USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_plan_boxes_tags ON plan_boxes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_plan_collaborators_travel_plan_id ON plan_collaborators(travel_plan_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_travel_plan_id ON activity_log(travel_plan_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Development policies (allow all operations for now)
CREATE POLICY "Development: Allow all operations on profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Development: Allow all operations on travel_plans" ON travel_plans
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Development: Allow all operations on categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Development: Allow all operations on plan_boxes" ON plan_boxes
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Development: Allow all operations on plan_collaborators" ON plan_collaborators
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Development: Allow all operations on activity_log" ON activity_log
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert initial categories
INSERT INTO categories (name, icon, color, description) VALUES
  ('sightseeing', '🏛️', '#3B82F6', '관광 및 명소'),
  ('food', '🍽️', '#EF4444', '식사 및 음식'),
  ('shopping', '🛍️', '#10B981', '쇼핑'),
  ('accommodation', '🏨', '#8B5CF6', '숙박'),
  ('transport', '🚗', '#F59E0B', '교통'),
  ('entertainment', '🎭', '#EC4899', '엔터테인먼트'),
  ('culture', '🎨', '#6366F1', '문화 활동'),
  ('nature', '🌿', '#059669', '자연 및 야외활동')
ON CONFLICT (name) DO NOTHING;

-- Insert sample travel plan
INSERT INTO travel_plans (title, description, start_date, end_date, destination, budget, currency, status) VALUES
  ('서울 3박 4일 여행', '서울의 주요 명소와 맛집을 둘러보는 여행', '2024-03-15', '2024-03-18', '서울, 대한민국', 500000, 'KRW', 'active')
ON CONFLICT DO NOTHING;
`

  return NextResponse.json({
    success: true,
    message: '데이터베이스 스키마 생성을 위한 SQL이 준비되었습니다.',
    instructions: [
      '1. Supabase 대시보드 (https://fsznctkjtakcvjuhrxpx.supabase.co) 에 접속',
      '2. SQL Editor 메뉴로 이동',
      '3. 아래 SQL을 복사하여 붙여넣기',
      '4. Run 버튼 클릭하여 실행'
    ],
    sql: sqlScript,
    architecture: {
      tables: [
        'profiles: 사용자 프로필 관리',
        'travel_plans: 여행 계획 관리 (확장성)',
        'categories: 카테고리 시스템 (아이콘, 색상 지원)',
        'plan_boxes: 향상된 플랜 박스 (위치, 비용, 상태, 태그)',
        'plan_collaborators: 다중 사용자 협업 지원',
        'activity_log: 변경 이력 추적'
      ],
      features: [
        '🔒 Row Level Security (RLS) 적용',
        '📊 성능 최적화 인덱스',
        '🌍 지리정보 지원 (POINT 타입)',
        '💰 다중 통화 지원',
        '🏷️ 태그 시스템',
        '📱 실시간 동기화 준비',
        '👥 협업 및 권한 관리',
        '📝 변경 이력 추적'
      ]
    }
  })
}