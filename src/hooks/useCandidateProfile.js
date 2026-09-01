import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { getMyProfile, upsertMyProfile } from '../services/candidateProfileService'

export default function useCandidateProfile() {
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
        const data = await getMyProfile(user.uid)
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
        // Update local state directly from the write result rather than
        // calling refetch() — refetch() flips `loading` back to true,
        // which unmounts <ProfileForm> (CandidateProfilePage swaps it for
        // "Loading profile...") before its own "Profile saved" message
        // ever has a chance to render.
        const saved = await upsertMyProfile(user.uid, data)
        setProfile(saved)
      } finally {
        setSaving(false)
      }
    },
    [user]
  )

  return { profile, loading, error, saving, refetch, saveProfile }
}
