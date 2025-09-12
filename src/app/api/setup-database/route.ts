import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    console.log('🚀 Starting complete database setup...')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        message: 'Missing Supabase environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey
        }
      })
    }

    console.log('🔑 Creating admin client with service role key...')
    // Create admin client with service role key for full permissions
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Step 1: Create plan_boxes table
    console.log('📋 Step 1: Creating plan_boxes table...')
    
    const createTableSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create users table for profile management
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY DEFAULT auth.uid(),
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
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT UNIQUE NOT NULL,
        icon TEXT,
        color TEXT,
        description TEXT,
        is_system BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enhanced plan_boxes table with scalability
      CREATE TABLE IF NOT EXISTS plan_boxes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
        transport_duration INTEGER, -- in minutes
        transport_cost DECIMAL(10,2),
        
        -- Content and media
        memo TEXT,
        tags TEXT[],
        attachments JSONB DEFAULT '[]', -- For images, documents, etc.
        
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
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    `

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (createError) {
      console.log('❌ Table creation failed, trying direct SQL...')
      
      // Try using the REST API directly for table creation
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ sql: createTableSQL })
      })

      if (!response.ok) {
        console.log('❌ Direct SQL also failed, using alternative method...')
        
        // Alternative: Use Supabase Management API
        const managementResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/sql',
            'Authorization': `Bearer ${serviceRoleKey}`,
            'apikey': serviceRoleKey
          },
          body: createTableSQL
        })

        if (!managementResponse.ok) {
          return NextResponse.json({
            success: false,
            message: 'Failed to create table with all methods',
            sqlProvided: createTableSQL,
            instructions: [
              '1. Go to Supabase Dashboard → SQL Editor',
              '2. Paste the SQL provided below',
              '3. Click "Run" to execute'
            ]
          })
        }
      }
    }

    console.log('✅ Table creation completed')

    // Step 2: Setup RLS (Row Level Security)
    console.log('🔒 Step 2: Setting up RLS policies...')
    
    const rlsSQL = `
      -- Enable RLS on all tables
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;
      ALTER TABLE plan_collaborators ENABLE ROW LEVEL SECURITY;
      ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
      
      -- Profiles policies
      CREATE POLICY "Users can view their own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
      CREATE POLICY "Users can update their own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
      CREATE POLICY "Users can insert their own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
      
      -- Travel plans policies
      CREATE POLICY "Users can view their own travel plans" ON travel_plans
        FOR SELECT USING (
          auth.uid() = user_id OR 
          is_public = true OR
          EXISTS (
            SELECT 1 FROM plan_collaborators 
            WHERE travel_plan_id = id AND user_id = auth.uid()
          )
        );
      CREATE POLICY "Users can create travel plans" ON travel_plans
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own travel plans" ON travel_plans
        FOR UPDATE USING (
          auth.uid() = user_id OR
          EXISTS (
            SELECT 1 FROM plan_collaborators 
            WHERE travel_plan_id = id AND user_id = auth.uid() AND role IN ('owner', 'editor')
          )
        );
      CREATE POLICY "Users can delete their own travel plans" ON travel_plans
        FOR DELETE USING (auth.uid() = user_id);
      
      -- Categories policies (allow all to read system categories)
      CREATE POLICY "Anyone can view categories" ON categories
        FOR SELECT USING (true);
      CREATE POLICY "Authenticated users can create custom categories" ON categories
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
      
      -- Plan boxes policies
      CREATE POLICY "Users can view accessible plan boxes" ON plan_boxes
        FOR SELECT USING (
          auth.uid() = user_id OR
          EXISTS (
            SELECT 1 FROM travel_plans tp
            LEFT JOIN plan_collaborators pc ON tp.id = pc.travel_plan_id
            WHERE tp.id = travel_plan_id AND (
              tp.is_public = true OR
              tp.user_id = auth.uid() OR
              (pc.user_id = auth.uid() AND pc.accepted_at IS NOT NULL)
            )
          )
        );
      CREATE POLICY "Users can create plan boxes in accessible travel plans" ON plan_boxes
        FOR INSERT WITH CHECK (
          auth.uid() = user_id AND
          EXISTS (
            SELECT 1 FROM travel_plans tp
            LEFT JOIN plan_collaborators pc ON tp.id = pc.travel_plan_id
            WHERE tp.id = travel_plan_id AND (
              tp.user_id = auth.uid() OR
              (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor') AND pc.accepted_at IS NOT NULL)
            )
          )
        );
      CREATE POLICY "Users can update accessible plan boxes" ON plan_boxes
        FOR UPDATE USING (
          auth.uid() = user_id OR
          EXISTS (
            SELECT 1 FROM travel_plans tp
            LEFT JOIN plan_collaborators pc ON tp.id = pc.travel_plan_id
            WHERE tp.id = travel_plan_id AND (
              tp.user_id = auth.uid() OR
              (pc.user_id = auth.uid() AND pc.role IN ('owner', 'editor') AND pc.accepted_at IS NOT NULL)
            )
          )
        );
      CREATE POLICY "Users can delete their own plan boxes" ON plan_boxes
        FOR DELETE USING (
          auth.uid() = user_id OR
          EXISTS (
            SELECT 1 FROM travel_plans tp
            WHERE tp.id = travel_plan_id AND tp.user_id = auth.uid()
          )
        );
      
      -- Collaboration policies
      CREATE POLICY "Users can view collaborations they're involved in" ON plan_collaborators
        FOR SELECT USING (
          auth.uid() = user_id OR
          EXISTS (
            SELECT 1 FROM travel_plans tp 
            WHERE tp.id = travel_plan_id AND tp.user_id = auth.uid()
          )
        );
      CREATE POLICY "Travel plan owners can manage collaborators" ON plan_collaborators
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM travel_plans tp 
            WHERE tp.id = travel_plan_id AND tp.user_id = auth.uid()
          )
        );
      
      -- Activity log policies
      CREATE POLICY "Users can view activity in accessible plans" ON activity_log
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM travel_plans tp
            LEFT JOIN plan_collaborators pc ON tp.id = pc.travel_plan_id
            WHERE tp.id = travel_plan_id AND (
              tp.user_id = auth.uid() OR
              (pc.user_id = auth.uid() AND pc.accepted_at IS NOT NULL)
            )
          )
        );
      CREATE POLICY "System can insert activity log" ON activity_log
        FOR INSERT WITH CHECK (true);
      
      -- Grant permissions
      GRANT USAGE ON SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
      GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
      
      -- For development: Allow all operations temporarily
      CREATE POLICY "Development: Allow all operations on plan_boxes" ON plan_boxes
        FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "Development: Allow all operations on travel_plans" ON travel_plans
        FOR ALL USING (true) WITH CHECK (true);
      CREATE POLICY "Development: Allow all operations on profiles" ON profiles
        FOR ALL USING (true) WITH CHECK (true);
    `

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL })
    
    if (rlsError) {
      console.log('⚠️ RLS setup failed:', rlsError)
      // Continue anyway, RLS can be set up later
    } else {
      console.log('✅ RLS policies setup completed')
    }

    // Step 3: Insert sample data
    console.log('📦 Step 3: Inserting sample data...')
    
    // Insert categories first
    const categoriesData = [
      { name: 'sightseeing', icon: '🏛️', color: '#3B82F6', description: '관광 및 명소' },
      { name: 'food', icon: '🍽️', color: '#EF4444', description: '식사 및 음식' },
      { name: 'shopping', icon: '🛍️', color: '#10B981', description: '쇼핑' },
      { name: 'accommodation', icon: '🏨', color: '#8B5CF6', description: '숙박' },
      { name: 'transport', icon: '🚗', color: '#F59E0B', description: '교통' },
      { name: 'entertainment', icon: '🎭', color: '#EC4899', description: '엔터테인먼트' },
      { name: 'culture', icon: '🎨', color: '#6366F1', description: '문화 활동' },
      { name: 'nature', icon: '🌿', color: '#059669', description: '자연 및 야외활동' }
    ]

    const { error: categoriesError } = await supabase
      .from('categories')
      .insert(categoriesData)

    if (categoriesError && !categoriesError.message.includes('duplicate key')) {
      console.log('⚠️ Categories insertion failed:', categoriesError)
    }

    // Get category IDs for plan_boxes
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')

    const categoryMap = new Map(categories?.map(cat => [cat.name, cat.id]) || [])

    // Insert a sample travel plan
    const { data: travelPlan, error: planError } = await supabase
      .from('travel_plans')
      .insert({
        title: '서울 3박 4일 여행',
        description: '서울의 주요 명소와 맛집을 둘러보는 여행',
        start_date: '2024-03-15',
        end_date: '2024-03-18',
        destination: '서울, 대한민국',
        budget: 500000,
        currency: 'KRW',
        status: 'active'
      })
      .select('id')
      .single()

    if (planError) {
      console.log('⚠️ Travel plan insertion failed:', planError)
      // Continue with legacy format for backward compatibility
      const legacySampleData = [
        {
          title: '경복궁 관람',
          category_id: categoryMap.get('sightseeing'),
          duration_hour: 2,
          duration_minute: 0,
          memo: '한국의 대표적인 궁궐',
          location_name: '경복궁',
          address: '서울특별시 종로구 사직로 161'
        },
        {
          title: '명동 쇼핑',
          category_id: categoryMap.get('shopping'),
          duration_hour: 1,
          duration_minute: 30,
          memo: '서울 중심가 쇼핑',
          location_name: '명동',
          address: '서울특별시 중구 명동'
        },
        {
          title: '점심식사',
          category_id: categoryMap.get('food'),
          duration_hour: 1,
          duration_minute: 0,
          memo: '한식 맛집',
          estimated_cost: 25000,
          currency: 'KRW'
        }
      ]

      const { error: insertError } = await supabase
        .from('plan_boxes')
        .insert(legacySampleData)

      if (insertError) {
        console.log('⚠️ Sample data insertion failed:', insertError)
      }
    } else {
      // Insert plan boxes with travel plan reference
      const sampleData = [
        {
          travel_plan_id: travelPlan.id,
          title: '경복궁 관람',
          category_id: categoryMap.get('sightseeing'),
          scheduled_date: '2024-03-15',
          start_hour: 10,
          start_minute: 0,
          duration_hour: 2,
          duration_minute: 0,
          has_time_set: true,
          location_name: '경복궁',
          address: '서울특별시 종로구 사직로 161',
          memo: '한국의 대표적인 궁궐, 가이드 투어 예약됨',
          estimated_cost: 3000,
          currency: 'KRW',
          tags: ['궁궐', '역사', '사진촬영'],
          status: 'confirmed',
          priority: 4
        },
        {
          travel_plan_id: travelPlan.id,
          title: '명동 쇼핑',
          category_id: categoryMap.get('shopping'),
          scheduled_date: '2024-03-15',
          start_hour: 14,
          start_minute: 0,
          duration_hour: 1,
          duration_minute: 30,
          has_time_set: true,
          location_name: '명동',
          address: '서울특별시 중구 명동',
          memo: '서울 중심가 쇼핑, 화장품과 패션',
          estimated_cost: 100000,
          currency: 'KRW',
          tags: ['쇼핑', '화장품', '패션'],
          transport_mode: 'subway',
          transport_duration: 20,
          status: 'planned',
          priority: 3
        },
        {
          travel_plan_id: travelPlan.id,
          title: '한국 전통 점심식사',
          category_id: categoryMap.get('food'),
          scheduled_date: '2024-03-15',
          start_hour: 12,
          start_minute: 30,
          duration_hour: 1,
          duration_minute: 0,
          has_time_set: true,
          location_name: '전통 한정식집',
          phone: '02-1234-5678',
          memo: '한식 전문점, 미리 예약 완료',
          estimated_cost: 25000,
          currency: 'KRW',
          tags: ['한식', '전통음식', '예약완료'],
          status: 'confirmed',
          priority: 5
        }
      ]

      const { error: planBoxesError } = await supabase
        .from('plan_boxes')
        .insert(sampleData)

      if (planBoxesError) {
        console.log('⚠️ Plan boxes insertion failed:', planBoxesError)
      } else {
        console.log('✅ Sample data inserted with travel plan')
      }
    }

    // Step 4: Final verification
    console.log('🔍 Step 4: Final verification...')
    
    const { data: verificationData, error: verificationError } = await supabase
      .from('plan_boxes')
      .select('id, title, category')
      .limit(5)

    if (verificationError) {
      return NextResponse.json({
        success: false,
        message: `Verification failed: ${verificationError.message}`,
        error: verificationError
      })
    }

    console.log('🎉 Database setup completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully!',
      details: {
        tableCreated: true,
        rlsSetup: !rlsError,
        sampleDataInserted: !insertError,
        recordCount: verificationData?.length || 0,
        sampleData: verificationData
      }
    })

  } catch (error: any) {
    console.log('💥 Setup failed:', error)
    return NextResponse.json({
      success: false,
      message: `Database setup failed: ${error?.message || error}`,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      }
    })
  }
}