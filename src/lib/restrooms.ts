import seedRows from '../../data/restrooms_seed.json'
import coordinateRows from '../../data/restrooms_geocoded.json'
import { supabase } from './supabase'

export type Restroom = {
  id: string
  seedId: number | null
  name: string
  zone: 'national_mall' | 'downtown'
  address: string
  latitude: number
  longitude: number
  entranceNotes: string | null
  accessType: 'public' | 'venue_visitors' | 'customers' | 'permission_required' | 'private' | 'unknown'
  requiresPurchase: boolean | null
  requiresTicket: boolean | null
  venueHoursText: string | null
  wheelchairAccess: 'yes' | 'limited' | 'no' | 'unknown'
  changingTable: boolean | null
  familyRestroom: boolean | null
  genderNeutral: boolean | null
  operationalStatus: 'operating' | 'unknown' | 'temporarily_closed' | 'permanently_closed'
  evidenceStatus: 'official_restroom' | 'community_restroom' | 'venue_only'
  source: 'supabase' | 'demo'
}

type DatabaseRestroom = {
  id: string
  seed_id: number | null
  name: string
  zone: Restroom['zone']
  address: string | null
  entrance_latitude: number | null
  entrance_longitude: number | null
  entrance_notes: string | null
  access_type: Restroom['accessType']
  requires_purchase: boolean | null
  requires_ticket: boolean | null
  venue_hours_text: string | null
  wheelchair_access: Restroom['wheelchairAccess']
  changing_table: boolean | null
  family_restroom: boolean | null
  gender_neutral: boolean | null
  operational_status: Restroom['operationalStatus']
  evidence_status: Restroom['evidenceStatus']
}

const coordinates = new Map(coordinateRows.map((row) => [row.seed_id, row]))

const demoRestrooms: Restroom[] = seedRows.flatMap((row) => {
  const point = coordinates.get(row.id)
  if (!point || point.latitude === null || point.longitude === null) return []
  const notes = row.amenities_notes.toLowerCase()
  return [{
    id: `demo-${row.id}`,
    seedId: row.id,
    name: row.name,
    zone: row.zone as Restroom['zone'],
    address: row.address,
    latitude: point.latitude,
    longitude: point.longitude,
    entranceNotes: row.entrance_notes || null,
    accessType: row.access_policy === 'public_restroom' ? 'public' : row.access_policy === 'access_unconfirmed' ? 'unknown' : 'venue_visitors',
    requiresPurchase: row.access_policy === 'public_restroom' || row.access_policy === 'museum_no_pass' || row.access_policy === 'free_venue_access' || row.access_policy === 'timed_pass_required' ? false : null,
    requiresTicket: row.access_policy === 'timed_pass_required',
    venueHoursText: row.venue_hours_text || null,
    wheelchairAccess: notes.includes('accesible') || notes.includes('silla de ruedas') ? 'yes' : 'unknown',
    changingTable: notes.includes('cambiador') ? true : null,
    familyRestroom: notes.includes('familiar') ? true : null,
    genderNeutral: notes.includes('sin género') ? true : null,
    operationalStatus: 'operating',
    evidenceStatus: row.evidence_status as Restroom['evidenceStatus'],
    source: 'demo',
  }]
})

function mapDatabaseRestroom(row: DatabaseRestroom): Restroom | null {
  if (row.entrance_latitude === null || row.entrance_longitude === null) return null
  return {
    id: row.id,
    seedId: row.seed_id,
    name: row.name,
    zone: row.zone,
    address: row.address ?? 'Washington, DC',
    latitude: row.entrance_latitude,
    longitude: row.entrance_longitude,
    entranceNotes: row.entrance_notes,
    accessType: row.access_type,
    requiresPurchase: row.requires_purchase,
    requiresTicket: row.requires_ticket,
    venueHoursText: row.venue_hours_text,
    wheelchairAccess: row.wheelchair_access,
    changingTable: row.changing_table,
    familyRestroom: row.family_restroom,
    genderNeutral: row.gender_neutral,
    operationalStatus: row.operational_status,
    evidenceStatus: row.evidence_status,
    source: 'supabase',
  }
}

export async function loadRestrooms() {
  if (supabase) {
    const { data, error } = await supabase
      .from('restrooms')
      .select('id, seed_id, name, zone, address, entrance_latitude, entrance_longitude, entrance_notes, access_type, requires_purchase, requires_ticket, venue_hours_text, wheelchair_access, changing_table, family_restroom, gender_neutral, operational_status, evidence_status')
      .order('seed_id')
    if (!error && data?.length) {
      const usable = (data as DatabaseRestroom[]).map(mapDatabaseRestroom).filter((row): row is Restroom => row !== null)
      if (usable.length) return { restrooms: usable, source: 'supabase' as const }
    }
  }
  return { restrooms: demoRestrooms, source: 'demo' as const }
}

export function distanceMeters(from: { latitude: number; longitude: number }, to: Restroom) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const earthRadius = 6_371_000
  const latitudeDelta = radians(to.latitude - from.latitude)
  const longitudeDelta = radians(to.longitude - from.longitude)
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function accessLabel(restroom: Restroom) {
  if (restroom.requiresTicket) return 'Pase requerido'
  if (restroom.requiresPurchase) return 'Compra requerida'
  if (restroom.accessType === 'public') return 'Acceso público'
  if (restroom.accessType === 'venue_visitors') return 'Dentro del lugar'
  return 'Acceso por confirmar'
}

export function directionsUrl(restroom: Restroom) {
  const destination = encodeURIComponent(`${restroom.latitude},${restroom.longitude}`)
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`
}
