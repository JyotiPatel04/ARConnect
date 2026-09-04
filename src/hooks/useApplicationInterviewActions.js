import { useCallback, useState } from 'react'
import { cancelInterview, completeInterview, scheduleInterview, updateInterview } from '../services/interviewService'

// Phase 17 P2: replaces the old useApplicationInterview, which fetched its
// own interview data per row (the N+1 pattern fixed in
// useEmployerApplications). This hook only owns the MUTATIONS -- `interview`
// is now passed in as a prop (looked up once, batched, by the parent page),
// and `onChange` is the parent's refetch, called after any successful write
// so the batched data stays in sync.
export default function useApplicationInterviewActions(application, interview, onChange) {
  const [saving, setSaving] = useState(false)

  const schedule = useCallback(
    async (fields) => {
      setSaving(true)
      try {
        await scheduleInterview(application, fields)
        onChange()
      } finally {
        setSaving(false)
      }
    },
    [application, onChange]
  )

  const edit = useCallback(
    async (fields) => {
      setSaving(true)
      try {
        await updateInterview(interview, fields)
        onChange()
      } finally {
        setSaving(false)
      }
    },
    [interview, onChange]
  )

  const cancel = useCallback(async () => {
    setSaving(true)
    try {
      await cancelInterview(interview)
      onChange()
    } finally {
      setSaving(false)
    }
  }, [interview, onChange])

  const complete = useCallback(async () => {
    setSaving(true)
    try {
      await completeInterview(interview)
      onChange()
    } finally {
      setSaving(false)
    }
  }, [interview, onChange])

  return { saving, schedule, edit, cancel, complete }
}
