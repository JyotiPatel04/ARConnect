import { Component } from 'react'

// Phase 17 P1: without this, ANY unhandled render-phase exception anywhere
// in the tree (a Firestore doc with an unexpected field shape, a null
// reference, ...) unmounts the whole app, leaving the user looking at a
// blank white screen with no message and no way to recover short of
// remembering to hit reload themselves. This is the top-level catch-all —
// wraps <App/> in main.jsx, above the router/auth provider, so it can
// catch a render error anywhere, including inside AuthProvider itself.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // No external monitoring SDK yet (deliberately out of scope for this
    // batch) — console.error is the same best-effort logging pattern
    // already used elsewhere in this codebase (e.g. AuthContext's failed
    // profile fetch).
    console.error('[ErrorBoundary] unhandled render error', error, errorInfo)
  }

  handleTryAgain = () => {
    this.setState({ hasError: false })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f4f5f9] px-6 text-center">
          <p className="text-lg font-bold text-navy-900">Something went wrong</p>
          <p className="max-w-xs text-sm text-navy-500">
            We hit an unexpected error. You can try again, or reload the page if that doesn&apos;t help.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={this.handleTryAgain}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-bold text-navy-800"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-lg bg-primary-600 px-4 py-2.5 text-[13px] font-bold text-white"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
