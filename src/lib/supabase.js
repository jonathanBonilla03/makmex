import { createClient } from '@supabase/supabase-js'

// These should be stored in environment variables in a production app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Test the Supabase connection
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function testConnection() {
  try {
    // Test connection by querying one of your actual tables
    const { data, error } = await supabase.from('brands').select('id').limit(1)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: 'Connection successful! Database is accessible.' }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get basic info about the Supabase instance
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getSupabaseInfo() {
  try {
    // Test auth connection
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    return {
      success: true,
      data: {
        url: supabaseUrl,
        hasValidKey: !!supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE',
        authConnected: !authError,
        timestamp: new Date().toISOString()
      }
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}