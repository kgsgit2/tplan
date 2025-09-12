/**
 * Offline-First Sync Management
 * Handles data synchronization between local storage and Supabase
 */

import { supabase } from '@/lib/supabase/client'
import type { 
  SyncQueue, 
  SyncQueueInsert,
  PlanItem,
  Trip
} from '@/types/database.types'

// IndexedDB setup for offline storage
const DB_NAME = 'tplan_offline'
const DB_VERSION = 1

interface OfflineDB extends IDBDatabase {
  objectStoreNames: DOMStringList
}

/**
 * Initialize IndexedDB for offline storage
 */
export async function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('trips')) {
        const tripStore = db.createObjectStore('trips', { keyPath: 'id' })
        tripStore.createIndex('user_id', 'user_id', { unique: false })
        tripStore.createIndex('sync_status', 'sync_status', { unique: false })
      }

      if (!db.objectStoreNames.contains('plan_items')) {
        const itemStore = db.createObjectStore('plan_items', { keyPath: 'id' })
        itemStore.createIndex('trip_id', 'trip_id', { unique: false })
        itemStore.createIndex('sync_status', 'sync_status', { unique: false })
      }

      if (!db.objectStoreNames.contains('sync_queue')) {
        const syncStore = db.createObjectStore('sync_queue', { 
          keyPath: 'id', 
          autoIncrement: true 
        })
        syncStore.createIndex('entity_type', 'entity_type', { unique: false })
        syncStore.createIndex('synced', 'synced', { unique: false })
      }
    }
  })
}

/**
 * Save data to IndexedDB for offline access
 */
export async function saveOffline(
  storeName: 'trips' | 'plan_items',
  data: any
): Promise<void> {
  const db = await initOfflineDB()
  const transaction = db.transaction([storeName], 'readwrite')
  const store = transaction.objectStore(storeName)
  
  // Add sync_status field
  const offlineData = {
    ...data,
    sync_status: 'synced',
    last_modified: new Date().toISOString()
  }
  
  store.put(offlineData)

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/**
 * Get data from IndexedDB
 */
export async function getOffline(
  storeName: 'trips' | 'plan_items',
  id: string
): Promise<any> {
  const db = await initOfflineDB()
  const transaction = db.transaction([storeName], 'readonly')
  const store = transaction.objectStore(storeName)
  const request = store.get(id)

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all data from IndexedDB
 */
export async function getAllOffline(
  storeName: 'trips' | 'plan_items',
  indexName?: string,
  indexValue?: any
): Promise<any[]> {
  const db = await initOfflineDB()
  const transaction = db.transaction([storeName], 'readonly')
  const store = transaction.objectStore(storeName)
  
  let request: IDBRequest
  if (indexName && indexValue !== undefined) {
    const index = store.index(indexName)
    request = index.getAll(indexValue)
  } else {
    request = store.getAll()
  }

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Queue an operation for sync
 */
export async function queueForSync(
  operation: 'create' | 'update' | 'delete',
  entityType: 'trip' | 'plan_item',
  entityId: string,
  data: any
): Promise<void> {
  const db = await initOfflineDB()
  const transaction = db.transaction(['sync_queue'], 'readwrite')
  const store = transaction.objectStore('sync_queue')
  
  const queueItem = {
    operation,
    entity_type: entityType,
    entity_id: entityId,
    data,
    synced: false,
    created_at: new Date().toISOString()
  }
  
  store.add(queueItem)

  // Also update the entity's sync_status
  const entityStore = entityType === 'trip' ? 'trips' : 'plan_items'
  const entityTransaction = db.transaction([entityStore], 'readwrite')
  const entityObjectStore = entityTransaction.objectStore(entityStore)
  
  const existingData = await getOffline(entityStore, entityId)
  if (existingData) {
    entityObjectStore.put({
      ...existingData,
      ...data,
      sync_status: 'pending'
    })
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/**
 * Process sync queue
 */
export async function processSyncQueue(): Promise<void> {
  const db = await initOfflineDB()
  const transaction = db.transaction(['sync_queue'], 'readonly')
  const store = transaction.objectStore('sync_queue')
  const index = store.index('synced')
  const request = index.getAll(false)

  const queueItems = await new Promise<any[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  for (const item of queueItems) {
    try {
      await syncItem(item)
      await markAsSynced(item.id)
    } catch (error) {
      console.error('Sync failed for item:', item, error)
      // Continue with next item
    }
  }
}

/**
 * Sync a single item from the queue
 */
async function syncItem(item: any): Promise<void> {
  const { operation, entity_type, entity_id, data } = item

  if (entity_type === 'trip') {
    switch (operation) {
      case 'create':
        await supabase.from('trips').insert(data)
        break
      case 'update':
        await supabase.from('trips').update(data).eq('id', entity_id)
        break
      case 'delete':
        await supabase.from('trips').delete().eq('id', entity_id)
        break
    }
  } else if (entity_type === 'plan_item') {
    switch (operation) {
      case 'create':
        await supabase.from('plan_items').insert(data)
        break
      case 'update':
        await supabase.from('plan_items').update(data).eq('id', entity_id)
        break
      case 'delete':
        await supabase.from('plan_items').delete().eq('id', entity_id)
        break
    }
  }
}

/**
 * Mark a sync queue item as synced
 */
async function markAsSynced(queueId: number): Promise<void> {
  const db = await initOfflineDB()
  const transaction = db.transaction(['sync_queue'], 'readwrite')
  const store = transaction.objectStore('sync_queue')
  
  const request = store.get(queueId)
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const item = request.result
      if (item) {
        item.synced = true
        item.synced_at = new Date().toISOString()
        store.put(item)
      }
    }
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

/**
 * Clean up synced items from queue
 */
export async function cleanupSyncQueue(): Promise<void> {
  const db = await initOfflineDB()
  const transaction = db.transaction(['sync_queue'], 'readwrite')
  const store = transaction.objectStore('sync_queue')
  const index = store.index('synced')
  const request = index.openCursor(true)

  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      }
    }
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => resolve()
  })
}

/**
 * Check online status and sync if needed
 */
export function setupAutoSync(): void {
  // Initial sync if online
  if (navigator.onLine) {
    processSyncQueue()
  }

  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('Back online - syncing data...')
    processSyncQueue()
  })

  window.addEventListener('offline', () => {
    console.log('Gone offline - data will be synced when connection returns')
  })

  // Periodic sync every 30 seconds when online
  setInterval(() => {
    if (navigator.onLine) {
      processSyncQueue()
    }
  }, 30000)
}

