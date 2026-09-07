import { AlertCircle, MessageCircle } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import PageHeader from '../../components/PageHeader'
import ConversationListItem from '../../components/chat/ConversationListItem'
import useDocumentTitle from '../../hooks/useDocumentTitle'
import useConversations from '../../hooks/useConversations'
import { hasUnreadMessage } from '../../lib/chatUnread'
import useAuth from '../../hooks/useAuth'

export default function EmployerChatPage() {
  useDocumentTitle('Chat')
  const { user } = useAuth()
  const { conversations, loading, error } = useConversations()

  return (
    <div>
      <PageHeader
        title="Chat"
        subtitle={loading ? 'Loading...' : `${conversations.length} conversation${conversations.length === 1 ? '' : 's'}`}
      />

      {loading && <p className="py-8 text-center text-sm text-navy-400">Loading conversations...</p>}

      {!loading && error && (
        <EmptyState
          icon={AlertCircle}
          tone="error"
          title="Couldn't load your conversations"
          subtitle="Please check your connection and try again."
        />
      )}

      {!loading && !error && conversations.length === 0 && (
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          subtitle="Message a candidate from your Applications list to start a conversation."
        />
      )}

      {!loading && !error && conversations.length > 0 && (
        <div className="max-w-xl space-y-2">
          {conversations.map((c) => (
            <ConversationListItem
              key={c.id}
              to={`/employer/chat/${c.id}`}
              title={c.candidateName}
              subtitle={c.jobTitle}
              preview={c.lastMessage}
              lastMessageAt={c.lastMessageAt?.toDate?.()}
              unread={hasUnreadMessage(c, user?.uid)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
