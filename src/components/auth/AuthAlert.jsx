const styles = {
  error: 'bg-red-50 text-red-600',
  success: 'bg-success-50 text-success-700',
}

export default function AuthAlert({ type = 'error', children }) {
  return <div className={`rounded-lg px-3 py-2.5 text-[12.5px] font-semibold ${styles[type]}`}>{children}</div>
}
