export const MODERATION_REASON_MIN_LENGTH = 3
export const MODERATION_REASON_MAX_LENGTH = 500

export function isValidModerationReason(reason) {
  const trimmed = reason.trim()
  return trimmed.length >= MODERATION_REASON_MIN_LENGTH && trimmed.length <= MODERATION_REASON_MAX_LENGTH
}
