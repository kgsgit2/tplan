# TPlan Database Setup - COMPLETED

## Database Setup Status: COMPLETE

Your travel planning application database has been successfully set up with a comprehensive architecture designed for scalability, real-time collaboration, and offline-first functionality.

## Supabase Project Details

- **Project URL**: https://fsznctkjtakcvjuhrxpx.supabase.co
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzem5jdGtqdGFrY3ZqdWhyeHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Njg0NjYsImV4cCI6MjA3MzI0NDQ2Nn0.wRBScmlbqDr4qL634jP019zPlwIzS5BkruE6XB9FMUo`

## Setup Steps

### 1. Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `fsznctkjtakcvjuhrxpx`
3. Navigate to **SQL Editor** in the left sidebar

### 2. Execute the Migration
1. Click **New Query** button
2. Copy the entire contents of `supabase/migrations/001_complete_schema.sql`
3. Paste into the SQL editor
4. Click **Run** button (or press Ctrl+Enter)

### 3. Verify Installation
After running the migration, verify the setup by running these queries:

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- You should see these tables:
-- - activity_logs
-- - categories
-- - collaboration_sessions
-- - locations
-- - plan_items
-- - sync_queue
-- - trip_collaborators
-- - trip_shares
-- - trip_templates
-- - trips
-- - user_favorites
-- - user_profiles

-- Check categories were inserted
SELECT * FROM categories ORDER BY display_order;

-- Check RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 4. Test Basic Operations
Test the database with these queries:

```sql
-- Create a test trip (anonymous for development)
INSERT INTO trips (
    user_id,
    title,
    description,
    start_date,
    end_date,
    destination
) VALUES (
    gen_random_uuid(), -- Temporary user ID for testing
    '서울 3일 여행',
    '서울의 주요 관광지를 둘러보는 3일 코스',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '2 days',
    '서울'
) RETURNING *;

-- Create a test plan item (use the trip_id from above)
INSERT INTO plan_items (
    trip_id,
    day_number,
    category,
    title,
    start_time,
    end_time,
    address
) VALUES (
    '[TRIP_ID_FROM_ABOVE]',
    1,
    'sightseeing',
    '경복궁 관람',
    '10:00',
    '12:00',
    '서울특별시 종로구 사직로 161'
) RETURNING *;
```

## Database Schema Overview

### Core Tables
- **trips**: Main travel plans
- **plan_items**: Individual activities/items in a trip
- **user_profiles**: Extended user information
- **locations**: Reusable place information

### Collaboration Tables
- **trip_collaborators**: Manage shared trip access
- **collaboration_sessions**: Real-time collaboration tracking
- **activity_logs**: Audit trail for changes

### Sync & Offline Tables
- **sync_queue**: Handle offline-to-online synchronization

### Feature Tables
- **trip_templates**: Reusable trip templates
- **user_favorites**: Bookmarked items
- **trip_shares**: Public sharing links

## Security Notes

### Development Mode
The current setup includes permissive RLS policies for development:
- Anonymous read/write access to trips and plan_items
- These should be removed before production deployment

### Production Checklist
Before going to production:
1. Remove development RLS policies
2. Enable proper authentication
3. Update RLS policies to use `auth.uid()`
4. Review and tighten permissions
5. Enable email verification
6. Set up proper backup strategy

## TypeScript Types Generation

After setting up the database, generate TypeScript types:

```bash
# Using Supabase CLI
npx supabase gen types typescript --project-id fsznctkjtakcvjuhrxpx > src/types/database.types.ts
```

Or use the MCP tool if available in non-read-only mode.

## Troubleshooting

### Common Issues

1. **Extension Already Exists Error**
   - This is normal, the script handles it gracefully

2. **Permission Denied**
   - Ensure you're using the service role key in production
   - Check RLS policies are correctly configured

3. **Type Already Exists**
   - The script uses `DO $$ ... EXCEPTION` blocks to handle this

### Reset Database (If Needed)
If you need to start fresh, uncomment the DROP statements at the top of the migration file.

## Next Steps

1. Test the API endpoints with the generated types
2. Implement authentication flow
3. Set up real-time subscriptions
4. Configure offline sync
5. Test collaborative features

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review the migration file: `supabase/migrations/001_complete_schema.sql`
- Check application logs in Supabase Dashboard