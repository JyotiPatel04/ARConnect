import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth'
import {
  createJob as createJobService,
  deleteJob as deleteJobService,
  listJobsByEmployer,
  setJobStatus,
  updateJob as updateJobService,
} from '../services/employerJobService'

export default function useEmployerJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!user) {
        setJobs([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await listJobsByEmployer(user.uid)
        if (!cancelled) setJobs(data)
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

  const createJob = useCallback(
    async (fields) => {
      if (!user) throw new Error('You must be signed in to post a job.')
      const jobId = await createJobService({ employerId: user.uid, ...fields })
      refetch()
      return jobId
    },
    [user, refetch]
  )

  const updateJob = useCallback(
    async (jobId, fields) => {
      await updateJobService(jobId, fields)
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...fields } : j)))
    },
    []
  )

  const closeJob = useCallback(async (jobId) => {
    await setJobStatus(jobId, 'closed')
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'closed' } : j)))
  }, [])

  const reopenJob = useCallback(async (jobId) => {
    await setJobStatus(jobId, 'active')
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'active' } : j)))
  }, [])

  const deleteJob = useCallback(async (jobId) => {
    await deleteJobService(jobId)
    setJobs((prev) => prev.filter((j) => j.id !== jobId))
  }, [])

  return { jobs, loading, error, refetch, createJob, updateJob, closeJob, reopenJob, deleteJob }
}
