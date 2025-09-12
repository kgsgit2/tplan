import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Database Types (to be expanded as needed)
export interface PlanBox {
  id: string
  title: string
  category: string
  startHour?: number
  startMinute?: number
  durationHour: number
  durationMinute: number
  hasTimeSet?: boolean
  memo?: string
  location?: string
  address?: string
  phone?: string
  cost?: number
  transportMode?: string
  created_at?: string
  updated_at?: string
}

// Database helper functions
export const dbHelpers = {
  // Get all plan boxes
  async getPlanBoxes() {
    const { data, error } = await supabase
      .from('plan_boxes')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Save a plan box
  async savePlanBox(planBox: Omit<PlanBox, 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('plan_boxes')
      .upsert(planBox)
      .select()
    
    if (error) throw error
    return data?.[0]
  },

  // Delete a plan box
  async deletePlanBox(id: string) {
    const { error } = await supabase
      .from('plan_boxes')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Test connection
  async testConnection() {
    try {
      // First test basic connection
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        return { success: false, message: `Auth error: ${authError.message}` }
      }

      // Test if we can access any table (try a simple query)
      const { data, error } = await supabase
        .from('plan_boxes')
        .select('count(*)')
        .limit(1)
      
      if (error) {
        // If table doesn't exist, that's a specific error we can handle
        if (error.code === 'PGRST116' || error.message.includes('relation "plan_boxes" does not exist')) {
          return { 
            success: false, 
            message: 'Connection OK, but plan_boxes table does not exist. Need to create it.',
            needsTable: true
          }
        }
        return { success: false, message: `Database error: ${error.message}`, details: error }
      }
      
      return { success: true, message: 'Supabase connection and table access successful' }
    } catch (error: any) {
      return { success: false, message: `Connection failed: ${error?.message || error}`, details: error }
    }
  },

  // Create the plan_boxes table
  async createPlanBoxesTable() {
    try {
      const { error } = await supabase.rpc('create_plan_boxes_table')
      
      if (error) throw error
      return { success: true, message: 'plan_boxes table created successfully' }
    } catch (error: any) {
      // If RPC doesn't exist, we need to create the table via SQL
      return { 
        success: false, 
        message: `Could not create table via RPC. Manual SQL needed: ${error?.message || error}`,
        sqlNeeded: true
      }
    }
  }
}