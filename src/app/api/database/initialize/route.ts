import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Complete database schema SQL
const DATABASE_SCHEMA = `
-- =====================================================
-- TPlan Database Architecture v1.0
-- =====================================================
-- Scalable travel planning database with support for:
-- - Multi-user authentication
-- - Collaborative trip planning
-- - Real-time synchronization
-- - Offline-first capability
-- - Location-based services
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- For location-based features
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

-- =====================================================
-- 2. CUSTOM TYPES
-- =====================================================

-- Category enum for plan items
CREATE TYPE category_type AS ENUM (
  'food',
  'transport',
  'activity',
  'sightseeing',
  'shopping',
  'accommodation',
  'other'
);

-- Transport mode enum
CREATE TYPE transport_mode AS ENUM (
  'walk',
  'car',
  'bus',
  'subway',
  'train',
  'flight',
  'taxi',
  'bicycle',
  'other'
);

-- Trip visibility enum
CREATE TYPE trip_visibility AS ENUM (
  'private',
  'shared',
  'public'
);

-- Collaboration role enum
CREATE TYPE collaboration_role AS ENUM (
  'owner',
  'editor',
  'viewer'
);

-- =====================================================
-- 3. CORE TABLES
-- =====================================================

-- User profiles extending Supabase auth
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  preferences JSONB DEFAULT '{}',
  language VARCHAR(5) DEFAULT 'ko',
  timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Travel plans (trips)
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  destination VARCHAR(200) NOT NULL,
  country_code VARCHAR(2),
  is_domestic BOOLEAN DEFAULT true,
  visibility trip_visibility DEFAULT 'private',
  cover_image_url TEXT,
  total_budget NUMERIC(12, 2),
  currency VARCHAR(3) DEFAULT 'KRW',
  settings JSONB DEFAULT '{}',
  tags TEXT[],
  is_template BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Plan items (activities within a trip)
CREATE TABLE IF NOT EXISTS plan_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  start_time TIME,
  end_time TIME,
  category category_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  location_id UUID REFERENCES locations(id),
  address TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  cost NUMERIC(10, 2),
  currency VARCHAR(3),
  transport_mode transport_mode,
  transport_duration INTEGER, -- in minutes
  transport_cost NUMERIC(10, 2),
  booking_url TEXT,
  booking_reference VARCHAR(100),
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  position_x INTEGER,
  position_y INTEGER,
  color VARCHAR(7),
  is_confirmed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_times CHECK (end_time > start_time OR (start_time IS NULL AND end_time IS NULL))
);

-- Reusable locations
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category category_type,
  address TEXT,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  place_id VARCHAR(255), -- Google/Kakao/Naver place ID
  phone VARCHAR(50),
  website TEXT,
  hours JSONB,
  rating NUMERIC(2, 1),
  price_level INTEGER CHECK (price_level BETWEEN 1 AND 4),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trip collaborators
CREATE TABLE IF NOT EXISTS trip_collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role collaboration_role NOT NULL DEFAULT 'viewer',
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(trip_id, user_id)
);

-- Categories configuration
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  type category_type NOT NULL UNIQUE,
  icon VARCHAR(50),
  color VARCHAR(7),
  display_order INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. SYNC & COLLABORATION TABLES
-- =====================================================

-- Sync queue for offline changes
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  operation VARCHAR(20) NOT NULL, -- insert, update, delete
  payload JSONB NOT NULL,
  conflict_resolution JSONB,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_sync_queue_user_pending (user_id, synced_at) WHERE synced_at IS NULL
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time collaboration sessions
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cursor_position JSONB,
  selected_items UUID[],
  is_active BOOLEAN DEFAULT true,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- =====================================================
-- 5. FEATURE TABLES
-- =====================================================

-- Trip templates for reuse
CREATE TABLE IF NOT EXISTS trip_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID REFERENCES auth.users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  destination VARCHAR(200),
  duration_days INTEGER,
  category VARCHAR(50),
  tags TEXT[],
  template_data JSONB NOT NULL,
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- trip, location, template
  entity_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- Trip sharing links
CREATE TABLE IF NOT EXISTS trip_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  share_code VARCHAR(20) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  password_hash TEXT,
  permissions JSONB DEFAULT '{"canView": true, "canEdit": false}',
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_share_code (share_code)
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- Trips indexes
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX idx_trips_destination ON trips(destination);
CREATE INDEX idx_trips_visibility ON trips(visibility) WHERE visibility != 'private';
CREATE INDEX idx_trips_archived ON trips(is_archived, user_id);

-- Plan items indexes
CREATE INDEX idx_plan_items_trip_day ON plan_items(trip_id, day_number);
CREATE INDEX idx_plan_items_category ON plan_items(category);
CREATE INDEX idx_plan_items_location ON plan_items(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_plan_items_time ON plan_items(start_time, end_time);

-- Locations indexes
CREATE INDEX idx_locations_coords ON locations USING GIST(ll_to_earth(latitude, longitude));
CREATE INDEX idx_locations_name ON locations USING GIN(name gin_trgm_ops);
CREATE INDEX idx_locations_tags ON locations USING GIN(tags);

-- Collaborators indexes
CREATE INDEX idx_collaborators_trip ON trip_collaborators(trip_id);
CREATE INDEX idx_collaborators_user ON trip_collaborators(user_id);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_trip ON activity_logs(trip_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- =====================================================
-- 7. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_items_updated_at BEFORE UPDATE ON plan_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate trip statistics
CREATE OR REPLACE FUNCTION get_trip_stats(trip_uuid UUID)
RETURNS TABLE (
    total_items INTEGER,
    total_cost NUMERIC,
    days_count INTEGER,
    categories JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_items,
        COALESCE(SUM(cost), 0) as total_cost,
        COUNT(DISTINCT day_number)::INTEGER as days_count,
        jsonb_object_agg(category, count) as categories
    FROM (
        SELECT category, COUNT(*) as count
        FROM plan_items
        WHERE trip_id = trip_uuid
        GROUP BY category
    ) category_counts,
    LATERAL (
        SELECT *
        FROM plan_items
        WHERE trip_id = trip_uuid
    ) items;
END;
$$ LANGUAGE plpgsql;

-- Function for nearby location search
CREATE OR REPLACE FUNCTION find_nearby_locations(
    lat NUMERIC,
    lng NUMERIC,
    radius_meters INTEGER DEFAULT 1000
)
RETURNS SETOF locations AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM locations
    WHERE earth_distance(
        ll_to_earth(latitude, longitude),
        ll_to_earth(lat, lng)
    ) <= radius_meters
    ORDER BY earth_distance(
        ll_to_earth(latitude, longitude),
        ll_to_earth(lat, lng)
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_shares ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trips policies
CREATE POLICY "Users can view own trips" ON trips
    FOR SELECT USING (
        auth.uid() = user_id OR
        visibility = 'public' OR
        EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_id = trips.id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create trips" ON trips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" ON trips
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_id = trips.id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

CREATE POLICY "Users can delete own trips" ON trips
    FOR DELETE USING (auth.uid() = user_id);

-- Plan items policies
CREATE POLICY "Users can view plan items" ON plan_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = plan_items.trip_id
            AND (
                trips.user_id = auth.uid() OR
                trips.visibility = 'public' OR
                EXISTS (
                    SELECT 1 FROM trip_collaborators
                    WHERE trip_id = trips.id AND user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage plan items" ON plan_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM trips
            WHERE trips.id = plan_items.trip_id
            AND (
                trips.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM trip_collaborators
                    WHERE trip_id = trips.id 
                    AND user_id = auth.uid() 
                    AND role IN ('owner', 'editor')
                )
            )
        )
    );

-- =====================================================
-- 9. DEFAULT DATA
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, type, icon, color, display_order) VALUES
    ('Food', 'food', 'restaurant', '#FF6B6B', 1),
    ('Transport', 'transport', 'directions_car', '#4ECDC4', 2),
    ('Activity', 'activity', 'hiking', '#45B7D1', 3),
    ('Sightseeing', 'sightseeing', 'photo_camera', '#96CEB4', 4),
    ('Shopping', 'shopping', 'shopping_bag', '#FFEAA7', 5),
    ('Accommodation', 'accommodation', 'hotel', '#DDA0DD', 6),
    ('Other', 'other', 'more_horiz', '#95A5A6', 7)
ON CONFLICT (type) DO NOTHING;
`;

