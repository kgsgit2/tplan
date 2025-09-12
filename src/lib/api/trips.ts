/**
 * API helper functions for Trips
 */

import { supabase } from '@/lib/supabase/client'
import type { 
  Trip, 
  TripInsert, 
  TripUpdate,
  PlanItem,
  PlanItemInsert,
  PlanItemUpdate,
  CategoryType
} from '@/types/database.types'

/**
 * Trip CRUD Operations
 */

export async function createTrip(trip: TripInsert) {
  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getTrip(tripId: string) {
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
}

export async function getUserTrips(userId: string) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })

  if (error) throw error
  return data
}

export async function updateTrip(tripId: string, updates: TripUpdate) {
  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', tripId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTrip(tripId: string) {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId)

  if (error) throw error
}

/**
 * Plan Item CRUD Operations
 */

export async function createPlanItem(planItem: PlanItemInsert) {
  const { data, error } = await supabase
    .from('plan_items')
    .insert(planItem)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getPlanItems(tripId: string, dayNumber?: number) {
  let query = supabase
    .from('plan_items')
    .select('*')
    .eq('trip_id', tripId)
    .order('day_number', { ascending: true })
    .order('start_time', { ascending: true })

  if (dayNumber !== undefined) {
    query = query.eq('day_number', dayNumber)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function updatePlanItem(itemId: string, updates: PlanItemUpdate) {
  const { data, error } = await supabase
    .from('plan_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePlanItem(itemId: string) {
  const { error } = await supabase
    .from('plan_items')
    .delete()
    .eq('id', itemId)

  if (error) throw error
}

export async function movePlanItem(
  itemId: string, 
  newDayNumber: number, 
  newStartTime?: string
) {
  const updates: PlanItemUpdate = {
    day_number: newDayNumber
  }

  if (newStartTime) {
    updates.start_time = newStartTime
  }

  return updatePlanItem(itemId, updates)
}

/**
 * Bulk Operations
 */

export async function bulkCreatePlanItems(planItems: PlanItemInsert[]) {
  const { data, error } = await supabase
    .from('plan_items')
    .insert(planItems)
    .select()

  if (error) throw error
  return data
}

export async function bulkUpdatePlanItems(
  updates: Array<{ id: string; updates: PlanItemUpdate }>
) {
  const promises = updates.map(({ id, updates }) => 
    updatePlanItem(id, updates)
  )

  return Promise.all(promises)
}

/**
 * Search and Filter Operations
 */

export async function searchTrips(searchTerm: string, userId?: string) {
  let query = supabase
    .from('trips')
    .select('*')
    .or(`title.ilike.%${searchTerm}%,destination.ilike.%${searchTerm}%`)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getTripsByDateRange(
  startDate: string,
  endDate: string,
  userId?: string
) {
  let query = supabase
    .from('trips')
    .select('*')
    .gte('start_date', startDate)
    .lte('end_date', endDate)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getPlanItemsByCategory(
  tripId: string,
  category: CategoryType
) {
  const { data, error } = await supabase
    .from('plan_items')
    .select('*')
    .eq('trip_id', tripId)
    .eq('category', category)
    .order('day_number', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Statistics and Aggregations
 */

export async function getTripStatistics(tripId: string) {
  const { data, error } = await supabase
    .rpc('get_trip_stats', { trip_uuid: tripId })

  if (error) throw error
  return data
}

export async function getTripBudget(tripId: string) {
  const { data, error } = await supabase
    .from('plan_items')
    .select('cost, transport_cost')
    .eq('trip_id', tripId)

  if (error) throw error

  const totalCost = data.reduce((sum, item) => {
    return sum + (item.cost || 0) + (item.transport_cost || 0)
  }, 0)

  return totalCost
}

/**
 * Real-time Subscriptions
 */

export function subscribeToPlanItems(
  tripId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`plan_items:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'plan_items',
        filter: `trip_id=eq.${tripId}`
      },
      callback
    )
    .subscribe()
}

export function subscribeToTrip(
  tripId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`trip:${tripId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `id=eq.${tripId}`
      },
      callback
    )
    .subscribe()
}

/**
 * Collaboration Features
 */

export async function shareTrip(
  tripId: string,
  email: string,
  role: 'viewer' | 'editor' = 'viewer'
) {
  // This would typically involve:
  // 1. Looking up user by email
  // 2. Creating a trip_collaborator entry
  // 3. Sending an invitation email
  
  // Placeholder implementation
  const { data, error } = await supabase
    .from('trip_collaborators')
    .insert({
      trip_id: tripId,
      user_id: 'placeholder-user-id', // Would need to look up actual user
      role: role
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function generateShareLink(tripId: string) {
  const { data, error } = await supabase
    .rpc('generate_share_code')

  if (error) throw error

  const { data: shareData, error: shareError } = await supabase
    .from('trip_shares')
    .insert({
      trip_id: tripId,
      share_code: data,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    })
    .select()
    .single()

  if (shareError) throw shareError
  return shareData
}