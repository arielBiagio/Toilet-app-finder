import { createClient } from '@supabase/supabase-js'
import { hasPublicSupabaseConfiguration, runtimeConfig } from './runtimeConfig'

export const supabase = hasPublicSupabaseConfiguration
  ? createClient(runtimeConfig.supabaseUrl, runtimeConfig.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