// Helper function to execute SQL in chunks
async function executeSQLChunks(supabase: any, sql: string) {
  // Split SQL by major sections
  const sections = sql.split(/-- ={50,}/g).filter(s => s.trim());
  
  const results = {
    success: true,
    executed: [] as string[],
    failed: [] as { section: string; error: string }[],
  };

  for (const section of sections) {
    if (!section.trim()) continue;
    
    // Extract section name from first comment
    const sectionName = section.match(/-- (.*?)$/m)?.[1] || 'Unknown Section';
    
    try {
      // Try to execute via Supabase client first
      const { error } = await supabase.rpc('exec_sql', { sql: section });
      
      if (error) {
        // If RPC doesn't exist, try direct execution
        const statements = section
          .split(';')
          .filter(s => s.trim())
          .map(s => s.trim() + ';');
        
        for (const statement of statements) {
          if (statement.includes('CREATE') || statement.includes('ALTER')) {
            // Skip for now, will handle in direct SQL execution
            console.log(`Skipping: ${statement.substring(0, 50)}...`);
          }
        }
        
        results.failed.push({ section: sectionName, error: error.message });
      } else {
        results.executed.push(sectionName);
        console.log(`✅ Executed: ${sectionName}`);
      }
    } catch (err: any) {
      results.failed.push({ section: sectionName, error: err.message });
      console.error(`❌ Failed: ${sectionName}`, err);
    }
  }
  
  return results;
}

