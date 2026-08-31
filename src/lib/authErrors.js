export function mapAuthError(error) {
  const message = error?.message || ''

  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.'
  if (/email not confirmed/i.test(message)) return 'Please confirm your email before logging in.'
  if (/already registered|already exists|user already/i.test(message)) {
    return 'This email is already registered. Try logging in instead.'
  }
  if (/password.*(at least|should be|characters)/i.test(message)) {
    return message
  }
  if (/rate limit/i.test(message)) return 'Too many attempts. Please wait a moment and try again.'

  return message || 'Something went wrong. Please try again.'
}

export const roleRedirects = {
  candidate: '/candidate/home',
  employer: '/employer',
  admin: '/admin',
}
