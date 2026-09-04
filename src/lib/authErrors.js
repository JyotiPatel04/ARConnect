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

// Base path each role's routes live under (see App.jsx). Used to check a
// post-login redirect target actually belongs to the freshly-authenticated
// user's own role before honoring it — ProtectedRoute stashes the path a
// signed-out visitor was trying to reach as `location.state.from`, but that
// path was chosen before anyone knew which account would end up logging
// in. A visitor who clicks the wrong portal's link (or is switching
// between their own candidate and employer accounts) still authenticates
// successfully; without this check they'd be sent straight into a route
// their real role can't access and bounce off ProtectedRoute a second
// time, landing on /unauthorized instead of their dashboard.
const roleBasePaths = {
  candidate: '/candidate',
  employer: '/employer',
  admin: '/admin',
}

export function isPathAllowedForRole(path, role) {
  const base = roleBasePaths[role]
  return Boolean(path && base && path.startsWith(base))
}
