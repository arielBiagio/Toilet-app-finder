import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Map, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { runtimeConfig } from './lib/runtimeConfig'
import { selectRadarCandidates } from './lib/radar'
import { loadLocalProfile, saveLocalProfile } from './lib/localProfile'
import './styles.css'

type Origin = { kind: 'device' | 'manual'; latitude: number; longitude: number } | null
type Filters = { openNow: boolean; noPurchase: boolean; accessible: boolean }
type View = 'explore' | 'favorites' | 'profile'
type IconName = 'compass' | 'heart' | 'user' | 'pin' | 'crosshair' | 'filter' | 'shield' | 'star' | 'lock' | 'map'

const dcCenter: [number, number] = [-77.028, 38.8895]
const initialFilters: Filters = { openNow: false, noPurchase: false, accessible: false }
const publishedRadarCandidates: never[] = []

const iconPaths: Record<IconName, ReactNode> = {
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  crosshair: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  filter: <path d="M4 5h16l-6.2 7.1V19l-3.6 2v-8.9L4 5Z" />,
  shield: <path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z" />,
  star: <path d="m12 2.7 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.7Z" />,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  map: <><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" /><path d="M8 3v15M16 6v15" /></>,
}

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg className="app-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

function inCoverage(latitude: number, longitude: number) {
  return latitude >= 38.86 && latitude <= 38.93 && longitude >= -77.08 && longitude <= -76.98
}

function MapCanvas({ onMapError, origin }: { onMapError: () => void; origin: Origin }) {
  const node = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const markerRef = useRef<Marker | null>(null)

  useEffect(() => {
    if (!node.current || !runtimeConfig.mapTilerKey) return
    const map = new Map({
      container: node.current,
      center: dcCenter,
      zoom: 13.3,
      style: {
        version: 8,
        sources: {
          'maptiler-raster': {
            type: 'raster',
            tiles: [`https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=${runtimeConfig.mapTilerKey}`],
            tileSize: 256,
            attribution: '© MapTiler © OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'maptiler-raster', type: 'raster', source: 'maptiler-raster' }],
      },
    })
    mapRef.current = map
    map.on('error', onMapError)
    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      mapRef.current = null
      map.remove()
    }
  }, [onMapError])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !origin) return

    const coordinates: [number, number] = [origin.longitude, origin.latitude]
    if (!Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) return

    if (!markerRef.current) {
      const markerNode = document.createElement('div')
      markerNode.className = 'user-location-marker'
      markerNode.setAttribute('aria-label', 'Tu ubicación')
      markerRef.current = new Marker({ element: markerNode, anchor: 'center' })
        .setLngLat(coordinates)
        .addTo(map)
    } else {
      markerRef.current.setLngLat(coordinates)
    }

    map.flyTo({ center: coordinates, zoom: 15.4, duration: 900 })
  }, [origin])

  if (!runtimeConfig.mapTilerKey) {
    return <div className="map-fallback" role="status"><Icon name="map" size={34} /><div><strong>Mapa en espera</strong><span>Configura la clave pública de MapTiler y reinicia Vite.</span></div></div>
  }
  return <div className="map-canvas" ref={node} aria-label="Mapa de National Mall y downtown DC" />
}

function ScreenTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return <header className="screen-title"><div><span>{eyebrow}</span><h1>{title}</h1></div>{action}</header>
}

