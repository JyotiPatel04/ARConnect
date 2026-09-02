import { useCallback, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    isFirebaseConfigured,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
