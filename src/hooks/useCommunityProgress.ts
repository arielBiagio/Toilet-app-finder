import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

type CommunityProgress = {
  approvedContributions: number
  verifiedVisits: number
  badgeKeys: string[]
}

const emptyProgress: CommunityProgress = {
  approvedContributions: 0,
  verifiedVisits: 0,
  badgeKeys: [],
}

export function useCommunityProgress() {
  const { user } = useAuth()
  const [progress, setProgress] = useState<CommunityProgress>(emptyProgress)

  useEffect(() => {
    if (!supabase || !user) {
      setProgress(emptyProgress)
      return
    }
    let active = true

    Promise.all([
      supabase.from('restroom_reports').select('id', { count: 'exact', head: true }).eq('reporter_id', user.id).eq('status', 'approved'),
      supabase.from('restroom_reports').select('id', { count: 'exact', head: true }).eq('reporter_id', user.id).eq('status', 'approved').eq('report_type', 'could_use'),
      supabase.from('restroom_reviews').select('id', { count: 'exact', head: true }).eq('author_id', user.id).eq('status', 'approved'),
      supabase.from('user_badges').select('badge_key').eq('user_id', user.id),
    ]).then(([reports, visits, reviews, badges]) => {
      if (!active || reports.error || visits.error || reviews.error || badges.error) return
      setProgress({
        approvedContributions: (reports.count ?? 0) + (reviews.count ?? 0),
        verifiedVisits: visits.count ?? 0,
        badgeKeys: badges.data.map((badge) => badge.badge_key as string),
      })
    })

    return () => { active = false }
  }, [user])

  return progress
}
