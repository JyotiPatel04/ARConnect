import { useCallback, useState } from 'react'
import { deleteResumeFile, uploadResumeFile } from '../services/resumeService'

// Deliberately independent of the big ProfileForm/useCandidateProfile save
// cycle -- a File object can't flow through that form's plain-values
// onSave(values) contract, and immediate upload/replace/remove (rather
// than "staged until you hit Save Profile") is the clearer, more standard
// UX for a file control anyway. `onChange` receives the resulting resume
// field patch directly (see resumeService.js) so the caller can merge it
// into local state (e.g. useCandidateProfile's applyLocalUpdate) — NOT a
// bare refetch, which would flip `loading` back to true and unmount
// whatever's conditionally rendered on it (including this very component)
// before its own success message could ever be seen.
export default function useResumeUpload(onChange) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const upload = useCallback(
    async (uid, file, previousPath) => {
      setError('')
      setProgress(0)
      setUploading(true)
      try {
        const patch = await uploadResumeFile(uid, file, previousPath, setProgress)
        onChange?.(patch)
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.')
        throw err
      } finally {
        setUploading(false)
      }
    },
    [onChange]
  )

  const remove = useCallback(
    async (uid, path) => {
      setError('')
      setUploading(true)
      try {
        const patch = await deleteResumeFile(uid, path)
        onChange?.(patch)
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.')
        throw err
      } finally {
        setUploading(false)
      }
    },
    [onChange]
  )

  return { uploading, progress, error, upload, remove }
}
