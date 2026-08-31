import { Send, Paperclip, CalendarDays, Clock, MapPin, Video } from 'lucide-react'
import Frame from '../ui/Frame'
import SectionHeader from '../ui/SectionHeader'
import MobileFrame from '../frames/MobileFrame'

function ChatScreen() {
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="flex items-center gap-2.5 border-b border-slate-100 bg-white px-3.5 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-[10px] font-bold text-white">
          AB
        </div>
        <div>
          <p className="text-[12.5px] font-bold text-navy-900">ABC Pvt Ltd</p>
          <p className="text-[10px] text-success-600">● Online — Recruiter</p>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3.5">
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[12px] text-navy-800 shadow-soft">
          Hello Rahul, are you available for an interview tomorrow?
          <p className="mt-1 text-[9px] text-navy-400">10:42 AM</p>
        </div>
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary-600 px-3 py-2 text-[12px] text-white">
          Yes, I am available.
          <p className="mt-1 text-[9px] text-primary-100">10:44 AM ✓✓</p>
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-[12px] text-navy-800 shadow-soft">
          Great! I&apos;ve scheduled it for 29 Aug, 11:30 AM at our Varanasi office.
          <p className="mt-1 text-[9px] text-navy-400">10:45 AM</p>
        </div>
        <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary-600 px-3 py-2 text-[12px] text-white">
          Thank you, I&apos;ll be there on time.
          <p className="mt-1 text-[9px] text-primary-100">10:46 AM ✓✓</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 bg-white p-2.5">
        <Paperclip size={16} className="text-navy-400" />
        <div className="flex-1 rounded-full bg-slate-100 px-3 py-1.5 text-[11.5px] text-navy-400">
          Type a message...
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-white">
          <Send size={13} />
        </div>
      </div>
    </div>
  )
}

function InterviewCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-600">
          Interview Scheduled
        </span>
        <Video size={16} className="text-navy-400" />
      </div>
      <h4 className="mt-3 text-base font-extrabold text-navy-900">Sales Executive</h4>
      <p className="text-[12.5px] text-navy-500">ABC Pvt Ltd</p>

      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-[12.5px] text-navy-700">
        <p className="flex items-center gap-2">
          <CalendarDays size={14} className="text-primary-600" /> 29 Aug 2026
        </p>
        <p className="flex items-center gap-2">
          <Clock size={14} className="text-primary-600" /> 11:30 AM
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={14} className="text-primary-600" /> ABC Pvt Ltd, Varanasi Office
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 rounded-xl bg-primary-600 py-2 text-xs font-bold text-white">
          Confirm
        </button>
        <button className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-bold text-navy-700">
          Reschedule
        </button>
      </div>
    </div>
  )
}

export default function ChatInterview() {
  return (
    <Frame tag="08 · Chat + Interview" id="chat-interview">
      <SectionHeader
        index="08"
        title="Chat & Interview Scheduling"
        subtitle="Candidates and recruiters connect directly in-app — no third-party numbers, fully logged for safety."
      />
      <div className="flex flex-wrap items-start justify-center gap-10">
        <MobileFrame label="Recruiter ↔ Candidate Chat">
          <ChatScreen />
        </MobileFrame>
        <div className="w-full max-w-xs pt-6">
          <InterviewCard />
        </div>
      </div>
    </Frame>
  )
}
