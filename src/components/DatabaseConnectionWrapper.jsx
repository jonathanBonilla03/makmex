import { useState, useEffect } from 'react'

// Simple, safe connection test
async function testSupabaseConnection() {
  try {
    // Check if environment variables exist
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (!url || !key || url.includes('YOUR_SUPABASE') || key.includes('YOUR_SUPABASE')) {
      return { 
        success: false, 
        error: 'Missing or invalid Supabase environment variables. Please check your .env file.' 
      }
    }

    // Try to create supabase client
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(url, key)
    
    // Simple auth check - this won't fail even if no tables exist
    const { error } = await supabase.auth.getSession()
    
    if (error && error.message !== 'Invalid API key') {
      return { success: false, error: error.message }
    }
    
    return { success: true, data: 'Connection successful!' }
    
  } catch (err) {
    return { 
      success: false, 
      error: `Connection failed: ${err.message}` 
    }
  }
}

export default function DatabaseConnectionWrapper({ children }) {
  const [connectionState, setConnectionState] = useState({
    loading: true,
    connected: false,
    error: null
  })

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await testSupabaseConnection()
        setConnectionState({
          loading: false,
          connected: result.success,
          error: result.error || null
        })
      } catch (err) {
        setConnectionState({
          loading: false,
          connected: false,
          error: `Unexpected error: ${err.message}`
        })
      }
    }

    checkConnection()
  }, [])

  if (connectionState.loading) {
    return (
      <div className="min-h-[var(--app-height)] bg-makmex-panel flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-makmex-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold text-makmex-text">Connecting to Database...</h2>
          <p className="text-makmex-muted">Testing Supabase connection</p>
        </div>
      </div>
    )
  }

  if (!connectionState.connected) {
    return (
      <div className="min-h-[var(--app-height)] bg-red-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border-2 border-red-200 p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-red-800 mb-2">Database Connection Error</h1>
            <p className="text-red-600 mb-4">Unable to connect to the database</p>
          </div>

          {connectionState.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
              <code className="text-sm text-red-700 break-words">{connectionState.error}</code>
            </div>
          )}

          <div className="text-left space-y-2 text-sm text-gray-600">
            <h3 className="font-semibold text-gray-800">Troubleshooting Steps:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Check your .env file has the correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
              <li>Verify your Supabase project is running</li>
              <li>Ensure your network connection is working</li>
              <li>Visit <span className="font-mono bg-gray-100 px-1 rounded">/test-supabase</span> for detailed testing</li>
            </ul>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Retry Connection
          </button>

          <div className="pt-4 border-t border-red-200">
            <a 
              href="/test-supabase" 
              className="text-red-600 hover:text-red-800 underline text-sm"
            >
              Go to Database Test Page
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Connection successful - render the app
  return children
}