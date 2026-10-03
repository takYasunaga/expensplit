import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// Supabase now calls the anon key the "publishable" key; accept either name.
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// Booleans only: never log the values themselves.
if (import.meta.env.DEV) {
  console.info('[supabase] env check', {
    VITE_SUPABASE_URL: Boolean(supabaseUrl),
    VITE_SUPABASE_ANON_KEY: Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY),
    VITE_SUPABASE_PUBLISHABLE_KEY: Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  })
}

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)',
  ].filter(Boolean)
  console.warn(
    `[supabase] Not connected: missing ${missing.join(' and ')}. Using sample data.\n` +
      'Vite reads these from a .env.local (or .env) file in the project root, next to package.json:\n' +
      '  VITE_SUPABASE_URL=https://<project-ref>.supabase.co\n' +
      '  VITE_SUPABASE_ANON_KEY=<anon or publishable key>\n' +
      'Names must match exactly and start with VITE_. Restart `npm run dev` after editing the file; ' +
      'env files are only read at startup.',
  )
}

/** Null when the env vars are not set, so callers can fall back to mock data. */
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null
