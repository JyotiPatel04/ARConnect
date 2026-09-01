const messagesByCode = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/user-disabled': 'This account has been disabled.',
}

export function mapAuthError(error) {
  const code = error?.code || ''
  return messagesByCode[code] || error?.message || 'Something went wrong. Please try again.'
}

export const roleRedirects = {
  candidate: '/candidate/home',
  employer: '/employer',
  admin: '/admin',
}
