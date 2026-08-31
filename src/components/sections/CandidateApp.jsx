import {
  Briefcase,
  Search,
  SlidersHorizontal,
  MapPin,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Phone,
  Pencil,
  FileText,
  Star,
} from 'lucide-react'
import Frame from '../ui/Frame'
import SectionHeader from '../ui/SectionHeader'
import MobileFrame from '../frames/MobileFrame'
import CandidateBottomNav from '../ui/CandidateBottomNav'
import JobCard from '../ui/JobCard'
import VerifiedBadge from '../ui/VerifiedBadge'
import MatchBadge from '../ui/MatchBadge'
import StatusBadge from '../ui/StatusBadge'
import FilterChip from '../ui/FilterChip'
import Button from '../ui/Button'
import { jobs } from '../../data/sampleData'

function ScreenShell({ children, nav }) {
  return (
    <div className={`relative h-full bg-slate-50 ${nav ? 'pb-14' : ''}`}>
      {children}
      {nav && <CandidateBottomNav active={nav} />}
    </div>
  )
}

function Onboarding() {
  return (
    <ScreenShell>
      <div className="flex h-[calc(100%-0px)] flex-col items-center justify-between px-5 py-8 pb-6">
        <div />
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900">
            <Briefcase size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-extrabold text-navy-900">
              AR<span className="text-primary-600">Connect</span>
            </h3>
            <p className="mt-1.5 text-[12.5px] leading-snug text-navy-500">
              Find verified jobs near you and get hired faster with AI matching.
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className="h-1.5 w-4 rounded-full bg-primary-600" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
            <span className="h-1.5 w-1.5 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="w-full space-y-2.5">
          <Button className="w-full" size="sm">
            Continue with Mobile Number
          </Button>
          <button className="w-full text-center text-[12.5px] font-semibold text-navy-500">
            I&apos;m an Employer →
          </button>
        </div>
      </div>
    </ScreenShell>
  )
}

