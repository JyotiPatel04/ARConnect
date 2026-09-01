import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import FilterChip from '../ui/FilterChip'
import FormField from '../auth/FormField'
import { JOB_LOCATIONS, JOB_TYPES, WORK_MODES } from '../../lib/jobOptions'

function toggleInArray(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

const emptyForm = {
  skills: '',
  experienceYears: '',
  experienceSummary: '',
  location: '',
  preferredJobTypes: [],
  preferredWorkModes: [],
  expectedSalaryMin: '',
  expectedSalaryMax: '',
  bio: '',
}

export default function ProfileForm({ profile, onSave, saving }) {
  const [form, setForm] = useState(emptyForm)
  // Tracks which `profile` reference `form` was last initialized from, so
  // the very first time a freshly-loaded profile arrives (or changes
  // identity after a save/refetch), local form state is synced from it —
  // adjusted during render rather than in an effect, per React's guidance
  // for state derived from props (avoids an extra commit-then-effect
  // render pass for what is otherwise a plain initialization).
  const [initializedFrom, setInitializedFrom] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (profile && profile !== initializedFrom) {
    setInitializedFrom(profile)
    setForm({
      skills: (profile.skills || []).join(', '),
      experienceYears: profile.experienceYears ?? '',
      experienceSummary: profile.experienceSummary || '',
      location: profile.location || '',
      preferredJobTypes: profile.preferredJobTypes || [],
      preferredWorkModes: profile.preferredWorkModes || [],
      expectedSalaryMin: profile.expectedSalaryMin ?? '',
      expectedSalaryMax: profile.expectedSalaryMax ?? '',
      bio: profile.bio || '',
    })
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const salaryMin = form.expectedSalaryMin === '' ? null : Number(form.expectedSalaryMin)
    const salaryMax = form.expectedSalaryMax === '' ? null : Number(form.expectedSalaryMax)
    if (salaryMin != null && salaryMax != null && salaryMin > salaryMax) {
      setError('Minimum expected salary cannot be higher than maximum.')
      return
    }

    try {
      await onSave({
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
        experienceSummary: form.experienceSummary,
        location: form.location,
        preferredJobTypes: form.preferredJobTypes,
        preferredWorkModes: form.preferredWorkModes,
        expectedSalaryMin: salaryMin,
        expectedSalaryMax: salaryMax,
        bio: form.bio,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-[13px] font-bold text-navy-900">Match Profile</h2>
      <p className="-mt-2 text-xs text-navy-500">
        Fill this in so ARConnect can compute a real match score for jobs you view.
      </p>

      {error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          <AlertCircle size={13} /> {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
          <CheckCircle2 size={13} /> Profile saved.
        </p>
      )}

      <FormField
        label="Skills (comma separated)"
        value={form.skills}
        onChange={(e) => update('skills', e.target.value)}
        placeholder="Sales, Communication, MS Excel"
      />

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Years of Experience"
          type="number"
          value={form.experienceYears}
          onChange={(e) => update('experienceYears', e.target.value)}
          placeholder="2"
        />
        <div>
          <label className="text-[11px] font-bold text-navy-700">Location</label>
          <select
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Select city</option>
            {JOB_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FormField
        label="Experience Summary (optional)"
        value={form.experienceSummary}
        onChange={(e) => update('experienceSummary', e.target.value)}
        placeholder="2 years in retail sales"
      />

      <div>
        <p className="text-[11px] font-bold text-navy-700">Preferred Job Type</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {JOB_TYPES.map((t) => (
            <FilterChip
              key={t}
              label={t}
              active={form.preferredJobTypes.includes(t)}
              onClick={() => update('preferredJobTypes', toggleInArray(form.preferredJobTypes, t))}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-navy-700">Preferred Work Mode</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {WORK_MODES.map((m) => (
            <FilterChip
              key={m}
              label={m}
              active={form.preferredWorkModes.includes(m)}
              onClick={() => update('preferredWorkModes', toggleInArray(form.preferredWorkModes, m))}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Min Salary Expected (₹/month)"
          type="number"
          value={form.expectedSalaryMin}
          onChange={(e) => update('expectedSalaryMin', e.target.value)}
          placeholder="18000"
        />
        <FormField
          label="Max Salary Expected (₹/month)"
          type="number"
          value={form.expectedSalaryMax}
          onChange={(e) => update('expectedSalaryMax', e.target.value)}
          placeholder="25000"
        />
      </div>

      <FormField
        label="Short Bio (optional)"
        value={form.bio}
        onChange={(e) => update('bio', e.target.value)}
        placeholder="Hardworking sales professional looking for growth."
      />

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  )
}
