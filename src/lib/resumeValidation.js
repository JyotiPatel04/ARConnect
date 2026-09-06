// Client-side resume file validation, checked BEFORE anything is uploaded
// to Storage. Storage rules (storage.rules) independently re-check size
// and content-type server-side -- this is the friendly first line, not the
// real enforcement boundary, same relationship every other form in this
// app has with its own rules-layer backstop.
export const RESUME_MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export const RESUME_ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const RESUME_ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']

function hasAllowedExtension(fileName) {
  const lower = (fileName || '').toLowerCase()
  return RESUME_ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

// Returns '' when the file is valid, or a user-facing error string.
// file.type can legitimately be an empty string (some browsers/OSes don't
// always report a MIME type) -- only reject on MIME type when the browser
// actually reported one and it's outside the allowlist, so a valid file
// with an unreported type isn't falsely rejected; the extension check
// still applies either way.
export function validateResumeFile(file) {
  if (!file) return 'Please choose a file to upload.'

  if (!hasAllowedExtension(file.name)) {
    return 'Resume must be a PDF, DOC, or DOCX file.'
  }

  if (file.type && !RESUME_ALLOWED_MIME_TYPES.includes(file.type)) {
    return 'Resume must be a PDF, DOC, or DOCX file.'
  }

  if (file.size > RESUME_MAX_SIZE_BYTES) {
    return 'Resume must be 5MB or smaller.'
  }

  return ''
}
