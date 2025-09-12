import { supabase } from '@/lib/supabase'
import type { 
  Trip, 
  TripInsert, 
  TripUpdate,
  PlanItem,
  PlanItemInsert,
  PlanItemUpdate,
  TripCollaborator,
  TripShare,
  Database
} from '@/types/database.types'

/**
 * Extended Trips API Service
 * Comprehensive trip management functionality
 */

export const tripsApiExtended = {
  /**
   * Create a new trip
   */
  async createTrip(trip: Omit<TripInsert, 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('trips')
      .insert({
        ...trip,
        user_id: user.id,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get all trips for current user
   */
  async getUserTrips(filters?: {
    archived?: boolean
    template?: boolean
    search?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id)
    
    if (filters?.archived !== undefined) {
      query = query.eq('is_archived', filters.archived)
    }
    
    if (filters?.template !== undefined) {
      query = query.eq('is_template', filters.template)
    }
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,destination.ilike.%${filters.search}%`)
    }
    
    query = query.order('start_date', { ascending: false })
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Get single trip by ID
   */
  async getTrip(tripId: string) {
    const { data, error } = await supabase
      .from('trips')
      .select(`
        *,
        plan_items (*)
      `)
      .eq('id', tripId)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update trip
   */
  async updateTrip(tripId: string, updates: TripUpdate) {
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', tripId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Delete trip
   */
  async deleteTrip(tripId: string) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId)
    
    if (error) throw error
  },

  /**
   * Archive/Unarchive trip
   */
  async archiveTrip(tripId: string, archived: boolean = true) {
    return this.updateTrip(tripId, { is_archived: archived })
  },

  /**
   * Duplicate trip as template
   */
  async duplicateAsTemplate(tripId: string) {
    const trip = await this.getTrip(tripId)
    if (!trip) throw new Error('Trip not found')

    const { id, created_at, updated_at, ...tripData } = trip
    
    return this.createTrip({
      ...tripData,
      title: `${trip.title} (Copy)`,
      is_template: true,
    })
  },

  /**
   * Get trip statistics
   */
  async getTripStats(tripId: string) {
    const { data, error } = await supabase
      .rpc('get_trip_stats', { trip_uuid: tripId })
    
    if (error) throw error
    return data
  },

  /**
   * Create plan item
   */
  async createPlanItem(item: Omit<PlanItemInsert, 'created_by'>) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        ...item,
        created_by: user?.id,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update plan item
   */
  async updatePlanItem(itemId: string, updates: PlanItemUpdate) {
    const { data, error } = await supabase
      .from('plan_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Delete plan item
   */
  async deletePlanItem(itemId: string) {
    const { error } = await supabase
      .from('plan_items')
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
  },

  /**
   * Get plan items for a trip
   */
  async getPlanItems(tripId: string, dayNumber?: number) {
    let query = supabase
      .from('plan_items')
      .select('*')
      .eq('trip_id', tripId)
    
    if (dayNumber !== undefined) {
      query = query.eq('day_number', dayNumber)
    }
    
    query = query.order('day_number').order('start_time')
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Bulk update plan items positions
   */
  async updatePlanItemsPositions(updates: Array<{ id: string; position_x: number; position_y: number }>) {
    const promises = updates.map(({ id, position_x, position_y }) =>
      supabase
        .from('plan_items')
        .update({ position_x, position_y })
        .eq('id', id)
    )
    
    const results = await Promise.all(promises)
    const errors = results.filter(r => r.error)
    
    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} items`)
    }
  },

  /**
   * Share trip
   */
  async shareTrip(tripId: string, permissions?: any) {
    const { data: shareCode } = await supabase
      .rpc('generate_share_code')
    
    const { data, error } = await supabase
      .from('trip_shares')
      .insert({
        trip_id: tripId,
        share_code: shareCode,
        permissions: permissions || { canView: true, canEdit: false },
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Get trip by share code
   */
  async getTripByShareCode(shareCode: string) {
    const { data: share, error: shareError } = await supabase
      .from('trip_shares')
      .select('*, trips(*)')
      .eq('share_code', shareCode)
      .single()
    
    if (shareError) throw shareError
    
    // Increment view count
    await supabase
      .from('trip_shares')
      .update({ view_count: (share.view_count || 0) + 1 })
      .eq('id', share.id)
    
    return share
  },

  /**
   * Invite collaborator
   */
  async inviteCollaborator(tripId: string, email: string, role: 'viewer' | 'editor' = 'viewer') {
    const { data, error } = await supabase
      .rpc('invite_to_trip', {
        p_trip_id: tripId,
        p_user_email: email,
        p_role: role,
      })
    
    if (error) throw error
    return data
  },

  /**
   * Accept invitation
   */
  async acceptInvitation(tripId: string) {
    const { data, error } = await supabase
      .rpc('accept_trip_invitation', { p_trip_id: tripId })
    
    if (error) throw error
    return data
  },

  /**
   * Get collaborators
   */
  async getCollaborators(tripId: string) {
    const { data, error } = await supabase
      .from('trip_collaborators')
      .select(`
        *,
        user:user_profiles(*)
      `)
      .eq('trip_id', tripId)
    
    if (error) throw error
    return data
  },

  /**
   * Remove collaborator
   */
  async removeCollaborator(tripId: string, userId: string) {
    const { error } = await supabase
      .from('trip_collaborators')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId)
    
    if (error) throw error
  },
}