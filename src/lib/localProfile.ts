export type LocalProfile = {
  favoriteIds: string[]
  radarAccessibility: boolean
}

const storageKey = 'bano-radar-profile-v1'
const emptyProfile: LocalProfile = { favoriteIds: [], radarAccessibility: false }

export function loadLocalProfile(): LocalProfile {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? '')
    if (!parsed || typeof parsed !== 'object') return emptyProfile
    const value = parsed as Partial<LocalProfile>
    return {
      favoriteIds: Array.isArray(value.favoriteIds) ? value.favoriteIds.filter((id): id is string => typeof id === 'string') : [],
      radarAccessibility: value.radarAccessibility === true,
    }
  } catch {
    return emptyProfile
  }
}

export function saveLocalProfile(profile: LocalProfile) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(profile))
  } catch {
    // La app sigue funcionando si el navegador bloquea el almacenamiento local.
  }
}
