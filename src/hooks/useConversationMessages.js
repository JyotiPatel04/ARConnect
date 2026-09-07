import { useCallback, useEffect, useRef, useState } from 'react'
import useAuth from './useAuth'
import { markConversationRead, sendMessage, subscribeToMessages } from '../services/chatService'

// Realtime message thread for one conversation, plus the send action and
// the read-pointer bump. Takes the conversation object (from useConversation)
// rather than re-fetching it, so this never needs its own second read of
// the conversation doc just to know who's who.
export default function useConversationMessages(conversationId, conversation) {
  const { user, role } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState(null)

  useEffect(() => {
    // No setState here for the "nothing to subscribe to" case -- the
    // returned `messages`/`loading`/`error` below are derived straight
    // from `conversationId` at render time instead, so this effect only
    // ever does the one thing an effect should: synchronize with the
    // external Firestore listener.
    if (!conversationId) return undefined

    function begin() {
      setLoading(true)
      setError(null)
    }
    begin()

    const unsubscribe = subscribeToMessages(
      conversationId,
      (list) => {
        setMessages(list)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [conversationId])

  // Marks the conversation read whenever it (or a fresh incoming message)
  // makes it newly unread while this thread is open — markConversationRead
  // itself is a no-op write when there's nothing new, so this can safely
  // re-run on every message-list update without spamming Firestore.
  useEffect(() => {
    if (!conversation || !user || !role) return
    markConversationRead(conversation, user.uid, role).catch((err) => {
      console.error('[chat] failed to mark conversation read', err)
    })
  }, [conversation, user, role, messages.length])

  // Guards against a double-click firing two sends for the same click —
  // `sending` is set synchronously before the first await, so a second
  // click while a send is in flight is a no-op.
  const sendingRef = useRef(false)
  const send = useCallback(
    async (text) => {
      if (sendingRef.current || !conversation || !user) return
      sendingRef.current = true
      setSending(true)
      setSendError(null)
      try {
        await sendMessage(conversation, user.uid, role, text)
      } catch (err) {
        setSendError(err)
        throw err
      } finally {
        sendingRef.current = false
        setSending(false)
      }
    },
    [conversation, user, role]
  )

  return {
    messages: conversationId ? messages : [],
    loading: conversationId ? loading : false,
    error: conversationId ? error : null,
    sending,
    sendError,
    send,
  }
}
