import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import FilterChip from '../ui/FilterChip'
import FormField from '../auth/FormField'
import { JOB_LOCATIONS, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from '../../lib/jobOptions'

function toggleInArray(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

export default function JobAlertPreferencesForm({ preferences, onSave, saving }) {
  const [form, setForm] = useState(() => ({
    enabled: preferences?.enabled ?? true,
    jobTypes: preferences?.jobTypes || [],
    workModes: preferences?.workModes || [],
    locations: preferences?.locations || [],
    skills: (preferences?.skills || []).join(', '),
    experienceLevel: preferences?.experienceLevel || '',
  }))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    try {
      await onSave({
        enabled: form.enabled,
        jobTypes: form.jobTypes,
        workModes: form.workModes,
        locations: form.locations,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
        experienceLevel: form.experienceLevel || null,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3.5 shadow-soft">
        <div>
          <p className="text-[13px] font-bold text-navy-900">Job Alerts</p>
          <p className="text-xs text-navy-500">
            {form.enabled ? 'You will be notified about matching jobs.' : 'Alerts are currently off.'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.enabled}
          aria-label="Enable job alerts"
          onClick={() => update('enabled', !form.enabled)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${form.enabled ? 'bg-primary-600' : 'bg-slate-200'}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform ${
              form.enabled ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div>
        <p className="text-[11px] font-bold text-navy-700">Job Types</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {JOB_TYPES.map((t) => (
            <FilterChip key={t} label={t} active={form.jobTypes.includes(t)} onClick={() => update('jobTypes', toggleInArray(form.jobTypes, t))} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-navy-700">Work Modes</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {WORK_MODES.map((m) => (
            <FilterChip key={m} label={m} active={form.workModes.includes(m)} onClick={() => update('workModes', toggleInArray(form.workModes, m))} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-navy-700">Locations</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {JOB_LOCATIONS.map((l) => (
            <FilterChip key={l} label={l} active={form.locations.includes(l)} onClick={() => update('locations', toggleInArray(form.locations, l))} />
          ))}
        </div>
      </div>

      <FormField
        label="Skills (comma separated)"
        value={form.skills}
        onChange={(e) => update('skills', e.target.value)}
        placeholder="React, Sales, Excel"
      />

      <div>
        <label className="text-[11px] font-bold text-navy-700" htmlFor="job-alert-experience-level">
          Experience Level
        </label>
        <select
          id="job-alert-experience-level"
          value={form.experienceLevel}
          onChange={(e) => update('experienceLevel', e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Any experience level</option>
          {EXPERIENCE_LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
          <AlertCircle size={13} /> {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-success-700">
          <CheckCircle2 size={13} /> Preferences saved.
        </p>
      )}

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </form>
  )
}
