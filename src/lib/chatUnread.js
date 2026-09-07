// Pure "does this conversation have something unread for ME" derivation —
// no counters, no separate read-receipt collection. A conversation only
// ever needs to know, per participant, when they last looked (candidateLastReadAt /
// employerLastReadAt) and when the last message landed (lastMessageAt) —
// unread is just "the last message is newer than my last look, and I
// didn't send it myself."
export function hasUnreadMessage(conversation, myUid) {
  if (!conversation || !conversation.lastMessageAt) return false
  if (conversation.lastMessageSenderId === myUid) return false

  const myLastReadAt = conversation.candidateId === myUid ? conversation.candidateLastReadAt : conversation.employerLastReadAt

  if (!myLastReadAt) return true

  const lastMessageMillis = conversation.lastMessageAt?.toMillis?.() ?? 0
  const myLastReadMillis = myLastReadAt?.toMillis?.() ?? 0
  return lastMessageMillis > myLastReadMillis
}

export function countUnreadConversations(conversations, myUid) {
  return conversations.filter((c) => hasUnreadMessage(c, myUid)).length
}