function HomeScreen() {
  return (
    <ScreenShell nav="Home">
      <div className="px-4 pt-4">
        <p className="text-[11px] font-medium text-navy-500">Good morning,</p>
        <h3 className="text-base font-extrabold text-navy-900">Rahul Kumar 👋</h3>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-soft">
          <Search size={15} className="text-navy-400" />
          <span className="text-[12.5px] text-navy-400">Search jobs, companies...</span>
        </div>

        <div className="mt-3 rounded-2xl bg-primary-600 p-3.5 text-white shadow-soft">
          <p className="flex items-center gap-1.5 text-[12.5px] font-bold">
            <Star size={13} fill="white" /> 94% match jobs waiting for you
          </p>
          <p className="mt-0.5 text-[11px] text-primary-100">
            Complete your profile to unlock more matches
          </p>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {['Sales', 'Delivery', 'Support', 'Driver'].map((c) => (
            <span
              key={c}
              className="whitespace-nowrap rounded-full bg-white border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-navy-700"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h4 className="text-[13px] font-bold text-navy-900">Recommended for you</h4>
          <span className="text-[11px] font-semibold text-primary-600">See all</span>
        </div>
        <div className="mt-2 space-y-2.5">
          {jobs.slice(0, 3).map((job) => (
            <JobCard key={job.title} job={job} compact />
          ))}
        </div>
      </div>
    </ScreenShell>
  )
}

function JobSearchScreen() {
  return (
    <ScreenShell nav="Search">
      <div className="px-4 pt-4">
        <h3 className="text-base font-extrabold text-navy-900">Search Jobs</h3>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-soft">
            <Search size={15} className="text-navy-400" />
            <span className="text-[12.5px] text-navy-400">Sales executive</span>
          </div>
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-primary-600 text-white shadow-soft">
            <SlidersHorizontal size={15} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <FilterChip label="Varanasi" active icon={MapPin} />
          <FilterChip label="Full-time" />
          <FilterChip label="₹15k–25k" />
          <FilterChip label="Verified only" />
        </div>

        <p className="mt-3 text-[11px] font-semibold text-navy-500">
          {jobs.length} jobs found
        </p>
        <div className="mt-2 space-y-2.5">
          {jobs.slice(0, 4).map((job) => (
            <JobCard key={job.title} job={job} compact />
          ))}
        </div>
      </div>
    </ScreenShell>
  )
}

function JobDetailScreen() {
  const job = jobs[0]
  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between px-4 pt-4 pb-2">
        <ArrowLeft size={18} className="text-navy-900" />
        <span className="text-[12.5px] font-bold text-navy-900">Job Details</span>
        <Bookmark size={17} className="text-navy-400" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-base font-bold text-primary-600">
            A
          </div>
          <div>
            <h3 className="text-[15px] font-extrabold text-navy-900">{job.title}</h3>
            <p className="text-[12px] text-navy-500">{job.company}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <VerifiedBadge />
          <MatchBadge value={job.match} />
        </div>

        <p className="mt-3 text-lg font-extrabold text-navy-900">{job.salary}</p>
        <p className="mt-1 flex items-center gap-1 text-[12px] text-navy-500">
          <MapPin size={12} /> {job.location} · {job.type}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <h4 className="text-[12.5px] font-bold text-navy-900">Job Description</h4>
          <ul className="mt-2 space-y-1.5 text-[12px] leading-snug text-navy-500">
            <li>• Visit local shops and generate new sales leads</li>
            <li>• Meet daily/weekly sales targets</li>
            <li>• Report to Area Sales Manager</li>
            <li>• 2-wheeler with valid license preferred</li>
          </ul>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-3">
          <h4 className="text-[12.5px] font-bold text-navy-900">Requirements</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['12th Pass', '0-2 yrs exp', 'Two-wheeler', 'Hindi/English'].map((r) => (
              <span
                key={r}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-navy-600"
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white p-3">
        <Button className="w-full">Apply Now</Button>
      </div>
    </div>
  )
}

function ApplicationTrackingScreen() {
  const steps = ['Applied', 'Review', 'Shortlist', 'Interview', 'Hired']
  return (
    <ScreenShell nav="Applications">
      <div className="px-4 pt-4">
        <h3 className="text-base font-extrabold text-navy-900">My Applications</h3>

        <div className="mt-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-navy-900">Sales Executive</p>
              <p className="text-[11px] text-navy-500">ABC Pvt Ltd · Varanasi</p>
            </div>
            <StatusBadge status="interview" />
          </div>
          <div className="mt-3 flex items-center">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  <div className="h-[3px] flex-1 rounded bg-slate-100" />
                  <span
                    className={`h-3.5 w-3.5 shrink-0 rounded-full ${
                      i <= 3 ? 'bg-primary-600' : 'bg-slate-200'
                    }`}
                  />
                  <div className="h-[3px] flex-1 rounded bg-slate-100" />
                </div>
                <span className="mt-1 block w-full break-words px-0.5 text-center text-[7.5px] font-semibold leading-tight text-navy-500">
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {[
            { title: 'Delivery Executive', company: 'QuickServe', status: 'shortlisted' },
            { title: 'Customer Support', company: 'TechNova Solutions', status: 'review' },
            { title: 'Back Office', company: 'ABC Pvt Ltd', status: 'rejected' },
          ].map((a) => (
            <div
              key={a.title}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-soft"
            >
              <div>
                <p className="text-[12.5px] font-bold text-navy-900">{a.title}</p>
                <p className="text-[11px] text-navy-500">{a.company}</p>
              </div>
              <StatusBadge status={a.status} />
            </div>
          ))}
        </div>
      </div>
    </ScreenShell>
  )
}

function ProfileScreen() {
  return (
    <ScreenShell nav="Profile">
      <div className="px-4 pt-5">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-900 text-lg font-bold text-white">
            RK
          </div>
          <h3 className="mt-2 text-[15px] font-extrabold text-navy-900">Rahul Kumar</h3>
          <p className="flex items-center gap-1 text-[11.5px] text-navy-500">
            <Phone size={11} /> +91 98XXX XXX12 <CheckCircle2 size={12} className="text-success-600" />
          </p>
          <p className="flex items-center gap-1 text-[11.5px] text-navy-500">
            <MapPin size={11} /> Varanasi, Uttar Pradesh
          </p>
          <button className="mt-2 flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-navy-700">
            <Pencil size={11} /> Edit Profile
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-[12.5px] font-bold text-navy-900">Resume</p>
            <FileText size={15} className="text-primary-600" />
          </div>
          <p className="mt-1 text-[11px] text-navy-500">Rahul_Kumar_Resume.pdf · Uploaded</p>
        </div>

        <div className="mt-3">
          <h4 className="text-[12.5px] font-bold text-navy-900">Skills</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {['Sales', 'Communication', 'MS Excel', 'Tally', 'Field Work'].map((s) => (
              <span
                key={s}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-navy-600"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <h4 className="text-[12.5px] font-bold text-navy-900">Experience</h4>
          <div className="mt-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-soft">
            <p className="text-[12px] font-bold text-navy-900">Sales Associate</p>
            <p className="text-[11px] text-navy-500">Local Retail Store · 2022–2024</p>
          </div>
        </div>
      </div>
    </ScreenShell>
  )
}

const screens = [
  { label: '1. Onboarding', Component: Onboarding },
  { label: '2. Home', Component: HomeScreen },
  { label: '3. Job Search', Component: JobSearchScreen },
  { label: '4. Job Detail', Component: JobDetailScreen },
  { label: '5. Application Tracking', Component: ApplicationTrackingScreen },
  { label: '6. Candidate Profile', Component: ProfileScreen },
]

export default function CandidateApp() {
  return (
    <Frame tag="02 · Candidate Mobile App" id="candidate-app">
      <SectionHeader
        index="02"
        title="Candidate Mobile App"
        subtitle="Six core screens covering the candidate journey from onboarding to profile management. Bottom navigation: Home · Search · Applications · Chat · Profile."
      />
      <div className="flex gap-6 overflow-x-auto pb-4">
        {screens.map(({ label, Component }) => (
          <MobileFrame key={label} label={label}>
            <Component />
          </MobileFrame>
        ))}
      </div>
    </Frame>
  )
}