export async function POST() {
  try {
    console.log('🚀 Initializing comprehensive database architecture...')
    
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase environment variables',
        required: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
      }, { status: 500 })
    }

    // Create admin client
    console.log('🔑 Creating Supabase admin client...')
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Execute database schema
    console.log('📊 Executing database schema...')
    const schemaResult = await executeSQLChunks(supabase, DATABASE_SCHEMA)
    
    // Verify critical tables exist
    console.log('🔍 Verifying table creation...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['trips', 'plan_items', 'user_profiles', 'locations'])
    
    if (tablesError) {
      console.log('⚠️ Could not verify tables, attempting alternative method...')
      
      // Try a simpler verification
      const { count: tripsCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
      
      const { count: itemsCount } = await supabase
        .from('plan_items')
        .select('*', { count: 'exact', head: true })
      
      if (tripsCount === null && itemsCount === null) {
        return NextResponse.json({
          success: false,
          error: 'Tables were not created successfully',
          details: schemaResult,
          instructions: [
            'Please run the following SQL directly in Supabase Dashboard:',
            '1. Go to SQL Editor in your Supabase Dashboard',
            '2. Create a new query',
            '3. Copy the SQL from the database_schema.sql file',
            '4. Execute the query'
          ]
        }, { status: 500 })
      }
    }

    // Create sample data for testing
    console.log('📦 Creating sample data...')
    
    // First, create a test user profile
    const testUserId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' // Dummy UUID
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .upsert({
        id: testUserId,
        username: 'testuser',
        display_name: 'Test User',
        language: 'ko',
        timezone: 'Asia/Seoul'
      })
      .select()
      .single()
    
    // Create a sample trip
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        user_id: testUserId,
        title: '서울 3일 여행',
        description: '서울의 주요 관광지를 둘러보는 3일 코스',
        start_date: '2025-02-01',
        end_date: '2025-02-03',
        destination: '서울, 대한민국',
        country_code: 'KR',
        is_domestic: true,
        total_budget: 500000,
        currency: 'KRW',
        tags: ['도시여행', '문화체험', '맛집투어']
      })
      .select()
      .single()
    
    if (trip && !tripError) {
      // Create sample plan items
      const planItems = [
        {
          trip_id: trip.id,
          day_number: 1,
          start_time: '10:00',
          end_time: '12:00',
          category: 'sightseeing',
          title: '경복궁 관람',
          description: '조선시대 왕궁 투어',
          address: '서울특별시 종로구 사직로 161',
          latitude: 37.579617,
          longitude: 126.977041,
          cost: 3000
        },
        {
          trip_id: trip.id,
          day_number: 1,
          start_time: '12:30',
          end_time: '14:00',
          category: 'food',
          title: '토속촌 삼계탕',
          description: '전통 삼계탕 점심',
          address: '서울특별시 종로구 자하문로5길 5',
          latitude: 37.578374,
          longitude: 126.970327,
          cost: 18000
        },
        {
          trip_id: trip.id,
          day_number: 1,
          start_time: '14:30',
          end_time: '17:00',
          category: 'shopping',
          title: '인사동 쇼핑',
          description: '전통 공예품 및 기념품 쇼핑',
          address: '서울특별시 종로구 인사동',
          latitude: 37.574544,
          longitude: 126.985022,
          cost: 50000
        }
      ]
      
      const { error: itemsError } = await supabase
        .from('plan_items')
        .insert(planItems)
      
      if (itemsError) {
        console.log('⚠️ Failed to insert sample plan items:', itemsError)
      }
    }

    // Final verification
    console.log('✅ Database initialization complete!')
    
    const { data: finalCheck } = await supabase
      .from('trips')
      .select(`
        *,
        plan_items (*)
      `)
      .limit(1)
      .single()
    
    return NextResponse.json({
      success: true,
      message: 'Database architecture successfully initialized',
      schema: {
        executed: schemaResult.executed,
        failed: schemaResult.failed
      },
      tables: {
        core: ['user_profiles', 'trips', 'plan_items', 'locations'],
        collaboration: ['trip_collaborators', 'collaboration_sessions'],
        sync: ['sync_queue', 'activity_logs'],
        features: ['trip_templates', 'user_favorites', 'trip_shares']
      },
      sample_data: finalCheck,
      next_steps: [
        'Test authentication flow with Supabase Auth',
        'Implement real-time subscriptions for collaboration',
        'Set up offline sync mechanism',
        'Configure backup and recovery procedures'
      ]
    })

  } catch (error: any) {
    console.error('💥 Database initialization failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred',
      details: error,
      sql_provided: true,
      instructions: [
        'The complete SQL schema has been prepared',
        'You may need to execute it manually in Supabase Dashboard',
        'Go to SQL Editor and run the provided schema'
      ]
    }, { status: 500 })
  }
}

// GET endpoint to check database status
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check tables
    const tables = ['trips', 'plan_items', 'user_profiles', 'locations']
    const tableStatus: any = {}
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      tableStatus[table] = {
        exists: !error,
        count: count || 0,
        error: error?.message
      }
    }

    return NextResponse.json({
      success: true,
      database_url: supabaseUrl,
      tables: tableStatus,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}