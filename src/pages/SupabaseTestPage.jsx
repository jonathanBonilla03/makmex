import { useState, useEffect } from 'react'
import { testConnection, getSupabaseInfo, testTableAccess } from '../lib/supabase'

export default function SupabaseTestPage() {
  const [connectionStatus, setConnectionStatus] = useState({ loading: true })
  const [supabaseInfo, setSupabaseInfo] = useState({ loading: true })
  const [tableAccess, setTableAccess] = useState({ loading: true })

  useEffect(() => {
    // Test connection on component mount
    testConnection().then(setConnectionStatus)
    getSupabaseInfo().then(setSupabaseInfo)
    testTableAccess().then(setTableAccess)
  }, [])

  return (
    <div className="min-h-screen bg-makmex-panel p-6">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-makmex-text">
            Supabase Connection Test
          </h1>
          <p className="mt-2 text-makmex-muted">
            Test your Supabase database connection
          </p>
        </div>

        {/* Connection Status */}
        <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-6">
          <h2 className="mb-4 text-xl font-bold text-makmex-text">
            Connection Status
          </h2>
          
          {connectionStatus.loading ? (
            <div className="flex items-center gap-2 text-makmex-muted">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-makmex-orange border-t-transparent"></div>
              Testing connection...
            </div>
          ) : (
            <div className="space-y-2">
              <div className={`flex items-center gap-2 ${connectionStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`h-3 w-3 rounded-full ${connectionStatus.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {connectionStatus.success ? 'Connected Successfully!' : 'Connection Failed'}
              </div>
              {connectionStatus.error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  Error: {connectionStatus.error}
                </p>
              )}
              {connectionStatus.success && (
                <p className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  {connectionStatus.data}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Supabase Info */}
        <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-6">
          <h2 className="mb-4 text-xl font-bold text-makmex-text">
            Configuration Info
          </h2>
          
          {supabaseInfo.loading ? (
            <div className="flex items-center gap-2 text-makmex-muted">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-makmex-orange border-t-transparent"></div>
              Loading configuration info...
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              {supabaseInfo.success ? (
                <div className="space-y-3">
                  <div className="bg-makmex-panel p-3 rounded">
                    <strong>Supabase URL:</strong><br />
                    <code className="text-makmex-muted">{supabaseInfo.data.url}</code>
                  </div>
                  <div className={`p-3 rounded ${supabaseInfo.data.hasValidKey ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <strong>API Key Status:</strong>{' '}
                    <span className={supabaseInfo.data.hasValidKey ? 'text-green-600' : 'text-red-600'}>
                      {supabaseInfo.data.hasValidKey ? 'Valid ✓' : 'Invalid - Please check your environment variables'}
                    </span>
                  </div>
                  <div className={`p-3 rounded ${supabaseInfo.data.authConnected ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <strong>Authentication:</strong>{' '}
                    <span className={supabaseInfo.data.authConnected ? 'text-green-600' : 'text-yellow-600'}>
                      {supabaseInfo.data.authConnected ? 'Connected ✓' : 'Not authenticated (may be normal for public access)'}
                    </span>
                  </div>
                  <div className="text-xs text-makmex-muted">
                    <strong>Last Check:</strong> {new Date(supabaseInfo.data.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <p className="text-red-600 bg-red-50 p-3 rounded">
                  Error loading configuration: {supabaseInfo.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Table Access Test */}
        <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-6">
          <h2 className="mb-4 text-xl font-bold text-makmex-text">
            Database Table Access
          </h2>
          
          {tableAccess.loading ? (
            <div className="flex items-center gap-2 text-makmex-muted">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-makmex-orange border-t-transparent"></div>
              Testing table access...
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {tableAccess.success ? (
                <div className="space-y-2">
                  {Object.entries(tableAccess.data).map(([tableName, result]) => (
                    <div key={tableName} className={`p-3 rounded border ${
                      result.accessible 
                        ? result.hasData 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex justify-between items-center">
                        <strong className="capitalize">{tableName}:</strong>
                        <span className={`text-sm ${
                          result.accessible 
                            ? result.hasData 
                              ? 'text-green-600' 
                              : 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {result.accessible 
                            ? result.hasData 
                              ? `✓ ${result.totalRows || 0} rows` 
                              : '⚠ Empty table'
                            : '❌ Access denied'
                          }
                        </span>
                      </div>
                      {result.error && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-red-600 bg-red-50 p-3 rounded">
                  Error testing table access: {tableAccess.error}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="rounded-2xl border border-makmex-border bg-makmex-surface p-6">
          <h2 className="mb-4 text-xl font-bold text-makmex-text">
            Next Steps & Troubleshooting
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-makmex-orange flex-shrink-0"></div>
              <div>
                <p className="font-semibold">If you see "Access denied" errors:</p>
                <p className="text-makmex-muted">Your tables likely have Row Level Security (RLS) enabled. You'll need to create policies to allow public read access.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-makmex-orange flex-shrink-0"></div>
              <div>
                <p className="font-semibold">To fix RLS issues:</p>
                <p className="text-makmex-muted">Go to your Supabase dashboard → Authentication → Policies, and create policies like:</p>
                <code className="block mt-1 p-2 bg-makmex-panel rounded text-xs">
                  CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);
                </code>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-makmex-orange flex-shrink-0"></div>
              <p>If tables are empty, add some sample data through your Supabase dashboard</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-makmex-orange flex-shrink-0"></div>
              <p>Check your Supabase dashboard to make sure you have the expected tables and foreign key relationships</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}