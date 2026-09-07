import { useEffect, useRef } from 'react'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState'
import MessageBubble from '../../components/chat/MessageBubble'
import MessageComposer from '../../components/chat/MessageComposer'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useAuth from '../../hooks/useAuth'
import useConversation from '../../hooks/useConversation'
import useConversationMessages from '../../hooks/useConversationMessages'

export default function EmployerChatConversationPage() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const { conversation, loading: conversationLoading, error: conversationError } = useConversation(conversationId)
  const { messages, loading: messagesLoading, error: messagesError, sending, send } = useConversationMessages(
    conversationId,
    conversation
  )

  useDocumentTitle(conversation?.candidateName || 'Chat')

  const endRef = useRef(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  const loading = conversationLoading || messagesLoading
  const error = conversationError || messagesError

  return (
    <div>
      <Link to="/employer/chat" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-navy-600">
        <ArrowLeft size={16} /> Back to Chat
      </Link>

      <div className="flex h-[70vh] max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="truncate text-[13px] font-bold text-navy-900">
            {conversationLoading ? 'Loading...' : conversation?.candidateName || 'Conversation'}
          </p>
          {conversation?.jobTitle && <p className="truncate text-xs text-navy-500">{conversation.jobTitle}</p>}
        </div>

        {loading && <p className="flex-1 py-8 text-center text-sm text-navy-400">Loading conversation...</p>}

        {!loading && error && (
          <div className="flex-1 px-4 py-8">
            <EmptyState
              icon={AlertCircle}
              tone="error"
              title="Couldn't load this conversation"
              subtitle="Please check your connection and try again."
            />
          </div>
        )}

        {!loading && !error && !conversation && (
          <div className="flex-1 px-4 py-8">
            <EmptyState title="Conversation not found" subtitle="This conversation may not exist, or you may not have access to it." />
          </div>
        )}

        {!loading && !error && conversation && (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto bg-[#f4f5f9] px-4 py-3">
              {messages.length === 0 && (
                <p className="py-8 text-center text-xs text-navy-400">
                  Say hello — start the conversation about {conversation.jobTitle}.
                </p>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} isMine={m.senderId === user?.uid} />
              ))}
              <div ref={endRef} />
            </div>
            <MessageComposer onSend={send} sending={sending} />
          </>
        )}
      </div>
    </div>
  )
}
