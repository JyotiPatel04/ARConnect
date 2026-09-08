import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import FilterChip from '../ui/FilterChip'
import { JOB_LOCATIONS, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS } from '../../lib/jobOptions'

const SALARY_PRESETS = [
  { label: '₹15k+', value: 15000 },
  { label: '₹25k+', value: 25000 },
  { label: '₹40k+', value: 40000 },
]

const SORT_OPTIONS = [
  { label: 'Recent', value: 'recent' },
  { label: 'Relevance', value: 'relevance' },
  { label: 'Salary', value: 'salary' },
]

function FilterGroup({ label, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold text-navy-700">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function toggleSkill(selected, skill) {
  return selected.includes(skill) ? selected.filter((s) => s !== skill) : [...selected, skill]
}

export default function JobFilters({
  search,
  onSearchChange,
  filters,
  onFilterChange,
  sortBy,
  onSortChange,
  availableSkills,
  onClearFilters,
  activeCount,
}) {
  const [panelOpen, setPanelOpen] = useState(false)

  function toggle(key, value) {
    onFilterChange(key, filters[key] === value ? '' : value)
  }

  function handleSalaryInput(key, rawValue) {
    onFilterChange(key, rawValue === '' ? null : Number(rawValue))
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-soft focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
          <Search size={16} className="text-navy-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search jobs, companies, skills..."
            aria-label="Search jobs"
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
          <FilterGroup label="Sort By">
            {SORT_OPTIONS.map((opt) => (
              <FilterChip key={opt.value} label={opt.label} active={sortBy === opt.value} onClick={() => onSortChange(opt.value)} />
            ))}
          </FilterGroup>
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

          {/* Skills come from the jobs already loaded on this page (see
              CandidateJobsPage), not a hard-coded list -- so this group is
              simply absent when nothing's loaded yet or no job carries any
              skills, rather than showing an empty/broken-looking box. */}
          {availableSkills.length > 0 && (
            <FilterGroup label="Skills">
              {availableSkills.map((skill) => (
                <FilterChip
                  key={skill}
                  label={skill}
                  active={filters.skills.includes(skill)}
                  onClick={() => onFilterChange('skills', toggleSkill(filters.skills, skill))}
                />
              ))}
            </FilterGroup>
          )}

          <div>
            <p className="mb-1.5 text-[11px] font-bold text-navy-700">Salary Range</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Min ₹"
                value={filters.salaryMin ?? ''}
                onChange={(e) => handleSalaryInput('salaryMin', e.target.value)}
                aria-label="Minimum salary"
                className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <span className="shrink-0 text-navy-400">–</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="Max ₹"
                value={filters.salaryMax ?? ''}
                onChange={(e) => handleSalaryInput('salaryMax', e.target.value)}
                aria-label="Maximum salary"
                className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-[13px] text-navy-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SALARY_PRESETS.map((s) => (
                <FilterChip
                  key={s.value}
                  label={s.label}
                  active={filters.salaryMin === s.value}
                  onClick={() => toggle('salaryMin', s.value)}
                />
              ))}
            </div>
          </div>

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
