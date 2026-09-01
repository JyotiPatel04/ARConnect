import { useState } from 'react'
import FormField from '../auth/FormField'
import AuthAlert from '../auth/AuthAlert'
import Button from '../ui/Button'
import { JOB_LOCATIONS, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from '../../lib/jobOptions'
import { EMPTY_JOB_FORM_VALUES, parseJobFormValues, validateJobFormValues } from '../../lib/jobForm'

function SelectField({ label, value, onChange, options }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold text-navy-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

function TextAreaField({ label, value, onChange, placeholder, rows = 3 }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div>
      <label htmlFor={id} className="text-[11px] font-bold text-navy-700">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 placeholder:text-navy-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      />
    </div>
  )
}

export default function JobForm({ initialValues, onSubmit, submitLabel = 'Publish Job', submitting = false }) {
  const [values, setValues] = useState({ ...EMPTY_JOB_FORM_VALUES, ...initialValues })
  const [error, setError] = useState('')

  function set(key) {
    return (e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validateJobFormValues(values)
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    try {
      await onSubmit(parseJobFormValues(values))
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {error && <AuthAlert type="error">{error}</AuthAlert>}

      <FormField label="Job Title" value={values.title} onChange={set('title')} placeholder="e.g. Sales Executive" required />
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Company Name" value={values.companyName} onChange={set('companyName')} placeholder="e.g. ABC Pvt Ltd" required />
        <FormField
          label="Company Logo URL (optional)"
          value={values.companyLogoUrl}
          onChange={set('companyLogoUrl')}
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Location" value={values.location} onChange={set('location')} options={JOB_LOCATIONS} />
        <SelectField label="Job Type" value={values.jobType} onChange={set('jobType')} options={JOB_TYPES} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Work Mode" value={values.workMode} onChange={set('workMode')} options={WORK_MODES} />
        <SelectField label="Experience Level" value={values.experienceLevel} onChange={set('experienceLevel')} options={EXPERIENCE_LEVELS} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Min Salary (₹/month)" type="number" value={values.salaryMin} onChange={set('salaryMin')} placeholder="18000" required />
        <FormField label="Max Salary (₹/month)" type="number" value={values.salaryMax} onChange={set('salaryMax')} placeholder="25000" required />
      </div>

      <FormField label="Skills (comma separated)" value={values.skills} onChange={set('skills')} placeholder="Sales, Communication, Field Work" required />

      <TextAreaField label="Description" value={values.description} onChange={set('description')} placeholder="Describe the role..." rows={3} />
      <TextAreaField
        label="Responsibilities (one per line)"
        value={values.responsibilities}
        onChange={set('responsibilities')}
        placeholder={'Visit local shops and generate leads\nMeet weekly sales targets'}
        rows={3}
      />
      <TextAreaField
        label="Requirements (one per line)"
        value={values.requirements}
        onChange={set('requirements')}
        placeholder={'12th Pass\n0-2 years experience'}
        rows={3}
      />

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  )
}
