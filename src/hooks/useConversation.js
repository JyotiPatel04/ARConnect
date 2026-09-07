import { useEffect, useState } from 'react'
import { subscribeToConversation } from '../services/chatService'

// Realtime single-conversation subscription — the detail-page counterpart
// to useConversations' list, same relationship as useJob(jobId)/useJobs().
export default function useConversation(conversationId) {
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // No setState here for the "nothing to subscribe to" case -- see the
    // identical note in useConversationMessages.js.
    if (!conversationId) return undefined

    function begin() {
      setLoading(true)
      setError(null)
    }
    begin()

    const unsubscribe = subscribeToConversation(
      conversationId,
      (data) => {
        setConversation(data)
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsubscribe
  }, [conversationId])

  return {
    conversation: conversationId ? conversation : null,
    loading: conversationId ? loading : false,
    error: conversationId ? error : null,
  }
}
