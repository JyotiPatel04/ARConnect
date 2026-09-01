export default function FormField({ label, type = 'text', value, onChange, placeholder, required, autoComplete }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold text-navy-700">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 placeholder:text-navy-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  )
}
