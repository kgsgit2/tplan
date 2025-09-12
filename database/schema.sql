-- =====================================================
-- TPlan Database Schema v1.0
-- =====================================================
-- Complete database architecture for travel planning app
-- Execute this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CLEANUP (Optional - uncomment if resetting)
-- =====================================================
-- DROP TABLE IF EXISTS trip_shares CASCADE;
-- DROP TABLE IF EXISTS user_favorites CASCADE;
-- DROP TABLE IF EXISTS trip_templates CASCADE;
-- DROP TABLE IF EXISTS collaboration_sessions CASCADE;
-- DROP TABLE IF EXISTS activity_logs CASCADE;
-- DROP TABLE IF EXISTS sync_queue CASCADE;
-- DROP TABLE IF EXISTS trip_collaborators CASCADE;
-- DROP TABLE IF EXISTS plan_items CASCADE;
-- DROP TABLE IF EXISTS trips CASCADE;
-- DROP TABLE IF EXISTS locations CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TYPE IF EXISTS collaboration_role CASCADE;
-- DROP TYPE IF EXISTS trip_visibility CASCADE;
-- DROP TYPE IF EXISTS transport_mode CASCADE;
-- DROP TYPE IF EXISTS category_type CASCADE;

-- =====================================================
-- 2. EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 3. CUSTOM TYPES
-- =====================================================

DO $$ BEGIN
    CREATE TYPE category_type AS ENUM (
        'food',
        'transport', 
        'activity',
        'sightseeing',
        'shopping',
        'accommodation',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE trip_visibility AS ENUM (
        'private',
        'shared',
        'public'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE collaboration_role AS ENUM (
        'owner',
        'editor',
        'viewer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 4. CORE TABLES
-- =====================================================

-- User profiles
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

-- Locations
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    category category_type,
    address TEXT,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    place_id VARCHAR(255),
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

-- Trips
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

-- Plan items
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
    transport_duration INTEGER,
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

-- =====================================================
-- 5. SYNC & COLLABORATION TABLES
-- =====================================================

-- Sync queue
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL,
    conflict_resolution JSONB,
    synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
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

-- Collaboration sessions
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
-- 6. FEATURE TABLES
-- =====================================================

-- Trip templates
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
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entity_type, entity_id)
);

-- Trip shares
CREATE TABLE IF NOT EXISTS trip_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    share_code VARCHAR(20) UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    password_hash TEXT,
    permissions JSONB DEFAULT '{"canView": true, "canEdit": false}',
    expires_at TIMESTAMPTZ,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. INDEXES
-- =====================================================

-- User profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_trips_destination ON trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_visibility ON trips(visibility) WHERE visibility != 'private';
CREATE INDEX IF NOT EXISTS idx_trips_archived ON trips(is_archived, user_id);

-- Plan items
CREATE INDEX IF NOT EXISTS idx_plan_items_trip_day ON plan_items(trip_id, day_number);
CREATE INDEX IF NOT EXISTS idx_plan_items_category ON plan_items(category);
CREATE INDEX IF NOT EXISTS idx_plan_items_location ON plan_items(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_plan_items_time ON plan_items(start_time, end_time);

-- Locations
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_tags ON locations USING GIN(tags);

-- Collaborators
CREATE INDEX IF NOT EXISTS idx_collaborators_trip ON trip_collaborators(trip_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON trip_collaborators(user_id);

-- Activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_trip ON activity_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Sync queue
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_pending ON sync_queue(user_id, synced_at) WHERE synced_at IS NULL;

-- Trip shares
CREATE INDEX IF NOT EXISTS idx_share_code ON trip_shares(share_code);

-- =====================================================
-- 8. FUNCTIONS & TRIGGERS
-- =====================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at 
    BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_items_updated_at ON plan_items;
CREATE TRIGGER update_plan_items_updated_at 
    BEFORE UPDATE ON plan_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trip statistics function
CREATE OR REPLACE FUNCTION get_trip_stats(trip_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_items', COUNT(*)::INTEGER,
        'total_cost', COALESCE(SUM(cost), 0),
        'days_count', COUNT(DISTINCT day_number)::INTEGER,
        'categories', (
            SELECT json_object_agg(category, count)
            FROM (
                SELECT category, COUNT(*) as count
                FROM plan_items
                WHERE trip_id = trip_uuid
                GROUP BY category
            ) c
        )
    ) INTO result
    FROM plan_items
    WHERE trip_id = trip_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
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
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Trips policies
DROP POLICY IF EXISTS "Users can view trips" ON trips;
CREATE POLICY "Users can view trips" ON trips
    FOR SELECT USING (
        auth.uid() = user_id OR
        visibility = 'public' OR
        EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_id = trips.id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can create trips" ON trips;
CREATE POLICY "Users can create trips" ON trips
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update trips" ON trips;
CREATE POLICY "Users can update trips" ON trips
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM trip_collaborators
            WHERE trip_id = trips.id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'editor')
        )
    );

DROP POLICY IF EXISTS "Users can delete trips" ON trips;
CREATE POLICY "Users can delete trips" ON trips
    FOR DELETE USING (auth.uid() = user_id);

-- Plan items policies
DROP POLICY IF EXISTS "Users can view plan items" ON plan_items;
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

DROP POLICY IF EXISTS "Users can manage plan items" ON plan_items;
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
-- 10. DEFAULT DATA
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, type, icon, color, display_order) VALUES
    ('음식', 'food', 'restaurant', '#FF6B6B', 1),
    ('교통', 'transport', 'directions_car', '#4ECDC4', 2),
    ('활동', 'activity', 'hiking', '#45B7D1', 3),
    ('관광', 'sightseeing', 'photo_camera', '#96CEB4', 4),
    ('쇼핑', 'shopping', 'shopping_bag', '#FFEAA7', 5),
    ('숙박', 'accommodation', 'hotel', '#DDA0DD', 6),
    ('기타', 'other', 'more_horiz', '#95A5A6', 7)
ON CONFLICT (type) DO UPDATE SET
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    display_order = EXCLUDED.display_order;

-- =====================================================
-- 11. DEVELOPMENT POLICIES (Remove in production)
-- =====================================================

-- Temporary policy for development without auth
DROP POLICY IF EXISTS "Allow anonymous read for development" ON trips;
CREATE POLICY "Allow anonymous read for development" ON trips
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read for development" ON plan_items;
CREATE POLICY "Allow anonymous read for development" ON plan_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert for development" ON trips;
CREATE POLICY "Allow anonymous insert for development" ON trips
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous insert for development" ON plan_items;
CREATE POLICY "Allow anonymous insert for development" ON plan_items
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 12. VERIFICATION QUERIES
-- =====================================================

-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('trips', 'plan_items', 'user_profiles', 'locations', 'categories');

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;