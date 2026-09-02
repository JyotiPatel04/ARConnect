import { Building2, MapPin, Users, ExternalLink } from 'lucide-react'

// Reads only the PUBLIC companySummaries doc (via useCompanySummary) —
// never companyProfiles — so contactEmail/contactPhone are structurally
// unreachable from this component regardless of what it's given. A
// missing summary (employer hasn't completed their company profile, or
// this job predates Phase 7) is a normal, expected state, not an error —
// shown as a plain fallback rather than a scary error banner.
export default function CompanyInfoCard({ summary, loading }) {
  if (loading) {
    return (
      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <p className="text-xs text-navy-400">Loading company information...</p>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <h2 className="text-[13px] font-bold text-navy-900">About the Company</h2>
        <p className="mt-1.5 text-xs text-navy-400">Company information not available.</p>
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
      <h2 className="text-[13px] font-bold text-navy-900">About the Company</h2>

      <div className="mt-2.5 flex items-center gap-3">
        {summary.companyLogoUrl ? (
          <img
            src={summary.companyLogoUrl}
            alt={summary.companyName}
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-base font-bold text-primary-600">
            <Building2 size={20} />
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-navy-900">{summary.companyName}</p>
          {summary.industry && <p className="text-xs text-navy-500">{summary.industry}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-navy-500">
        {summary.location && (
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {summary.location}
          </span>
        )}
        {summary.companySize && (
          <span className="flex items-center gap-1">
            <Users size={12} /> {summary.companySize} employees
          </span>
        )}
      </div>

      {summary.about && <p className="mt-3 text-[13px] leading-snug text-navy-500">{summary.about}</p>}

      {summary.website && (
        <a
          href={summary.website}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline"
        >
          Visit website <ExternalLink size={12} />
        </a>
      )}
    </div>
  )
}
