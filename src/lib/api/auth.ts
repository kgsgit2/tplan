import { supabase } from '@/lib/supabase'

/**
 * Authentication Service
 * Handles user authentication, session management, and OAuth flows
 */

export const authService = {
  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string, metadata?: { display_name?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    
    if (error) throw error
    return data
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    return data
  },

  /**
   * Sign in with OAuth provider (Google, Kakao, etc.)
   */
  async signInWithOAuth(provider: 'google' | 'kakao') {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) throw error
    return data
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get the current user session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  /**
   * Get the current user
   */
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  /**
   * Update user metadata
   */
  async updateUser(updates: { email?: string; password?: string; data?: object }) {
    const { data, error } = await supabase.auth.updateUser(updates)
    if (error) throw error
    return data
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    
    if (error) throw error
    return data
  },

  /**
   * Update password with reset token
   */
  async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (error) throw error
    return data
  },

  /**
   * Refresh the current session
   */
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return data.session
  },

  /**
   * Set up auth state change listener
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    const session = await this.getSession()
    return !!session
  },

  /**
   * Get user profile from user_profiles table
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Create user profile (called automatically via trigger)
   */
  async createUserProfile(userId: string, profile: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        ...profile,
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Check username availability
   */
  async checkUsernameAvailable(username: string) {
    const { data, error } = await supabase
      .rpc('validate_username', { username })
    
    if (error) throw error
    return data
  },
}