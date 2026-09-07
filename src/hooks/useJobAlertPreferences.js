import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import { getMyJobAlertPreferences, upsertMyJobAlertPreferences } from '../services/jobAlertService'

// Loads and saves the current candidate's OWN job-alert preferences only --
// getMyJobAlertPreferences/upsertMyJobAlertPreferences both always target
// doc(jobAlertPreferences, user.uid), so there is no code path here that
// could ever read or write another candidate's document.
export default function useJobAlertPreferences() {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    // No setState here for the "not signed in" case -- the returned
    // `preferences`/`loading`/`error` below are derived straight from
    // `user` at render time instead, same pattern as the Chat hooks.
    if (!user) return undefined

    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const data = await getMyJobAlertPreferences(user.uid)
        if (!cancelled) setPreferences(data)
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
  }, [user])

  // Returns the saved preferences directly (see upsertMyJobAlertPreferences)
  // so the caller can update local state from a known-successful write
  // instead of re-fetching -- re-fetching would flip `loading` back to
  // true and unmount whatever's conditionally rendered on it, the same
  // stale-unmount hazard already documented for saveProfile/resume upload.
  const save = useCallback(
    async (data) => {
      if (!user) throw new Error('You must be signed in.')
      setSaving(true)
      setSaveError(null)
      try {
        const saved = await upsertMyJobAlertPreferences(user.uid, data)
        setPreferences(saved)
        return saved
      } catch (err) {
        setSaveError(err)
        throw err
      } finally {
        setSaving(false)
      }
    },
    [user]
  )

  return {
    preferences: user ? preferences : null,
    loading: user ? loading : false,
    error: user ? error : null,
    saving,
    saveError,
    save,
  }
}
