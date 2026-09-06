import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, ExternalLink, FileText, Trash2, Upload } from 'lucide-react'
import Button from '../ui/Button'
import useAuth from '../../hooks/useAuth'
import useResumeUpload from '../../hooks/useResumeUpload'

const ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

// Lives in the Candidate Profile page's existing "Resume" summary card,
// alongside (not replacing) ProfileForm's legacy resumeLink URL field —
// see candidateProfileService.js and the Phase 20 report for why both are
// kept: an uploaded file is a strict upgrade when it's usable, but Storage
// requires the project to be on the Blaze plan, so the zero-cost URL
// fallback stays fully supported regardless of whether that's ever enabled.
export default function ResumeUploadCard({ candidateProfile, onChange }) {
  const { user } = useAuth()
  const { uploading, progress, error, upload, remove } = useResumeUpload(onChange)
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef(null)

  const hasFile = Boolean(candidateProfile?.resumeFileUrl)

  function openPicker() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    // Reset immediately so choosing the SAME file again later still fires
    // a change event.
    e.target.value = ''
    if (!file) return
    setSuccess('')
    try {
      await upload(user.uid, file, candidateProfile?.resumeFilePath)
      setSuccess(hasFile ? 'Resume replaced.' : 'Resume uploaded.')
    } catch {
      // error is already surfaced via the hook's error state
    }
  }

  async function handleRemove() {
    if (!hasFile) return
    setSuccess('')
    try {
      await remove(user.uid, candidateProfile.resumeFilePath)
      setSuccess('Resume removed.')
    } catch {
      // error is already surfaced via the hook's error state
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-navy-900">Resume</p>
        <FileText size={16} className="text-primary-600" />
      </div>

      {hasFile ? (
        <div className="mt-2">
          <p className="truncate text-xs font-semibold text-navy-700">{candidateProfile.resumeFileName}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={candidateProfile.resumeFileUrl} target="_blank" rel="noreferrer noopener">
              <Button type="button" size="sm" variant="secondary" icon={ExternalLink}>
                View
              </Button>
            </a>
            <Button type="button" size="sm" variant="secondary" icon={Upload} onClick={openPicker} disabled={uploading}>
              Replace
            </Button>
            <Button type="button" size="sm" variant="danger" icon={Trash2} onClick={handleRemove} disabled={uploading}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2">
          {candidateProfile?.resumeLink ? (
            <p className="text-xs text-navy-500">
              You have a resume link saved below. You can also upload a file here instead.
            </p>
          ) : (
            <p className="text-xs text-navy-500">No resume uploaded yet.</p>
          )}
          <Button type="button" size="sm" icon={Upload} className="mt-2" onClick={openPicker} disabled={uploading}>
            Upload Resume
          </Button>
        </div>
      )}

      {uploading && (
        <div className="mt-2.5">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Resume upload progress"
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
          >
            <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-navy-400">Uploading... {progress}%</p>
        </div>
      )}

      {!uploading && success && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-success-600" role="status">
          <CheckCircle2 size={12} /> {success}
        </p>
      )}

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-red-600" role="alert">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      <p className="mt-2 text-[10.5px] text-navy-400">PDF, DOC, or DOCX — up to 5MB.</p>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileSelected}
        aria-label="Upload resume file"
        className="hidden"
      />
    </div>
  )
}
