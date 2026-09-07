import { useEffect, useMemo, useState } from 'react'
import useAuth from './useAuth'
import { subscribeToConversations } from '../services/chatService'
import { countUnreadConversations } from '../lib/chatUnread'

// Realtime conversation list for the current user, role-aware (candidate
// queries by candidateId, employer by employerId — see chatService). Used
// both by the Chat list pages and by the layouts for the nav unread badge;
// each caller gets its own onSnapshot subscription (this app has no
// shared cross-page state mechanism beyond the notifications Outlet
// context, which this deliberately doesn't touch — see CandidateLayout).
export default function useConversations() {
  const { user, role } = useAuth()
  const isValidUser = Boolean(user) && (role === 'candidate' || role === 'employer')
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // No setState here for the "not signed in / role not resolved yet"
    // case -- the returned values below are derived straight from
    // `isValidUser` at render time instead, so this effect only ever does
    // the one thing an effect should: synchronize with the external
    // Firestore listener.
    if (!isValidUser) return undefined

    function begin() {
      setLoading(true)
      setError(null)
    }
    begin()

    const unsubscribe = subscribeToConversations(
      user.uid,
      role,
      (list) => {
        setConversations(list)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [user, role, isValidUser])

  const unreadCount = useMemo(() => countUnreadConversations(conversations, user?.uid), [conversations, user])

  return {
    conversations: isValidUser ? conversations : [],
    unreadCount: isValidUser ? unreadCount : 0,
    loading: isValidUser ? loading : false,
    error: isValidUser ? error : null,
  }
}
