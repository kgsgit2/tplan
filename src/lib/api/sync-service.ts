import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Sync Service
 * Handles offline sync and real-time collaboration
 */

export const syncService = {
  channels: new Map<string, RealtimeChannel>(),

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(data: {
    entity_type: string
    entity_id: string
    operation: 'create' | 'update' | 'delete'
    payload: any
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('sync_queue')
      .insert({
        user_id: user.id,
        ...data,
      })
    
    if (error) throw error
  },

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: queue, error } = await supabase
      .from('sync_queue')
      .select('*')
      .eq('user_id', user.id)
      .is('synced_at', null)
      .order('created_at')
    
    if (error) throw error
    if (!queue || queue.length === 0) return

    const results = []
    
    for (const item of queue) {
      try {
        // Process each sync item based on entity type and operation
        await this.processSyncItem(item)
        
        // Mark as synced
        await supabase
          .from('sync_queue')
          .update({ synced_at: new Date().toISOString() })
          .eq('id', item.id)
        
        results.push({ id: item.id, success: true })
      } catch (error) {
        results.push({ id: item.id, success: false, error })
      }
    }
    
    return results
  },

  /**
   * Process individual sync item
   */
  async processSyncItem(item: any) {
    const { entity_type, entity_id, operation, payload } = item
    
    switch (entity_type) {
      case 'trip':
        if (operation === 'create') {
          await supabase.from('trips').insert(payload)
        } else if (operation === 'update') {
          await supabase.from('trips').update(payload).eq('id', entity_id)
        } else if (operation === 'delete') {
          await supabase.from('trips').delete().eq('id', entity_id)
        }
        break
      
      case 'plan_item':
        if (operation === 'create') {
          await supabase.from('plan_items').insert(payload)
        } else if (operation === 'update') {
          await supabase.from('plan_items').update(payload).eq('id', entity_id)
        } else if (operation === 'delete') {
          await supabase.from('plan_items').delete().eq('id', entity_id)
        }
        break
      
      default:
        throw new Error(`Unknown entity type: ${entity_type}`)
    }
  },

  /**
   * Subscribe to real-time changes for a trip
   */
  subscribeToTrip(tripId: string, callbacks: {
    onPlanItemChange?: (payload: any) => void
    onCollaboratorChange?: (payload: any) => void
    onTripChange?: (payload: any) => void
  }) {
    // Clean up existing subscription if any
    this.unsubscribeFromTrip(tripId)
    
    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plan_items',
          filter: `trip_id=eq.${tripId}`,
        },
        callbacks.onPlanItemChange || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_collaborators',
          filter: `trip_id=eq.${tripId}`,
        },
        callbacks.onCollaboratorChange || (() => {})
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `id=eq.${tripId}`,
        },
        callbacks.onTripChange || (() => {})
      )
      .subscribe()
    
    this.channels.set(tripId, channel)
    return channel
  },

  /**
   * Unsubscribe from trip real-time changes
   */
  unsubscribeFromTrip(tripId: string) {
    const channel = this.channels.get(tripId)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(tripId)
    }
  },

  /**
   * Subscribe to presence for collaboration
   */
  subscribeToPresence(tripId: string, userData: any) {
    const channel = supabase.channel(`presence:${tripId}`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        console.log('Presence sync:', state)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(userData)
        }
      })
    
    return channel
  },

  /**
   * Log activity
   */
  async logActivity(data: {
    trip_id?: string
    action: string
    entity_type?: string
    entity_id?: string
    changes?: any
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        ...data,
        user_id: user?.id,
      })
    
    if (error) throw error
  },

  /**
   * Get activity logs
   */
  async getActivityLogs(tripId?: string, limit: number = 50) {
    let query = supabase
      .from('activity_logs')
      .select(`
        *,
        user:user_profiles(display_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (tripId) {
      query = query.eq('trip_id', tripId)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  /**
   * Clear old sync queue items
   */
  async clearOldSyncItems(daysOld: number = 7) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    
    const { error } = await supabase
      .from('sync_queue')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .not('synced_at', 'is', null)
    
    if (error) throw error
  },

  /**
   * Handle conflict resolution
   */
  async resolveConflict(syncItemId: string, resolution: 'local' | 'remote' | 'merge', mergeData?: any) {
    const update: any = {
      conflict_resolution: {
        strategy: resolution,
        resolved_at: new Date().toISOString(),
      },
    }
    
    if (resolution === 'merge' && mergeData) {
      update.payload = mergeData
    }
    
    const { error } = await supabase
      .from('sync_queue')
      .update(update)
      .eq('id', syncItemId)
    
    if (error) throw error
  },
}