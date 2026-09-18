import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Map, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { runtimeConfig } from './lib/runtimeConfig'
import { loadLocalProfile, saveLocalProfile } from './lib/localProfile'
import { accessLabel, directionsUrl, distanceMeters, loadRestrooms } from './lib/restrooms'
import type { Restroom } from './lib/restrooms'
import { AccountPanel } from './components/AccountPanel'
import { useCommunityProgress } from './hooks/useCommunityProgress'
import './styles.css'

type Origin = { kind: 'device' | 'manual'; latitude: number; longitude: number } | null
type Filters = { withHours: boolean; noPurchase: boolean; accessible: boolean }
type View = 'explore' | 'favorites' | 'profile'
type IconName = 'compass' | 'heart' | 'user' | 'pin' | 'crosshair' | 'filter' | 'shield' | 'star' | 'lock' | 'map' | 'clock' | 'route' | 'close'

const dcCenter: [number, number] = [-77.028, 38.8895]
const initialFilters: Filters = { withHours: false, noPurchase: false, accessible: false }

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
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  route: <><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" /><path d="M8 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
}

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg className="app-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>
}

function inCoverage(latitude: number, longitude: number) {
  return latitude >= 38.86 && latitude <= 38.93 && longitude >= -77.08 && longitude <= -76.98
}

function distanceLabel(distance: number | null) {
  if (distance === null) return null
  if (distance < 1000) return `${Math.round(distance)} m`
  return `${(distance / 1000).toFixed(1)} km`
}

function MapCanvas({ onMapError, origin, restrooms, selectedId, onSelect }: {
  onMapError: () => void
  origin: Origin
  restrooms: Restroom[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const node = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const userMarkerRef = useRef<Marker | null>(null)
  const restroomMarkersRef = useRef<Marker[]>([])

  useEffect(() => {
    if (!node.current || !runtimeConfig.mapTilerKey) return
    const map = new Map({
      container: node.current,
      center: dcCenter,
      zoom: 13.3,
      style: {
        version: 8,
        sources: { 'maptiler-raster': { type: 'raster', tiles: [`https://api.maptiler.com/maps/streets-v4/256/{z}/{x}/{y}.png?key=${runtimeConfig.mapTilerKey}`], tileSize: 256, attribution: '© MapTiler © OpenStreetMap contributors' } },
        layers: [{ id: 'maptiler-raster', type: 'raster', source: 'maptiler-raster' }],
      },
    })
    mapRef.current = map
    map.on('error', onMapError)
    return () => {
      userMarkerRef.current?.remove()
      restroomMarkersRef.current.forEach((marker) => marker.remove())
      mapRef.current = null
      map.remove()
    }
  }, [onMapError])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    restroomMarkersRef.current.forEach((marker) => marker.remove())
    restroomMarkersRef.current = restrooms.map((restroom) => {
      const markerNode = document.createElement('button')
      markerNode.type = 'button'
      markerNode.className = `restroom-marker${restroom.id === selectedId ? ' selected' : ''}`
      markerNode.setAttribute('aria-label', `Ver ${restroom.name}`)
      markerNode.innerHTML = '<span></span>'
      markerNode.addEventListener('click', () => onSelect(restroom.id))
      return new Marker({ element: markerNode, anchor: 'bottom' }).setLngLat([restroom.longitude, restroom.latitude]).addTo(map)
    })
  }, [restrooms, selectedId, onSelect])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !origin) return
    const coordinates: [number, number] = [origin.longitude, origin.latitude]
    if (!Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) return
    if (!userMarkerRef.current) {
      const markerNode = document.createElement('div')
      markerNode.className = 'user-location-marker'
      markerNode.setAttribute('aria-label', 'Tu ubicación')
      userMarkerRef.current = new Marker({ element: markerNode, anchor: 'center' }).setLngLat(coordinates).addTo(map)
    } else userMarkerRef.current.setLngLat(coordinates)
    map.flyTo({ center: coordinates, zoom: 15.4, duration: 900 })
  }, [origin])

  useEffect(() => {
    const map = mapRef.current
    const restroom = restrooms.find((item) => item.id === selectedId)
    if (map && restroom) map.flyTo({ center: [restroom.longitude, restroom.latitude], zoom: 15.7, duration: 650 })
  }, [selectedId, restrooms])

  if (!runtimeConfig.mapTilerKey) return <div className="map-fallback" role="status"><Icon name="map" size={34} /><div><strong>Mapa en espera</strong><span>Configura la clave pública de MapTiler y reinicia Vite.</span></div></div>
  return <div className="map-canvas" ref={node} aria-label="Mapa de baños en National Mall y downtown DC" />
}

