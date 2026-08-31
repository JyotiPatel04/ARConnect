import { Phone, MapPin, CheckCircle2, Pencil, FileText } from 'lucide-react'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function CandidateProfilePage() {
  useDocumentTitle('Profile')

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-lg font-bold text-white">
          RK
        </div>
        <h1 className="mt-2 text-base font-extrabold text-navy-900">Rahul Kumar</h1>
        <p className="flex items-center gap-1 text-xs text-navy-500">
          <Phone size={12} /> +91 98XXX XXX12 <CheckCircle2 size={13} className="text-success-600" />
        </p>
        <p className="flex items-center gap-1 text-xs text-navy-500">
          <MapPin size={12} /> Varanasi, Uttar Pradesh
        </p>
        <button className="mt-2 flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-navy-700">
          <Pencil size={12} /> Edit Profile
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-bold text-navy-900">Resume</p>
          <FileText size={16} className="text-primary-600" />
        </div>
        <p className="mt-1 text-xs text-navy-500">Rahul_Kumar_Resume.pdf · Uploaded</p>
      </div>

      <div className="mt-4">
        <h2 className="text-[13px] font-bold text-navy-900">Skills</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['Sales', 'Communication', 'MS Excel', 'Tally', 'Field Work'].map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-navy-600">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 pb-2">
        <h2 className="text-[13px] font-bold text-navy-900">Experience</h2>
        <div className="mt-2 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
          <p className="text-[13px] font-bold text-navy-900">Sales Associate</p>
          <p className="text-xs text-navy-500">Local Retail Store · 2022–2024</p>
        </div>
      </div>
    </div>
  )
}
