import { useCallback, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateAuthProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [emailVerified, setEmailVerified] = useState(false)

  const fetchProfile = useCallback(async (uid) => {
    if (!uid) {
      setProfile(null)
      return
    }
    try {
      const snap = await getDoc(doc(db, 'users', uid))
      setProfile(snap.exists() ? snap.data() : null)
    } catch (err) {
      console.error('[auth] failed to load profile', err)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)
      if (nextUser) {
        // Firestore's own request-signing ID token is cached separately
        // from user.emailVerified and only auto-refreshes near its ~1hr
        // expiry — without forcing a fresh one here, a just-verified
        // account's very next write (e.g. posting a job, gated on
        // email_verified in firestore.rules) could still be evaluated
        // against a stale token whose claim predates the verification,
        // even on a brand-new page load where the UI already shows the
        // account as verified. Best-effort: a failed refresh here shouldn't
        // block loading the app.
        await nextUser.getIdToken(true).catch(() => {})
      }
      setEmailVerified(nextUser?.emailVerified ?? false)
      await fetchProfile(nextUser?.uid)
      setLoading(false)
    })

    return unsubscribe
  }, [fetchProfile])

  const signUp = useCallback(async ({ email, password, fullName, role, phone }) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)

    // Defense in depth: Firestore security rules are the real enforcement,
    // but never trust an out-of-whitelist role this far either — 'admin'
    // (or anything else) silently becomes 'candidate'.
    const safeRole = role === 'employer' ? 'employer' : 'candidate'

    await setDoc(doc(db, 'users', credential.user.uid), {
      full_name: fullName || '',
      email,
      role: safeRole,
      phone: phone || null,
      avatar_url: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })

    if (fullName) {
      updateAuthProfile(credential.user, { displayName: fullName }).catch(() => {})
    }

    // Best-effort, like the displayName update above — a failed send
    // (rare, e.g. a network blip) shouldn't block account creation, since
    // the user can always request another one via resendVerificationEmail().
    // Awaited (not fire-and-forget) so the send has actually been
    // attempted before signUp resolves, rather than racing registration's
    // own redirect.
    await sendEmailVerification(credential.user).catch(() => {})

    return credential.user
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    return credential.user
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  // Deliberately only ever accepts this fixed, known-safe field set — never
  // an arbitrary object — so this can't become a back door for changing
  // `role` (the security rules would reject that write anyway, but there's
  // no reason to even offer the shape). Firestore rules still are the real
  // enforcement; this is just keeping the client-side API honest about
  // what it's for.
  const updateProfile = useCallback(
    async ({ fullName, phone }) => {
      if (!user) throw new Error('You must be signed in.')
      const fields = {
        full_name: fullName,
        phone: phone || null,
        updated_at: serverTimestamp(),
      }
      await setDoc(doc(db, 'users', user.uid), fields, { merge: true })
      setProfile((prev) => (prev ? { ...prev, full_name: fullName, phone: phone || null } : prev))
    },
    [user]
  )

  const resetPassword = useCallback(async (email) => {
    await sendPasswordResetEmail(auth, email, {
      url: `${window.location.origin}/auth/login`,
    })
  }, [])

  // Re-sends the verification email to whoever is currently signed in —
  // used by the "Resend verification email" action on gated pages like
  // Post a Job.
  const resendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser) throw new Error('You must be signed in.')
    await sendEmailVerification(auth.currentUser)
  }, [])

  // user.reload() only refreshes LOCAL profile fields (emailVerified among
  // them) — it does NOT refresh the ID token's own email_verified claim,
  // which is what firestore.rules actually checks on a write. getIdToken(true)
  // forces a fresh token carrying the current server-side claim, so a
  // write made right after this resolves is evaluated against up-to-date
  // verification state rather than a stale token minted before the user
  // clicked the link in their inbox.
  const refreshEmailVerified = useCallback(async () => {
    if (!auth.currentUser) return
    await auth.currentUser.reload()
    await auth.currentUser.getIdToken(true)
    setEmailVerified(auth.currentUser.emailVerified)
  }, [])

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    emailVerified,
    isFirebaseConfigured,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    resendVerificationEmail,
    refreshEmailVerified,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