function PlaceCard({ restroom, distance, favorite, selected, onSelect, onFavorite, urgent = false }: {
  restroom: Restroom
  distance: number | null
  favorite: boolean
  selected: boolean
  onSelect: () => void
  onFavorite: () => void
  urgent?: boolean
}) {
  return <article className={`place-card${selected ? ' selected' : ''}${urgent ? ' urgent' : ''}`}>
    <button className="place-main" type="button" onClick={onSelect}>
      <span className="place-rank"><Icon name="pin" size={18} /></span>
      <span className="place-copy"><strong>{restroom.name}</strong><small>{restroom.address}</small><span className="place-meta">{distanceLabel(distance) && <b>{distanceLabel(distance)}</b>}<span>{accessLabel(restroom)}</span></span></span>
    </button>
    <button className={`favorite-button${favorite ? ' active' : ''}`} type="button" onClick={onFavorite} aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}><Icon name="heart" size={19} /></button>
  </article>
}

function RestroomDetail({ restroom, distance, favorite, onClose, onFavorite }: {
  restroom: Restroom
  distance: number | null
  favorite: boolean
  onClose: () => void
  onFavorite: () => void
}) {
  const amenities = [restroom.wheelchairAccess === 'yes' && 'Accesible', restroom.changingTable && 'Cambiador', restroom.familyRestroom && 'Baño familiar', restroom.genderNeutral && 'Sin género'].filter(Boolean) as string[]
  return <section className="place-detail" aria-label={`Información de ${restroom.name}`}>
    <button className="detail-close" type="button" onClick={onClose} aria-label="Cerrar información"><Icon name="close" size={18} /></button>
    <span className="section-kicker">PUNTO SELECCIONADO</span>
    <h3>{restroom.name}</h3>
    <p className="detail-address"><Icon name="pin" size={15} />{restroom.address}</p>
    <div className="detail-facts"><span><Icon name="route" size={16} />{distanceLabel(distance) ?? 'Activa ubicación para calcular'}</span><span><Icon name="shield" size={16} />{accessLabel(restroom)}</span></div>
    {restroom.venueHoursText && <p className="detail-hours"><Icon name="clock" size={16} />{restroom.venueHoursText}</p>}
    {restroom.entranceNotes && <p className="detail-notes">{restroom.entranceNotes}</p>}
    {amenities.length > 0 && <div className="amenity-list">{amenities.map((amenity) => <span key={amenity}>{amenity}</span>)}</div>}
    <div className="detail-actions"><a className="route-button" href={directionsUrl(restroom)} target="_blank" rel="noreferrer"><Icon name="route" size={19} />Cómo llegar</a><button className={`detail-favorite${favorite ? ' active' : ''}`} type="button" onClick={onFavorite}><Icon name="heart" size={19} />{favorite ? 'Guardado' : 'Guardar'}</button></div>
  </section>
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
  const [restrooms, setRestrooms] = useState<Restroom[]>([])
  const [catalogSource, setCatalogSource] = useState<'loading' | 'supabase' | 'demo'>('loading')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const communityProgress = useCommunityProgress()
  const reportMapError = useCallback(() => setMapFailed(true), [])
  const selectRestroom = useCallback((id: string) => setSelectedId(id), [])
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  useEffect(() => {
    let active = true
    loadRestrooms().then((result) => {
      if (!active) return
      setRestrooms(result.restrooms)
      setCatalogSource(result.source)
    })
    return () => { active = false }
  }, [])

  const results = useMemo(() => restrooms
    .filter((restroom) => !filters.noPurchase || restroom.requiresPurchase === false)
    .filter((restroom) => !filters.accessible || restroom.wheelchairAccess === 'yes')
    .filter((restroom) => !filters.withHours || restroom.venueHoursText !== null)
    .map((restroom) => ({ restroom, distance: origin ? distanceMeters(origin, restroom) : null }))
    .sort((a, b) => origin ? (a.distance ?? 0) - (b.distance ?? 0) : (a.restroom.seedId ?? 999) - (b.restroom.seedId ?? 999)), [filters, origin, restrooms])

  const radarResults = useMemo(() => {
    const radarOrigin = origin ?? { latitude: dcCenter[1], longitude: dcCenter[0] }
    return restrooms.filter((restroom) => restroom.operationalStatus === 'operating' && restroom.requiresTicket !== true && restroom.requiresPurchase !== true)
      .filter((restroom) => !filters.accessible || restroom.wheelchairAccess === 'yes')
      .map((restroom) => ({ restroom, distance: distanceMeters(radarOrigin, restroom) })).sort((a, b) => a.distance - b.distance).slice(0, 3)
  }, [filters.accessible, origin, restrooms])

  const selectedRestroom = restrooms.find((restroom) => restroom.id === selectedId) ?? null
  const selectedDistance = selectedRestroom && origin ? distanceMeters(origin, selectedRestroom) : null
  const favoriteRestrooms = profile.favoriteIds.map((id) => restrooms.find((restroom) => restroom.id === id)).filter((item): item is Restroom => Boolean(item))

  function updateFilter(filter: keyof Filters) {
    if (filter === 'accessible') {
      setFilters((current) => ({ ...current, accessible: !current.accessible }))
      setProfile((current) => { const next = { ...current, radarAccessibility: !current.radarAccessibility }; saveLocalProfile(next); return next })
      return
    }
    setFilters((current) => ({ ...current, [filter]: !current[filter] }))
  }

  function toggleFavorite(id: string) {
    setProfile((current) => {
      const favoriteIds = current.favoriteIds.includes(id) ? current.favoriteIds.filter((item) => item !== id) : [...current.favoriteIds, id]
      const next = { ...current, favoriteIds }
      saveLocalProfile(next)
      return next
    })
  }

  function selectView(view: View) { setEmergencyMode(false); setActiveView(view); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function openFavorite(restroom: Restroom) { setSelectedId(restroom.id); selectView('explore') }

  function requestDeviceLocation() {
    if (!navigator.geolocation) { setLocationState('denied'); return }
    setLocationState('loading')
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setOrigin({ kind: 'device', latitude: coords.latitude, longitude: coords.longitude })
      setLocationState(inCoverage(coords.latitude, coords.longitude) ? 'idle' : 'outside')
    }, () => setLocationState('denied'), { enableHighAccuracy: true, maximumAge: 60_000, timeout: 10_000 })
  }

  function submitManualOrigin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const latitude = Number(form.get('latitude')); const longitude = Number(form.get('longitude'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return
    setOrigin({ kind: 'manual', latitude, longitude }); setLocationState(inCoverage(latitude, longitude) ? 'idle' : 'outside'); setManualFormOpen(false)
  }

  const manualOriginForm = manualFormOpen && <form className="manual-origin" onSubmit={submitManualOrigin}><label>Latitud<input name="latitude" type="number" step="any" inputMode="decimal" placeholder="38.8895" required /></label><label>Longitud<input name="longitude" type="number" step="any" inputMode="decimal" placeholder="-77.0280" required /></label><button type="submit">Usar punto</button></form>

  return <main className={`app-shell ${emergencyMode ? 'emergency-mode' : ''}`}>
    {activeView === 'explore' && <div className="screen explore-screen">
      <section className={`map-stage ${emergencyMode ? 'radar-map' : ''}`} aria-label="Mapa y cobertura">
        <MapCanvas onMapError={reportMapError} origin={origin} restrooms={results.map((item) => item.restroom)} selectedId={selectedId} onSelect={selectRestroom} />
        {emergencyMode && <div className="radar-sweep" aria-hidden="true" />}
        <div className="map-location"><Icon name="pin" size={15} /><span>National Mall + downtown</span></div>
        <button className={`sos-fab ${emergencyMode ? 'active' : ''}`} type="button" onClick={() => setEmergencyMode((current) => !current)} aria-label={emergencyMode ? 'Salir del modo urgencia' : 'Activar modo urgencia'}>{emergencyMode ? '×' : 'SOS'}</button>
        <button className="locate-button" type="button" onClick={requestDeviceLocation} disabled={locationState === 'loading'} aria-label="Usar mi ubicación"><Icon name="crosshair" size={21} /></button><div className="map-fade" aria-hidden="true" />
      </section>

      <section className={`results-sheet ${emergencyMode ? 'emergency-sheet' : ''}`} aria-labelledby="results-title">
        <span className="sheet-handle" aria-hidden="true" />
        {selectedRestroom && <RestroomDetail restroom={selectedRestroom} distance={selectedDistance} favorite={profile.favoriteIds.includes(selectedRestroom.id)} onClose={() => setSelectedId(null)} onFavorite={() => toggleFavorite(selectedRestroom.id)} />}
        {emergencyMode ? <>
          <div className="sheet-heading"><div><span className="section-kicker hot">URGENCIA</span><h2 id="results-title">Más cercanos</h2></div><span className="live-dot">RADAR</span></div>
          {!origin && <div className="action-grid"><button className="primary-button hot-button" type="button" onClick={requestDeviceLocation} disabled={locationState === 'loading'}><Icon name="crosshair" />{locationState === 'loading' ? 'Buscando…' : 'Usar mi ubicación'}</button><button className="secondary-button" type="button" onClick={() => setManualFormOpen((open) => !open)}>Elegir punto</button></div>}
          {manualOriginForm}{locationState === 'denied' && <p className="notice">No pudimos usar tu ubicación. Elige un punto manual.</p>}{locationState === 'outside' && <p className="notice">Estás fuera de la cobertura inicial.</p>}
          <label className="access-row"><span><Icon name="shield" /><strong>Accesibilidad</strong></span><input type="checkbox" checked={filters.accessible} onChange={() => updateFilter('accessible')} /></label>
          <div className="place-list urgent-list">{radarResults.map(({ restroom, distance }) => <PlaceCard key={restroom.id} restroom={restroom} distance={distance} favorite={profile.favoriteIds.includes(restroom.id)} selected={selectedId === restroom.id} urgent onSelect={() => selectRestroom(restroom.id)} onFavorite={() => toggleFavorite(restroom.id)} />)}</div>
        </> : <>
          <div className="sheet-heading"><div><span className="section-kicker">CERCA DE TI</span><h2 id="results-title">Explorar baños</h2></div><span className="result-count">{results.length} lugares</span></div>
          <div className="filter-strip" aria-label="Filtros de búsqueda"><button className={activeFilterCount ? 'filter-button active' : 'filter-button'} type="button"><Icon name="filter" size={17} />Filtros{activeFilterCount ? ` · ${activeFilterCount}` : ''}</button><label className={filters.withHours ? 'filter-chip selected' : 'filter-chip'}><input type="checkbox" checked={filters.withHours} onChange={() => updateFilter('withHours')} />Con horario</label><label className={filters.noPurchase ? 'filter-chip selected' : 'filter-chip'}><input type="checkbox" checked={filters.noPurchase} onChange={() => updateFilter('noPurchase')} />Sin compra</label><label className={filters.accessible ? 'filter-chip selected' : 'filter-chip'}><input type="checkbox" checked={filters.accessible} onChange={() => updateFilter('accessible')} />Accesible</label></div>
          <div className="origin-card"><span className="origin-symbol"><Icon name={origin ? 'pin' : 'crosshair'} /></span><div><strong>{origin ? 'Ordenados por distancia' : 'Activa tu ubicación'}</strong><p>{origin ? `Origen ${origin.kind === 'device' ? 'del dispositivo' : 'manual'}.` : 'Para ver cuál queda más cerca.'}</p></div>{!origin && <button type="button" onClick={requestDeviceLocation} disabled={locationState === 'loading'}>{locationState === 'loading' ? '…' : 'Usar'}</button>}</div>
          {!origin && <button className="text-button" type="button" onClick={() => setManualFormOpen((open) => !open)}>{manualFormOpen ? 'Cerrar' : 'Elegir coordenadas'}</button>}{manualOriginForm}
          {locationState === 'denied' && <p className="notice">No pudimos usar tu ubicación. Puedes elegir un punto manual.</p>}{locationState === 'outside' && <p className="notice">Estás fuera de la cobertura inicial.</p>}
          {catalogSource === 'demo' && <p className="catalog-note">Catálogo inicial · ubicaciones pendientes de validación final</p>}
          {catalogSource === 'loading' ? <div className="quest-empty" role="status"><span className="empty-icon"><Icon name="map" size={32} /></span><h3>Cargando baños…</h3></div> : results.length === 0 ? <div className="quest-empty" role="status"><h3>No hay resultados con estos filtros</h3></div> : <div className="place-list">{results.map(({ restroom, distance }) => <PlaceCard key={restroom.id} restroom={restroom} distance={distance} favorite={profile.favoriteIds.includes(restroom.id)} selected={selectedId === restroom.id} onSelect={() => selectRestroom(restroom.id)} onFavorite={() => toggleFavorite(restroom.id)} />)}</div>}
          {mapFailed && <p className="notice">El mapa base tuvo un problema, pero puedes usar la lista.</p>}
        </>}
      </section>
    </div>}

    {activeView === 'favorites' && <section className="screen collection-screen"><ScreenTitle eyebrow="TU COLECCIÓN" title="Favoritos" action={<span className="title-token"><Icon name="heart" size={18} />{favoriteRestrooms.length}</span>} /><div className="collection-banner"><span><Icon name="star" size={26} /></span><div><strong>Tu ruta personal</strong><p>Guarda lugares útiles para volver rápido.</p></div></div>{favoriteRestrooms.length === 0 ? <div className="full-empty"><div className="empty-orbit"><Icon name="heart" size={42} /></div><span className="section-kicker">LISTA VACÍA</span><h2>Aún no tienes favoritos</h2><p>Toca el corazón de un baño para guardarlo.</p><button className="primary-button" type="button" onClick={() => selectView('explore')}><Icon name="compass" />Explorar el mapa</button></div> : <div className="favorite-list">{favoriteRestrooms.map((restroom) => <PlaceCard key={restroom.id} restroom={restroom} distance={origin ? distanceMeters(origin, restroom) : null} favorite selected={false} onSelect={() => openFavorite(restroom)} onFavorite={() => toggleFavorite(restroom.id)} />)}</div>}</section>}

    {activeView === 'profile' && <section className="screen profile-screen">
      <ScreenTitle eyebrow="AVENTURERO LOCAL" title="Mi perfil" action={<span className="profile-avatar"><Icon name="user" size={24} /></span>} /><div className="player-card"><div className="player-level"><span>1</span><small>NIVEL</small></div><div className="player-copy"><span>EXPLORADOR</span><h2>Visitante de DC</h2><p>Perfil guardado en este dispositivo</p><div className="xp-track"><span /></div><small>0 / 100 XP</small></div></div><div className="stats-grid"><div><strong>{profile.favoriteIds.length}</strong><span>Favoritos</span></div><div><strong>{communityProgress.verifiedVisits}</strong><span>Visitas</span></div><div><strong>{communityProgress.approvedContributions}</strong><span>Aportes</span></div></div><AccountPanel />
      <section className="profile-section"><div className="section-heading"><div><span className="section-kicker">PROGRESO</span><h2>Badges</h2></div><span>{communityProgress.badgeKeys.length} / 3</span></div><div className="badge-grid"><div className={communityProgress.badgeKeys.includes('first_approved') ? 'unlocked' : ''}><span><Icon name="star" /></span><strong>Primer aporte</strong><small>{communityProgress.badgeKeys.includes('first_approved') ? 'Obtenido' : <><Icon name="lock" size={12} /> Bloqueado</>}</small></div><div className={communityProgress.badgeKeys.includes('five_corrections') ? 'unlocked' : ''}><span><Icon name="shield" /></span><strong>Ojo de halcón</strong><small>{communityProgress.badgeKeys.includes('five_corrections') ? 'Obtenido' : <><Icon name="lock" size={12} /> Bloqueado</>}</small></div><div className={communityProgress.badgeKeys.includes('ten_verifications') ? 'unlocked' : ''}><span><Icon name="map" /></span><strong>Guía local</strong><small>{communityProgress.badgeKeys.includes('ten_verifications') ? 'Obtenido' : <><Icon name="lock" size={12} /> Bloqueado</>}</small></div></div></section>
      <section className="profile-section settings-card"><div><span className="settings-icon"><Icon name="shield" /></span><span><strong>Accesibilidad en radar</strong><small>Recordar esta preferencia</small></span></div><label className="switch"><input type="checkbox" checked={filters.accessible} onChange={() => updateFilter('accessible')} /><span /></label></section><section className="profile-section data-card"><span className="section-kicker">CATÁLOGO</span><h3>{restrooms.length} baños disponibles</h3><p>{catalogSource === 'supabase' ? 'Datos cargados desde Supabase.' : 'Datos iniciales guardados en la aplicación para pruebas.'}</p></section>
    </section>}

    <nav className="bottom-nav" aria-label="Navegación principal"><button className={activeView === 'explore' ? 'active' : ''} type="button" aria-current={activeView === 'explore' ? 'page' : undefined} onClick={() => selectView('explore')}><Icon name="compass" /><span>Explorar</span></button><button className={activeView === 'favorites' ? 'active' : ''} type="button" aria-current={activeView === 'favorites' ? 'page' : undefined} onClick={() => selectView('favorites')}><Icon name="heart" /><span>Favoritos</span></button><button className={activeView === 'profile' ? 'active' : ''} type="button" aria-current={activeView === 'profile' ? 'page' : undefined} onClick={() => selectView('profile')}><Icon name="user" /><span>Perfil</span></button></nav>
  </main>
}
