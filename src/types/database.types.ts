/**
 * Database types for TPlan Travel Planning Application
 * Generated based on the database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          preferences: Json
          language: string
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferences?: Json
          language?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferences?: Json
          language?: string
          timezone?: string
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: CategoryType
          icon: string | null
          color: string | null
          display_order: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: CategoryType
          icon?: string | null
          color?: string | null
          display_order?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: CategoryType
          icon?: string | null
          color?: string | null
          display_order?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          category: CategoryType | null
          address: string | null
          latitude: number
          longitude: number
          place_id: string | null
          phone: string | null
          website: string | null
          hours: Json | null
          rating: number | null
          price_level: number | null
          tags: string[] | null
          metadata: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: CategoryType | null
          address?: string | null
          latitude: number
          longitude: number
          place_id?: string | null
          phone?: string | null
          website?: string | null
          hours?: Json | null
          rating?: number | null
          price_level?: number | null
          tags?: string[] | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: CategoryType | null
          address?: string | null
          latitude?: number
          longitude?: number
          place_id?: string | null
          phone?: string | null
          website?: string | null
          hours?: Json | null
          rating?: number | null
          price_level?: number | null
          tags?: string[] | null
          metadata?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trips: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_date: string
          end_date: string
          destination: string
          country_code: string | null
          is_domestic: boolean
          visibility: TripVisibility
          cover_image_url: string | null
          total_budget: number | null
          currency: string
          settings: Json
          tags: string[] | null
          is_template: boolean
          is_archived: boolean
          version: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_date: string
          end_date: string
          destination: string
          country_code?: string | null
          is_domestic?: boolean
          visibility?: TripVisibility
          cover_image_url?: string | null
          total_budget?: number | null
          currency?: string
          settings?: Json
          tags?: string[] | null
          is_template?: boolean
          is_archived?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_date?: string
          end_date?: string
          destination?: string
          country_code?: string | null
          is_domestic?: boolean
          visibility?: TripVisibility
          cover_image_url?: string | null
          total_budget?: number | null
          currency?: string
          settings?: Json
          tags?: string[] | null
          is_template?: boolean
          is_archived?: boolean
          version?: number
          created_at?: string
          updated_at?: string
        }
      }
      plan_items: {
        Row: {
          id: string
          trip_id: string
          day_number: number
          start_time: string | null
          end_time: string | null
          category: CategoryType
          title: string
          description: string | null
          location_id: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          cost: number | null
          currency: string | null
          transport_mode: TransportMode | null
          transport_duration: number | null
          transport_cost: number | null
          booking_url: string | null
          booking_reference: string | null
          notes: string | null
          attachments: Json
          position_x: number | null
          position_y: number | null
          color: string | null
          is_confirmed: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          day_number: number
          start_time?: string | null
          end_time?: string | null
          category: CategoryType
          title: string
          description?: string | null
          location_id?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          cost?: number | null
          currency?: string | null
          transport_mode?: TransportMode | null
          transport_duration?: number | null
          transport_cost?: number | null
          booking_url?: string | null
          booking_reference?: string | null
          notes?: string | null
          attachments?: Json
          position_x?: number | null
          position_y?: number | null
          color?: string | null
          is_confirmed?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          day_number?: number
          start_time?: string | null
          end_time?: string | null
          category?: CategoryType
          title?: string
          description?: string | null
          location_id?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          cost?: number | null
          currency?: string | null
          transport_mode?: TransportMode | null
          transport_duration?: number | null
          transport_cost?: number | null
          booking_url?: string | null
          booking_reference?: string | null
          notes?: string | null
          attachments?: Json
          position_x?: number | null
          position_y?: number | null
          color?: string | null
          is_confirmed?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trip_collaborators: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          role: CollaborationRole
          permissions: Json
          invited_by: string | null
          invited_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          role?: CollaborationRole
          permissions?: Json
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          role?: CollaborationRole
          permissions?: Json
          invited_by?: string | null
          invited_at?: string
          accepted_at?: string | null
        }
      }
      sync_queue: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          operation: string
          payload: Json
          conflict_resolution: Json | null
          synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          operation: string
          payload: Json
          conflict_resolution?: Json | null
          synced_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          operation?: string
          payload?: Json
          conflict_resolution?: Json | null
          synced_at?: string | null
          created_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          trip_id: string | null
          user_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          changes: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id?: string | null
          user_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string | null
          user_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          changes?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      collaboration_sessions: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          cursor_position: Json | null
          selected_items: string[] | null
          is_active: boolean
          last_heartbeat: string
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          cursor_position?: Json | null
          selected_items?: string[] | null
          is_active?: boolean
          last_heartbeat?: string
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          cursor_position?: Json | null
          selected_items?: string[] | null
          is_active?: boolean
          last_heartbeat?: string
          started_at?: string
          ended_at?: string | null
        }
      }
      trip_templates: {
        Row: {
          id: string
          created_by: string | null
          title: string
          description: string | null
          destination: string | null
          duration_days: number | null
          category: string | null
          tags: string[] | null
          template_data: Json
          usage_count: number
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by?: string | null
          title: string
          description?: string | null
          destination?: string | null
          duration_days?: number | null
          category?: string | null
          tags?: string[] | null
          template_data: Json
          usage_count?: number
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string | null
          title?: string
          description?: string | null
          destination?: string | null
          duration_days?: number | null
          category?: string | null
          tags?: string[] | null
          template_data?: Json
          usage_count?: number
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          entity_type: string
          entity_id: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          entity_type: string
          entity_id: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          entity_type?: string
          entity_id?: string
          notes?: string | null
          created_at?: string
        }
      }
      trip_shares: {
        Row: {
          id: string
          trip_id: string
          share_code: string
          created_by: string | null
          password_hash: string | null
          permissions: Json
          expires_at: string | null
          view_count: number
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          share_code: string
          created_by?: string | null
          password_hash?: string | null
          permissions?: Json
          expires_at?: string | null
          view_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          share_code?: string
          created_by?: string | null
          password_hash?: string | null
          permissions?: Json
          expires_at?: string | null
          view_count?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_trip_stats: {
        Args: {
          trip_uuid: string
        }
        Returns: Json
      }
      generate_share_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      category_type: 'food' | 'transport' | 'activity' | 'sightseeing' | 'shopping' | 'accommodation' | 'other'
      transport_mode: 'walk' | 'car' | 'bus' | 'subway' | 'train' | 'flight' | 'taxi' | 'bicycle' | 'other'
      trip_visibility: 'private' | 'shared' | 'public'
      collaboration_role: 'owner' | 'editor' | 'viewer'
    }
  }
}

// Export enum types for easier use
export type CategoryType = Database['public']['Enums']['category_type']
export type TransportMode = Database['public']['Enums']['transport_mode']
export type TripVisibility = Database['public']['Enums']['trip_visibility']
export type CollaborationRole = Database['public']['Enums']['collaboration_role']

// Export table types for easier use
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type Trip = Database['public']['Tables']['trips']['Row']
export type PlanItem = Database['public']['Tables']['plan_items']['Row']
export type TripCollaborator = Database['public']['Tables']['trip_collaborators']['Row']
export type SyncQueue = Database['public']['Tables']['sync_queue']['Row']
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row']
export type CollaborationSession = Database['public']['Tables']['collaboration_sessions']['Row']
export type TripTemplate = Database['public']['Tables']['trip_templates']['Row']
export type UserFavorite = Database['public']['Tables']['user_favorites']['Row']
export type TripShare = Database['public']['Tables']['trip_shares']['Row']

// Insert types
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type LocationInsert = Database['public']['Tables']['locations']['Insert']
export type TripInsert = Database['public']['Tables']['trips']['Insert']
export type PlanItemInsert = Database['public']['Tables']['plan_items']['Insert']
export type TripCollaboratorInsert = Database['public']['Tables']['trip_collaborators']['Insert']
export type SyncQueueInsert = Database['public']['Tables']['sync_queue']['Insert']
export type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']
export type CollaborationSessionInsert = Database['public']['Tables']['collaboration_sessions']['Insert']
export type TripTemplateInsert = Database['public']['Tables']['trip_templates']['Insert']
export type UserFavoriteInsert = Database['public']['Tables']['user_favorites']['Insert']
export type TripShareInsert = Database['public']['Tables']['trip_shares']['Insert']

// Update types
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type LocationUpdate = Database['public']['Tables']['locations']['Update']
export type TripUpdate = Database['public']['Tables']['trips']['Update']
export type PlanItemUpdate = Database['public']['Tables']['plan_items']['Update']
export type TripCollaboratorUpdate = Database['public']['Tables']['trip_collaborators']['Update']
export type SyncQueueUpdate = Database['public']['Tables']['sync_queue']['Update']
export type ActivityLogUpdate = Database['public']['Tables']['activity_logs']['Update']
export type CollaborationSessionUpdate = Database['public']['Tables']['collaboration_sessions']['Update']
export type TripTemplateUpdate = Database['public']['Tables']['trip_templates']['Update']
export type UserFavoriteUpdate = Database['public']['Tables']['user_favorites']['Update']
export type TripShareUpdate = Database['public']['Tables']['trip_shares']['Update']