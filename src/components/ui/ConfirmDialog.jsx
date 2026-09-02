import Button from './Button'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  onConfirm,
  onCancel,
  confirming = false,
  confirmDisabled = false,
  children,
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft-lg">
        <h3 className="text-base font-bold text-navy-900">{title}</h3>
        {message && <p className="mt-2 text-sm text-navy-500">{message}</p>}
        {children && <div className="mt-3">{children}</div>}
        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={confirming}>
            Cancel
          </Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm} disabled={confirming || confirmDisabled}>
            {confirming ? 'Please wait...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