export default function App() {
  const [origin, setOrigin] = useState<Origin>(null)
  const [locationState, setLocationState] = useState<'idle' | 'loading' | 'denied' | 'outside'>('idle')
  const [profile, setProfile] = useState(loadLocalProfile)
  const [filters, setFilters] = useState<Filters>(() => ({ ...initialFilters, accessible: profile.radarAccessibility }))
  const [activeView, setActiveView] = useState<View>('explore')
  const [manualFormOpen, setManualFormOpen] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const reportMapError = useCallback(() => setMapFailed(true), [])
  const activeFilterCount = Object.values(filters).filter(Boolean).length
  const radarCandidates = useMemo(() => selectRadarCandidates(publishedRadarCandidates, filters.accessible), [filters.accessible])

  function updateFilter(filter: keyof Filters) {
    if (filter === 'accessible') {
      setFilters((current) => ({ ...current, accessible: !current.accessible }))
      setProfile((current) => {
        const next = { ...current, radarAccessibility: !current.radarAccessibility }
        saveLocalProfile(next)
        return next
      })
      return
    }
    setFilters((current) => ({ ...current, [filter]: !current[filter] }))
  }

  function selectView(view: View) {
    setEmergencyMode(false)
    setActiveView(view)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function requestDeviceLocation() {
    if (!navigator.geolocation) { setLocationState('denied'); return }
    setLocationState('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setOrigin({ kind: 'device', latitude: coords.latitude, longitude: coords.longitude })
        setLocationState(inCoverage(coords.latitude, coords.longitude) ? 'idle' : 'outside')
      },
      () => setLocationState('denied'),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    )
  }

  function submitManualOrigin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const latitude = Number(form.get('latitude'))
    const longitude = Number(form.get('longitude'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
    setOrigin({ kind: 'manual', latitude, longitude })
    setLocationState(inCoverage(latitude, longitude) ? 'idle' : 'outside')
    setManualFormOpen(false)
  }

  return <main className={`app-shell ${emergencyMode ? 'emergency-mode' : ''}`}>
    {activeView === 'explore' && <div className="screen explore-screen">
      <section className={`map-stage ${emergencyMode ? 'radar-map' : ''}`} aria-label="Mapa y cobertura">
        <MapCanvas onMapError={reportMapError} origin={origin} />
        {emergencyMode && <div className="radar-sweep" aria-hidden="true" />}
        <div className="map-location"><Icon name="pin" size={15} /><span>National Mall + downtown</span></div>
        <button className={`sos-fab ${emergencyMode ? 'active' : ''}`} type="button" onClick={() => setEmergencyMode((current) => !current)} aria-label={emergencyMode ? 'Salir del modo urgencia' : 'Activar modo urgencia'}>{emergencyMode ? '×' : 'SOS'}</button>
        <button className="locate-button" type="button" onClick={requestDeviceLocation} disabled={locationState === 'loading'} aria-label="Usar mi ubicación"><Icon name="crosshair" size={21} /></button>
        <div className="map-fade" aria-hidden="true" />
      </section>

      <section className={`results-sheet ${emergencyMode ? 'emergency-sheet' : ''}`} aria-labelledby="results-title">
        <span className="sheet-handle" aria-hidden="true" />
        {emergencyMode ? <>
          <div className="sheet-heading"><div><span className="section-kicker hot">URGENCIA</span><h2 id="results-title">Más cercanos</h2></div><span className="live-dot">RADAR</span></div>
          {!origin && <div className="action-grid"><button className="primary-button hot-button" type="button" onClick={requestDeviceLocation} disabled={locationState === 'loading'}><Icon name="crosshair" />{locationState === 'loading' ? 'Buscando…' : 'Usar mi ubicación'}</button><button className="secondary-button" type="button" onClick={() => setManualFormOpen((open) => !open)}>Elegir punto</button></div>}
          {manualFormOpen && <form className="manual-origin" onSubmit={submitManualOrigin}><label>Latitud<input name="latitude" type="number" step="any" inputMode="decimal" placeholder="38.8895" required /></label><label>Longitud<input name="longitude" type="number" step="any" inputMode="decimal" placeholder="-77.0280" required /></label><button type="submit">Usar punto</button></form>}
          {locationState === 'denied' && <p className="notice">No pudimos usar tu ubicación. Elige un punto manual para continuar.</p>}
          {locationState === 'outside' && <p className="notice">Estás fuera de la cobertura inicial de National Mall y downtown.</p>}
          <label className="access-row"><span><Icon name="shield" /><strong>Accesibilidad</strong></span><input type="checkbox" checked={filters.accessible} onChange={() => updateFilter('accessible')} /></label>
          {radarCandidates.length === 0 ? <div className="quest-empty emergency-empty" role="status"><span className="empty-icon"><Icon name="crosshair" size={32} /></span><h3>Sin opciones verificadas cerca</h3></div> : <ol className="result-list">{radarCandidates.map((candidate) => <li key={candidate.id}><strong>Opción verificada</strong><span>{Math.round(candidate.distanceMeters)} m</span><button type="button">Ir</button></li>)}</ol>}
        </> : <>
          <div className="sheet-heading"><div><span className="section-kicker">CERCA DE TI</span><h2 id="results-title">Explorar baños</h2></div><span className="result-count">0 lugares</span></div>
          <div className="filter-strip" aria-label="Filtros de búsqueda">
            <button className={activeFilterCount ? 'filter-button active' : 'filter-button'} type="button"><Icon name="filter" size={17} />Filtros{activeFilterCount ? ` · ${activeFilterCount}` : ''}</button>
            <label className={filters.openNow ? 'filter-chip selected' : 'filter-chip'}><input type="checkbox" checked={filters.openNow} onChange={() => updateFilter('openNow')} />Abierto ahora</label>
            <label className={filters.noPurchase ? 'filter-chip selected' : 'filter-chip'}><input type="checkbox" checked={filters.noPurchase} onChange={() => updateFilter('noPurchase')} />Sin compra</label>
            <label className={filters.accessible ? 'filter-chip selected' : 'filter-chip'}><input type="checkbox" checked={filters.accessible} onChange={() => updateFilter('accessible')} />Accesible</label>
          </div>

          <div className="origin-card">
            <span className="origin-symbol"><Icon name={origin ? 'pin' : 'crosshair'} /></span>
            <div><strong>{origin ? 'Origen listo' : 'Ordena por distancia'}</strong><p>{origin ? `Usando ubicación ${origin.kind === 'device' ? 'del dispositivo' : 'manual'}.` : 'Comparte tu ubicación o elige un punto del mapa.'}</p></div>
            {!origin && <button type="button" onClick={requestDeviceLocation} disabled={locationState === 'loading'}>{locationState === 'loading' ? '…' : 'Usar'}</button>}
          </div>
          {!origin && <button className="text-button" type="button" onClick={() => setManualFormOpen((open) => !open)}>{manualFormOpen ? 'Cerrar selección manual' : 'Elegir coordenadas manualmente'}</button>}
          {manualFormOpen && <form className="manual-origin" onSubmit={submitManualOrigin}><label>Latitud<input name="latitude" type="number" step="any" inputMode="decimal" placeholder="38.8895" required /></label><label>Longitud<input name="longitude" type="number" step="any" inputMode="decimal" placeholder="-77.0280" required /></label><button type="submit">Usar punto</button></form>}
          {locationState === 'denied' && <p className="notice">No pudimos usar tu ubicación. Puedes elegir un punto manual.</p>}
          {locationState === 'outside' && <p className="notice">Estás fuera de la cobertura inicial de National Mall y downtown.</p>}

          <div className="quest-empty" role="status"><span className="empty-icon"><Icon name="map" size={32} /></span><h3>Preparando el mapa de misiones</h3><p>{mapFailed ? 'El mapa base no respondió, pero la lista funcionará cuando haya ubicaciones publicadas.' : 'Las primeras ubicaciones siguen en revisión. Aparecerán aquí cuando tengan entrada, acceso y horario confirmados.'}</p><span className="empty-status"><span />0 ubicaciones publicadas</span></div>
        </>}
      </section>
    </div>}

    {activeView === 'favorites' && <section className="screen collection-screen">
      <ScreenTitle eyebrow="TU COLECCIÓN" title="Favoritos" action={<span className="title-token"><Icon name="heart" size={18} />{profile.favoriteIds.length}</span>} />
      <div className="collection-banner"><span><Icon name="star" size={26} /></span><div><strong>Tu ruta personal</strong><p>Guarda baños confiables para encontrarlos más rápido.</p></div></div>
      {profile.favoriteIds.length === 0 ? <div className="full-empty"><div className="empty-orbit"><Icon name="heart" size={42} /></div><span className="section-kicker">LISTA VACÍA</span><h2>Aún no tienes favoritos</h2><p>Cuando el catálogo esté publicado, toca el corazón de cualquier lugar para guardarlo en este dispositivo.</p><button className="primary-button" type="button" onClick={() => selectView('explore')}><Icon name="compass" />Explorar el mapa</button></div> : <div className="full-empty"><div className="empty-orbit"><Icon name="heart" size={42} /></div><h2>{profile.favoriteIds.length} guardado{profile.favoriteIds.length === 1 ? '' : 's'}</h2><p>Las fichas aparecerán cuando esos lugares estén disponibles en el catálogo público.</p><button className="secondary-button" type="button" onClick={() => setProfile((current) => { const next = { ...current, favoriteIds: [] }; saveLocalProfile(next); return next })}>Borrar favoritos locales</button></div>}
    </section>}

    {activeView === 'profile' && <section className="screen profile-screen">
      <ScreenTitle eyebrow="AVENTURERO LOCAL" title="Mi perfil" action={<span className="profile-avatar"><Icon name="user" size={24} /></span>} />
      <div className="player-card"><div className="player-level"><span>1</span><small>NIVEL</small></div><div className="player-copy"><span>EXPLORADOR</span><h2>Visitante de DC</h2><p>Perfil guardado en este dispositivo</p><div className="xp-track"><span /></div><small>0 / 100 XP</small></div></div>
      <div className="stats-grid"><div><strong>{profile.favoriteIds.length}</strong><span>Favoritos</span></div><div><strong>0</strong><span>Visitas</span></div><div><strong>0</strong><span>Aportes</span></div></div>
      <section className="profile-section"><div className="section-heading"><div><span className="section-kicker">PROGRESO</span><h2>Badges</h2></div><span>0 / 3</span></div><div className="badge-grid"><div><span><Icon name="star" /></span><strong>Primer hallazgo</strong><small><Icon name="lock" size={12} /> Bloqueado</small></div><div><span><Icon name="shield" /></span><strong>Radar al rescate</strong><small><Icon name="lock" size={12} /> Bloqueado</small></div><div><span><Icon name="map" /></span><strong>Guía local</strong><small><Icon name="lock" size={12} /> Bloqueado</small></div></div></section>
      <section className="profile-section settings-card"><div><span className="settings-icon"><Icon name="shield" /></span><span><strong>Accesibilidad en radar</strong><small>Recordar esta preferencia</small></span></div><label className="switch"><input type="checkbox" checked={filters.accessible} onChange={() => updateFilter('accessible')} /><span /></label></section>
      <section className="profile-section data-card"><span className="section-kicker">DATOS LOCALES</span><h3>Sin catálogo descargado</h3><p>Los mapas y rutas no se guardan sin conexión. Tus preferencias permanecen únicamente en este navegador.</p></section>
    </section>}

    <nav className="bottom-nav" aria-label="Navegación principal">
      <button className={activeView === 'explore' ? 'active' : ''} type="button" aria-current={activeView === 'explore' ? 'page' : undefined} onClick={() => selectView('explore')}><Icon name="compass" /><span>Explorar</span></button>
      <button className={activeView === 'favorites' ? 'active' : ''} type="button" aria-current={activeView === 'favorites' ? 'page' : undefined} onClick={() => selectView('favorites')}><Icon name="heart" /><span>Favoritos</span></button>
      <button className={activeView === 'profile' ? 'active' : ''} type="button" aria-current={activeView === 'profile' ? 'page' : undefined} onClick={() => selectView('profile')}><Icon name="user" /><span>Perfil</span></button>
    </nav>
  </main>
}
