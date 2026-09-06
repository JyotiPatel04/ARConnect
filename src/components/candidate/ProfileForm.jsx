import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import FilterChip from '../ui/FilterChip'
import FormField from '../auth/FormField'
import { JOB_LOCATIONS, JOB_TYPES, WORK_MODES, EDUCATION_LEVELS } from '../../lib/jobOptions'
import { validateCandidateProfileForm } from '../../lib/candidateProfileForm'

function toggleInArray(arr, value) {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

const emptyForm = {
  fullName: '',
  phone: '',
  skills: '',
  experienceYears: '',
  experienceSummary: '',
  educationLevel: '',
  location: '',
  bio: '',
  preferredJobTypes: [],
  preferredWorkModes: [],
  expectedSalaryMin: '',
  expectedSalaryMax: '',
  resumeLink: '',
}

// This form edits fields that live in two different Firestore documents —
// full name/phone on users/{uid}, everything else on candidateProfiles/{uid}
// — but presents them as one page with one Save button, matching how a
// candidate actually thinks about "my profile". onSave receives the full
// merged value object; CandidateProfilePage is responsible for routing
// each field to its real document.
export default function ProfileForm({ userProfile, candidateProfile, onSave, saving }) {
  const [form, setForm] = useState(emptyForm)
  // Adjusted during render (React's documented pattern for state derived
  // from props) rather than in an effect — see the original comment this
  // replaced for why: an effect-based sync here previously raced
  // CandidateProfilePage's post-save state update and briefly unmounted
  // this form before "Profile saved" could render.
  // `undefined` (never assigned by useState below) means "not initialized
  // yet" — distinct from a real candidateProfile value of `null`, which is
  // the normal, valid state for a brand-new candidate with no
  // candidateProfiles doc. Without this distinction, a first-time
  // candidate's fullName/phone (sourced from userProfile, not
  // candidateProfile) would never get pulled into the form at all.
  const [initializedFrom, setInitializedFrom] = useState()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (candidateProfile !== initializedFrom) {
    setInitializedFrom(candidateProfile)
    const p = candidateProfile || {}
    setForm({
      fullName: userProfile?.full_name || '',
      phone: userProfile?.phone || '',
      skills: (p.skills || []).join(', '),
      experienceYears: p.experienceYears ?? '',
      experienceSummary: p.experienceSummary || '',
      educationLevel: p.educationLevel || '',
      location: p.location || '',
      bio: p.bio || '',
      preferredJobTypes: p.preferredJobTypes || [],
      preferredWorkModes: p.preferredWorkModes || [],
      expectedSalaryMin: p.expectedSalaryMin ?? '',
      expectedSalaryMax: p.expectedSalaryMax ?? '',
      resumeLink: p.resumeLink || '',
    })
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const validationError = validateCandidateProfileForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await onSave({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
        experienceSummary: form.experienceSummary.trim(),
        educationLevel: form.educationLevel,
        location: form.location,
        bio: form.bio.trim(),
        preferredJobTypes: form.preferredJobTypes,
        preferredWorkModes: form.preferredWorkModes,
        expectedSalaryMin: form.expectedSalaryMin === '' ? null : Number(form.expectedSalaryMin),
        expectedSalaryMax: form.expectedSalaryMax === '' ? null : Number(form.expectedSalaryMax),
        resumeLink: form.resumeLink.trim(),
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600" role="alert">
          <AlertCircle size={13} /> {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-xs font-semibold text-success-700" role="status">
          <CheckCircle2 size={13} /> Profile saved.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-[13px] font-bold text-navy-900">Basic Information</h2>
        <FormField
          label="Full Name"
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          placeholder="Your full name"
          required
        />
        <div>
          <label className="text-[11px] font-bold text-navy-700" htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={userProfile?.email || ''}
            disabled
            readOnly
            className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px] text-navy-400"
          />
        </div>
        <FormField
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder="9876543210"
          autoComplete="tel"
        />
        <div>
          <label className="text-[11px] font-bold text-navy-700" htmlFor="profile-location">
            Location
          </label>
          <select
            id="profile-location"
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
        <FormField
          as="textarea"
          label="Short Bio"
          value={form.bio}
          onChange={(e) => update('bio', e.target.value)}
          placeholder="Hardworking sales professional looking for growth."
          maxLength={500}
        />
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h2 className="text-[13px] font-bold text-navy-900">Professional Information</h2>
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
            min={0}
            max={60}
            value={form.experienceYears}
            onChange={(e) => update('experienceYears', e.target.value)}
            placeholder="2"
          />
          <div>
            <label className="text-[11px] font-bold text-navy-700" htmlFor="profile-education-level">
              Education Level
            </label>
            <select
              id="profile-education-level"
              value={form.educationLevel}
              onChange={(e) => update('educationLevel', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select education</option>
              {EDUCATION_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>
        <FormField
          as="textarea"
          label="Experience Summary"
          value={form.experienceSummary}
          onChange={(e) => update('experienceSummary', e.target.value)}
          placeholder="2 years in retail sales"
          maxLength={500}
        />
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h2 className="text-[13px] font-bold text-navy-900">Job Preferences</h2>
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
            min={0}
            value={form.expectedSalaryMin}
            onChange={(e) => update('expectedSalaryMin', e.target.value)}
            placeholder="18000"
          />
          <FormField
            label="Max Salary Expected (₹/month)"
            type="number"
            min={0}
            value={form.expectedSalaryMax}
            onChange={(e) => update('expectedSalaryMax', e.target.value)}
            placeholder="25000"
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h2 className="text-[13px] font-bold text-navy-900">Resume Link</h2>
        <p className="-mt-1 text-[11px] text-navy-400">
          Prefer to upload a file instead? Use the Resume card above. This link is a separate,
          optional alternative (Google Drive, Dropbox, etc.) — handy if you&apos;d rather not upload one.
        </p>
        <FormField
          label="Resume Link (optional)"
          type="url"
          value={form.resumeLink}
          onChange={(e) => update('resumeLink', e.target.value)}
          placeholder="https://drive.google.com/..."
        />
      </section>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </Button>
    </form>
  )
}