/**
 * Conflict resolution strategies
 */
export interface ConflictResolution {
  strategy: 'local_wins' | 'remote_wins' | 'merge' | 'manual'
  resolver?: (local: any, remote: any) => any
}

/**
 * Resolve conflicts between local and remote data
 */
export async function resolveConflicts(
  entityType: 'trip' | 'plan_item',
  entityId: string,
  resolution: ConflictResolution
): Promise<any> {
  // Get local data
  const storeName = entityType === 'trip' ? 'trips' : 'plan_items'
  const localData = await getOffline(storeName, entityId)

  // Get remote data
  const table = entityType === 'trip' ? 'trips' : 'plan_items'
  const { data: remoteData, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', entityId)
    .single()

  if (error) throw error

  let resolvedData: any

  switch (resolution.strategy) {
    case 'local_wins':
      resolvedData = localData
      break
    case 'remote_wins':
      resolvedData = remoteData
      break
    case 'merge':
      // Simple merge - remote data with local modifications
      resolvedData = {
        ...remoteData,
        ...localData,
        updated_at: new Date().toISOString()
      }
      break
    case 'manual':
      if (resolution.resolver) {
        resolvedData = resolution.resolver(localData, remoteData)
      } else {
        throw new Error('Manual resolution requires a resolver function')
      }
      break
  }

  // Save resolved data
  await saveOffline(storeName, resolvedData)
  
  // Update remote
  const { data: updatedData, error: updateError } = await supabase
    .from(table)
    .update(resolvedData)
    .eq('id', entityId)
    .select()
    .single()

  if (updateError) throw updateError

  return updatedData
}

/**
 * Full sync - download all user data for offline use
 */
export async function fullSync(userId: string): Promise<void> {
  try {
    // Sync trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)

    if (tripsError) throw tripsError

    for (const trip of trips || []) {
      await saveOffline('trips', trip)
      
      // Sync plan items for each trip
      const { data: items, error: itemsError } = await supabase
        .from('plan_items')
        .select('*')
        .eq('trip_id', trip.id)

      if (itemsError) throw itemsError

      for (const item of items || []) {
        await saveOffline('plan_items', item)
      }
    }

    console.log('Full sync completed successfully')
  } catch (error) {
    console.error('Full sync failed:', error)
    throw error
  }
}

/**
 * Export data for backup
 */
export async function exportData(): Promise<string> {
  const trips = await getAllOffline('trips')
  const planItems = await getAllOffline('plan_items')
  
  const exportData = {
    version: DB_VERSION,
    exported_at: new Date().toISOString(),
    trips,
    plan_items: planItems
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Import data from backup
 */
export async function importData(jsonData: string): Promise<void> {
  const data = JSON.parse(jsonData)
  
  // Import trips
  for (const trip of data.trips || []) {
    await saveOffline('trips', trip)
  }
  
  // Import plan items
  for (const item of data.plan_items || []) {
    await saveOffline('plan_items', item)
  }
  
  console.log('Data imported successfully')
}