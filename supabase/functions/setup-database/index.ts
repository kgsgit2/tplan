
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Execute raw SQL using service role key
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        -- Create plan_boxes table
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
        CREATE POLICY "Allow all operations for development" 
        ON public.plan_boxes 
        FOR ALL 
        USING (true) 
        WITH CHECK (true);
      `
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, message: 'Database setup completed!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
