import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function POST() {
  const client = new Client({
    host: 'aws-0-ap-northeast-2.pooler.supabase.com',
    port: 6543,
    database: 'postgres',
    user: 'postgres.fsznctkjtakcvjuhrxpx',
    password: process.env.SUPABASE_DB_PASSWORD || 'tPlan2024!secure',
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('🔌 Connecting to PostgreSQL...')
    await client.connect()
    console.log('✅ Connected successfully!')

    // Create table SQL
    const createTableSQL = `
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create plan_boxes table
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

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_plan_boxes_category ON plan_boxes(category);
      CREATE INDEX IF NOT EXISTS idx_plan_boxes_created_at ON plan_boxes(created_at);

      -- Enable RLS
      ALTER TABLE plan_boxes ENABLE ROW LEVEL SECURITY;

      -- Create permissive policy for development
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'plan_boxes' 
          AND policyname = 'Allow all operations for development'
        ) THEN
          CREATE POLICY "Allow all operations for development" ON plan_boxes 
            FOR ALL USING (true) WITH CHECK (true);
        END IF;
      END $$;

      -- Grant permissions
      GRANT ALL ON plan_boxes TO anon, authenticated;
      GRANT USAGE ON SCHEMA public TO anon, authenticated;
    `

    console.log('📋 Executing table creation SQL...')
    const result = await client.query(createTableSQL)
    console.log('✅ Table creation completed!')

    // Insert sample data
    console.log('📦 Inserting sample data...')
    const insertSQL = `
      INSERT INTO plan_boxes (title, category, start_hour, start_minute, duration_hour, duration_minute, has_time_set, location_name, address, memo, estimated_cost) 
      VALUES 
        ('경복궁 관람', 'sightseeing', 10, 0, 2, 0, true, '경복궁', '서울특별시 종로구 사직로 161', '한국의 대표적인 궁궐', 3000),
        ('명동 쇼핑', 'shopping', 14, 0, 1, 30, true, '명동', '서울특별시 중구 명동', '서울 중심가 쇼핑', 100000),
        ('점심식사', 'food', 12, 30, 1, 0, true, '전통 한정식집', null, '한식 전문점, 미리 예약 완료', 25000)
      ON CONFLICT (id) DO NOTHING;
    `

    const insertResult = await client.query(insertSQL)
    console.log('✅ Sample data inserted!')

    // Verify data
    const verifyResult = await client.query('SELECT id, title, category FROM plan_boxes LIMIT 5')
    console.log('✅ Data verification completed!')

    return NextResponse.json({
      success: true,
      message: '데이터베이스 설정이 완료되었습니다!',
      details: {
        tablesCreated: true,
        sampleDataInserted: true,
        recordCount: verifyResult.rows.length,
        sampleData: verifyResult.rows
      }
    })

  } catch (error: any) {
    console.log('❌ Error:', error)
    return NextResponse.json({
      success: false,
      message: `데이터베이스 연결 실패: ${error.message}`,
      error: {
        name: error.name,
        message: error.message,
        code: error.code
      },
      troubleshooting: [
        '1. Supabase 프로젝트 설정에서 Database 패스워드 확인',
        '2. Database Settings → Connection pooling 확인',
        '3. .env.local 파일에 SUPABASE_DB_PASSWORD 환경변수 추가'
      ]
    })
  } finally {
    await client.end()
  }
}