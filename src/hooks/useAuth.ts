import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthStatus = 'unconfigured' | 'loading' | 'signed_out' | 'signed_in'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>(supabase ? 'loading' : 'unconfigured')

  useEffect(() => {
    if (!supabase) return
    let active = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) {
        setStatus('signed_out')
        return
      }
      setSession(data.session)
      setStatus(data.session ? 'signed_in' : 'signed_out')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setStatus(nextSession ? 'signed_in' : 'signed_out')
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function sendMagicLink(email: string) {
    if (!supabase) throw new Error('Supabase no está configurado.')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    status,
    session,
    user: (session?.user ?? null) as User | null,
    sendMagicLink,
    signOut,
  }
}
