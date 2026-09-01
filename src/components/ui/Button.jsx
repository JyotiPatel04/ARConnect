const variants = {
  primary:
    'bg-primary-600 text-white hover:bg-primary-700 shadow-soft',
  secondary:
    'bg-white text-navy-800 border border-slate-200 hover:border-slate-300 shadow-soft',
  success:
    'bg-success-600 text-white hover:bg-success-700 shadow-soft',
  ghost: 'bg-transparent text-navy-700 hover:bg-slate-100',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
}

const sizes = {
  sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-[15px] px-5 py-3 rounded-xl gap-2',
}

export default function Button({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2.25} />}
      {children}
    </button>
  )
}
