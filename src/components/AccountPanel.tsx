import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getOwnProfile, updateOwnProfile } from '../lib/communityApi'

export function AccountPanel() {
  const { status, user, sendMagicLink, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    getOwnProfile()
      .then((profile) => { if (active) setDisplayName(profile.display_name ?? '') })
      .catch(() => { if (active) setMessage('No se pudo cargar el perfil remoto.') })
    return () => { active = false }
  }, [user])

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await sendMagicLink(email.trim())
      setMessage('Revisa tu email para abrir el enlace de acceso.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo enviar el enlace.')
    } finally {
      setBusy(false)
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await updateOwnProfile(displayName)
      setMessage('Perfil actualizado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el perfil.')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'unconfigured') {
    return <section className="profile-section account-card"><span className="section-kicker">CUENTA OPCIONAL</span><h3>Modo local activo</h3><p>Explorar, usar el radar y guardar favoritos no requieren una cuenta.</p></section>
  }

  if (status === 'loading') {
    return <section className="profile-section account-card" aria-live="polite"><span className="section-kicker">CUENTA</span><p>Comprobando sesión…</p></section>
  }

  if (!user) {
    return <section className="profile-section account-card"><span className="section-kicker">CUENTA OPCIONAL</span><h3>Sincroniza tus aportes</h3><form className="account-form" onSubmit={requestLink}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><button type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar enlace de acceso'}</button></form>{message && <p className="account-message" aria-live="polite">{message}</p>}</section>
  }

  return <section className="profile-section account-card"><span className="section-kicker">CUENTA CONECTADA</span><h3>{user.email}</h3><form className="account-form" onSubmit={saveProfile}><label>Nombre visible<input type="text" minLength={2} maxLength={40} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Explorador de DC" /></label><button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar perfil'}</button></form>{message && <p className="account-message" aria-live="polite">{message}</p>}<button className="account-signout" type="button" onClick={() => void signOut()}>Cerrar sesión</button></section>
}
