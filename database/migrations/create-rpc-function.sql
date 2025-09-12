
-- Create RPC function to set up the database
CREATE OR REPLACE FUNCTION create_plan_boxes_table()
RETURNS void AS $$
BEGIN
  -- Create table if not exists
  CREATE TABLE IF NOT EXISTS public.plan_boxes (
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

  -- Enable RLS
  ALTER TABLE public.plan_boxes ENABLE ROW LEVEL SECURITY;
  
  -- Create policy
  CREATE POLICY IF NOT EXISTS "Allow all operations for development" 
  ON public.plan_boxes 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

  -- Grant permissions
  GRANT ALL ON public.plan_boxes TO anon, authenticated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT create_plan_boxes_table();
