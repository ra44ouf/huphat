import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Singleton instance for client-side to prevent multiple connections and infinite loops
let supabaseInstance: any = null;

export function createClient() {
  if (typeof window === 'undefined') {
    // Server-side: return a new client for each request
    return createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }

  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'shubuhat-pwa-auth', // Custom key to ensure fresh storage
      }
    })
  }

  return supabaseInstance
}
