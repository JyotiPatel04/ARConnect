import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { validateResumeFile } from '../lib/resumeValidation'

// Timestamp-prefixed so replacing a resume never collides with (or
// silently overwrites) the previous file -- the old object is removed
// separately, only after the new one is safely uploaded and referenced.
function resumeStoragePath(uid, fileName) {
  return `resumes/${uid}/${Date.now()}_${fileName}`
}

// Uploads a new resume file, then updates candidateProfiles/{uid} with its
// metadata via a MERGE write (never a full setDoc) so this can never wipe
// out the rest of the candidate's profile -- see
// candidateProfileService.js's upsertMyProfile for the other half of this:
// it carries these same fields forward unchanged on every ordinary profile
// save, since it doesn't know anything about file state.
//
// previousPath (optional) is only deleted AFTER the new file is uploaded
// and the profile doc points to it -- so a failure partway through never
// leaves the candidate with no resume at all.
//
// Returns a plain, immediately-renderable patch (a JS Date standing in for
// the serverTimestamp() sentinel actually written) so the caller can merge
// it into local state directly -- same reasoning as
// candidateProfileService.js's upsertMyProfile returning its own local
// `now` proxy instead of making the caller re-fetch (re-fetching would
// flip `loading` back to true and unmount whatever's conditionally
// rendered on it, including this component itself, before its own success
// message could ever be seen).
export async function uploadResumeFile(uid, file, previousPath, onProgress) {
  const validationError = validateResumeFile(file)
  if (validationError) throw new Error(validationError)

  const path = resumeStoragePath(uid, file.name)
  const storageRef = ref(storage, path)

  await new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, { contentType: file.type || 'application/octet-stream' })
    task.on(
      'state_changed',
      (snapshot) => {
        onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
      },
      reject,
      resolve
    )
  })

  const fileUrl = await getDownloadURL(storageRef)

  await setDoc(
    doc(db, 'candidateProfiles', uid),
    {
      candidateId: uid,
      resumeFileName: file.name,
      resumeFileUrl: fileUrl,
      resumeFilePath: path,
      resumeUploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  if (previousPath && previousPath !== path) {
    // Best-effort cleanup -- the profile already correctly points at the
    // new file regardless of whether this succeeds.
    deleteObject(ref(storage, previousPath)).catch(() => {})
  }

  return { resumeFileName: file.name, resumeFileUrl: fileUrl, resumeFilePath: path, resumeUploadedAt: new Date() }
}

export async function deleteResumeFile(uid, path) {
  if (path) {
    await deleteObject(ref(storage, path))
  }
  await setDoc(
    doc(db, 'candidateProfiles', uid),
    {
      candidateId: uid,
      resumeFileName: null,
      resumeFileUrl: null,
      resumeFilePath: null,
      resumeUploadedAt: null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )

  return { resumeFileName: null, resumeFileUrl: null, resumeFilePath: null, resumeUploadedAt: null }
}
