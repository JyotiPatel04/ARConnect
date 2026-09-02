import { useCallback, useEffect, useState } from 'react'
import {
  cancelInterview,
  completeInterview,
  getLatestInterviewForApplication,
  scheduleInterview,
  updateInterview,
} from '../services/interviewService'

// Per-application interview lookup — same "one query per visible row"
// pattern already used by useJobMatch in ApplicationRow. An application
// can accumulate more than one interview over time (e.g. a cancelled
// first round, then a freshly scheduled second round); this always
// reflects the most recently created one.
export default function useApplicationInterview(application) {
  const [interview, setInterview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!application?.id) {
        setInterview(null)
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await getLatestInterviewForApplication(application.id, application.employerId)
        if (!cancelled) setInterview(data)
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
  }, [application?.id, application?.employerId, reloadKey])

  const refetch = useCallback(() => setReloadKey((k) => k + 1), [])

  const schedule = useCallback(
    async (fields) => {
      setSaving(true)
      try {
        await scheduleInterview(application, fields)
        refetch()
      } finally {
        setSaving(false)
      }
    },
    [application, refetch]
  )

  const edit = useCallback(
    async (fields) => {
      setSaving(true)
      try {
        await updateInterview(interview, fields)
        refetch()
      } finally {
        setSaving(false)
      }
    },
    [interview, refetch]
  )

  const cancel = useCallback(async () => {
    setSaving(true)
    try {
      await cancelInterview(interview)
      refetch()
    } finally {
      setSaving(false)
    }
  }, [interview, refetch])

  const complete = useCallback(async () => {
    setSaving(true)
    try {
      await completeInterview(interview)
      refetch()
    } finally {
      setSaving(false)
    }
  }, [interview, refetch])

  return { interview, loading, error, saving, refetch, schedule, edit, cancel, complete }
}
