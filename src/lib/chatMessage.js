// Kept in sync with the message-create rule's size cap in firestore.rules
// (see messages/{messageId}) -- this is the friendly client-side check,
// not the real boundary, same relationship every other form in this app
// has with its own rules-layer backstop.
export const MESSAGE_MAX_LENGTH = 2000

// Returns the trimmed, ready-to-send text, or null if the message
// shouldn't be sent (empty/whitespace-only, or over the length cap).
export function prepareMessageText(rawText) {
  const trimmed = (rawText || '').trim()
  if (!trimmed) return null
  if (trimmed.length > MESSAGE_MAX_LENGTH) return null
  return trimmed
}
