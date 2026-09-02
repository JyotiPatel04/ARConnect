import { useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Button from '../ui/Button'
import FormField from '../auth/FormField'
import { JOB_LOCATIONS, INDUSTRIES, COMPANY_SIZES } from '../../lib/jobOptions'
import { validateCompanyProfileForm } from '../../lib/companyProfileForm'

const emptyForm = {
  companyName: '',
  industry: '',
  companySize: '',
  location: '',
  about: '',
  website: '',
  foundedYear: '',
  contactEmail: '',
  contactPhone: '',
  companyLogoUrl: '',
}

export default function CompanyProfileForm({ companyProfile, onSave, saving }) {
  const [form, setForm] = useState(emptyForm)
  // `undefined` (the useState default below) means "not initialized yet"
  // — distinct from a real companyProfile value of `null`, which is the
  // normal state for an employer who hasn't created one yet. See
  // ProfileForm.jsx (Phase 6) for the identical reasoning.
  const [initializedFrom, setInitializedFrom] = useState()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [logoFailedToLoad, setLogoFailedToLoad] = useState(false)

  if (companyProfile !== initializedFrom) {
    setInitializedFrom(companyProfile)
    const p = companyProfile || {}
    setForm({
      companyName: p.companyName || '',
      industry: p.industry || '',
      companySize: p.companySize || '',
      location: p.location || '',
      about: p.about || '',
      website: p.website || '',
      foundedYear: p.foundedYear ?? '',
      contactEmail: p.contactEmail || '',
      contactPhone: p.contactPhone || '',
      companyLogoUrl: p.companyLogoUrl || '',
    })
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const validationError = validateCompanyProfileForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      await onSave({
        companyName: form.companyName.trim(),
        industry: form.industry,
        companySize: form.companySize,
        location: form.location,
        about: form.about.trim(),
        website: form.website.trim(),
        foundedYear: form.foundedYear === '' ? null : Number(form.foundedYear),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        companyLogoUrl: form.companyLogoUrl.trim(),
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
          <CheckCircle2 size={13} /> Company profile saved.
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-[13px] font-bold text-navy-900">Company Basic Information</h2>
        <FormField
          label="Company Name"
          value={form.companyName}
          onChange={(e) => update('companyName', e.target.value)}
          placeholder="e.g. ABC Pvt Ltd"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-navy-700" htmlFor="company-industry">
              Industry
            </label>
            <select
              id="company-industry"
              value={form.industry}
              onChange={(e) => update('industry', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-navy-700" htmlFor="company-size">
              Company Size
            </label>
            <select
              id="company-size"
              value={form.companySize}
              onChange={(e) => update('companySize', e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Select size</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} employees
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-navy-700" htmlFor="company-location">
            Location
          </label>
          <select
            id="company-location"
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
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h2 className="text-[13px] font-bold text-navy-900">Company Details</h2>
        <FormField
          as="textarea"
          label="About Company"
          value={form.about}
          onChange={(e) => update('about', e.target.value)}
          placeholder="Tell candidates what your company does and what makes it a great place to work."
          maxLength={1000}
          rows={4}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Website"
            type="url"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            placeholder="https://example.com"
          />
          <FormField
            label="Founded Year"
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            value={form.foundedYear}
            onChange={(e) => update('foundedYear', e.target.value)}
            placeholder="2015"
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h2 className="text-[13px] font-bold text-navy-900">Contact Information</h2>
        <p className="-mt-1 text-[11px] text-navy-400">
          Kept private — never shown to candidates. Used only for ARConnect verification/support.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="Contact Email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => update('contactEmail', e.target.value)}
            placeholder="hr@example.com"
          />
          <FormField
            label="Contact Phone"
            type="tel"
            value={form.contactPhone}
            onChange={(e) => update('contactPhone', e.target.value)}
            placeholder="9876543210"
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-100 pt-4">
        <h2 className="text-[13px] font-bold text-navy-900">Company Branding</h2>
        <p className="-mt-1 text-[11px] text-navy-400">
          File upload isn&apos;t available yet — paste a direct HTTPS link to your logo image instead.
        </p>
        <FormField
          label="Company Logo URL"
          type="url"
          value={form.companyLogoUrl}
          onChange={(e) => {
            setLogoFailedToLoad(false)
            update('companyLogoUrl', e.target.value)
          }}
          placeholder="https://example.com/logo.png"
        />
        <div>
          <p className="text-[11px] font-bold text-navy-700">Preview</p>
          {form.companyLogoUrl.trim() && !logoFailedToLoad ? (
            <img
              src={form.companyLogoUrl.trim()}
              alt="Company logo preview"
              className="mt-1.5 h-16 w-16 rounded-xl border border-slate-100 object-cover"
              onError={() => setLogoFailedToLoad(true)}
            />
          ) : (
            <div className="mt-1.5 flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-200 text-center text-[10px] text-navy-300">
              {form.companyLogoUrl.trim() ? "Couldn't load image" : 'No logo'}
            </div>
          )}
        </div>
      </section>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Saving...' : 'Save Company Profile'}
      </Button>
    </form>
  )
}
