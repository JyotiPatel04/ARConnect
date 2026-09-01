import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import FilterChip from '../ui/FilterChip'
import { JOB_LOCATIONS, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from '../../lib/jobOptions'

const SALARY_OPTIONS = [
  { label: '₹15k+', value: 15000 },
  { label: '₹25k+', value: 25000 },
  { label: '₹40k+', value: 40000 },
]

function FilterGroup({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold text-navy-700">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

export default function JobFilters({ search, onSearchChange, filters, onFilterChange, onClearFilters, activeCount }) {
  const [panelOpen, setPanelOpen] = useState(false)

  function toggle(key, value) {
    onFilterChange(key, filters[key] === value ? '' : value)
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-soft">
          <Search size={16} className="text-navy-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search jobs, companies, skills..."
            className="w-full text-sm text-navy-900 placeholder:text-navy-400 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          aria-label="Toggle filters"
          className={`relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl shadow-soft ${
            panelOpen ? 'bg-navy-900 text-white' : 'bg-primary-600 text-white'
          }`}
        >
          <SlidersHorizontal size={16} />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-success-600 text-[9px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {panelOpen && (
        <div className="mt-3 space-y-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-soft">
          <FilterGroup label="Location">
            {JOB_LOCATIONS.map((loc) => (
              <FilterChip key={loc} label={loc} active={filters.location === loc} onClick={() => toggle('location', loc)} />
            ))}
          </FilterGroup>
          <FilterGroup label="Job Type">
            {JOB_TYPES.map((t) => (
              <FilterChip key={t} label={t} active={filters.jobType === t} onClick={() => toggle('jobType', t)} />
            ))}
          </FilterGroup>
          <FilterGroup label="Work Mode">
            {WORK_MODES.map((m) => (
              <FilterChip key={m} label={m} active={filters.workMode === m} onClick={() => toggle('workMode', m)} />
            ))}
          </FilterGroup>
          <FilterGroup label="Experience">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <FilterChip
                key={lvl}
                label={lvl}
                active={filters.experienceLevel === lvl}
                onClick={() => toggle('experienceLevel', lvl)}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Minimum Salary">
            {SALARY_OPTIONS.map((s) => (
              <FilterChip
                key={s.value}
                label={s.label}
                active={filters.minSalary === s.value}
                onClick={() => toggle('minSalary', s.value)}
              />
            ))}
          </FilterGroup>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onClearFilters}
              className="flex items-center gap-1 text-xs font-bold text-red-600"
            >
              <X size={12} /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
