import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { getMyCompanyProfile, upsertMyCompanyProfile } from '../services/companyProfileService'

export default function useCompanyProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await getMyCompanyProfile(user.uid)
        if (!cancelled) setProfile(data)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [user, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  const saveProfile = useCallback(
    async (data) => {
      if (!user) throw new Error('You must be signed in.')
      setSaving(true)
      try {
        // Same reasoning as useCandidateProfile: update local state
        // directly from the write result rather than refetch(), which
        // would flip loading back to true and unmount the form before its
        // own success message could render.
        const saved = await upsertMyCompanyProfile(user.uid, data)
        setProfile(saved)
      } finally {
        setSaving(false)
      }
    },
    [user]
  )

  return { profile, loading, error, saving, refetch, saveProfile }
}
