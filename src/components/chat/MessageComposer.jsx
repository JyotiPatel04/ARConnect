import { useState } from 'react'
import { Send } from 'lucide-react'
import { prepareMessageText } from '../../lib/chatMessage'

// `sending` (from useConversationMessages) both disables the button AND
// guards against a double-click firing two sends — the hook itself also
// guards this synchronously, this is just the visible half of it.
export default function MessageComposer({ onSend, sending, disabled }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  const canSend = Boolean(prepareMessageText(text)) && !sending && !disabled

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSend) return
    setError('')
    const toSend = text
    setText('')
    try {
      await onSend(toSend)
    } catch (err) {
      setText(toSend)
      setError(err.message || 'Message could not be sent. Please try again.')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-white p-3">
      {error && <p className="mb-1.5 text-[11px] font-semibold text-red-600">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'You cannot send messages in this conversation.' : 'Type a message...'}
          rows={1}
          disabled={disabled}
          aria-label="Message"
          className="max-h-28 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] text-navy-800 focus:border-primary-400 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  )
}
