/**
 * Esta etapa solo describe la configuración. No crear un cliente de Supabase
 * ni consumir el catálogo hasta que haya tablas operativas y políticas para
 * registros publicados.
 */
export const runtimeConfig = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
  mapTilerKey: import.meta.env.VITE_MAPTILER_KEY ?? '',
} as const

export const hasPublicSupabaseConfiguration =
  Boolean(runtimeConfig.supabaseUrl) && Boolean(runtimeConfig.supabasePublishableKey)
