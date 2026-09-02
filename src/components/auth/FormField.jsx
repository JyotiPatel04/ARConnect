export default function FormField({
  label,
  type = 'text',
  as = 'input',
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
  min,
  max,
  step,
  maxLength,
  rows = 3,
  error,
}) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const sharedClassName = `mt-1 w-full rounded-lg border px-3 py-2.5 text-[13px] text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-1 ${
    error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500'
  }`

  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold text-navy-700">
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          rows={rows}
          className={`${sharedClassName} resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          className={sharedClassName}
        />
      )}
      {error && (
        <p className="mt-1 text-[11px] font-semibold text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
