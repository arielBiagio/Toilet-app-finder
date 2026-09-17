export type RadarCandidate = {
  id: string
  complexId: string | null
  publicationStatus: 'published' | 'draft' | 'archived'
  operationalStatus: 'operating' | 'unknown' | 'temporarily_closed' | 'permanently_closed'
  accessType: 'public' | 'venue_visitors' | 'customers' | 'permission_required' | 'private' | 'unknown'
  requiresTicket: boolean | null
  hasReviewedEntrance: boolean
  wheelchairAccess: 'yes' | 'limited' | 'no' | 'unknown'
  openAtArrival: boolean | null
  distanceMeters: number
}

export function selectRadarCandidates(candidates: RadarCandidate[], requiresAccessibility: boolean) {
  const eligible = candidates.filter((candidate) =>
    candidate.publicationStatus === 'published'
    && candidate.operationalStatus === 'operating'
    && candidate.hasReviewedEntrance
    && candidate.requiresTicket !== true
    && !['customers', 'permission_required', 'private'].includes(candidate.accessType)
    && candidate.openAtArrival === true
    && (!requiresAccessibility || candidate.wheelchairAccess === 'yes'),
  )

  const distinctComplexes = new Set<string>()
  return eligible
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .filter((candidate) => {
      const complex = candidate.complexId ?? candidate.id
      if (distinctComplexes.has(complex)) return false
      distinctComplexes.add(complex)
      return true
    })
    .slice(0, 3)
}
