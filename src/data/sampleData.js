export const locations = ['Varanasi', 'Lucknow', 'Noida', 'Delhi']

export const companies = ['ABC Pvt Ltd', 'TechNova Solutions', 'QuickServe']

export const candidates = [
  { name: 'Rahul Kumar', role: 'Sales Executive', location: 'Varanasi', exp: '2 yrs exp' },
  { name: 'Amit Sharma', role: 'Delivery Executive', location: 'Lucknow', exp: '1 yr exp' },
  { name: 'Priya Singh', role: 'Customer Support', location: 'Noida', exp: '3 yrs exp' },
]

export const jobs = [
  {
    title: 'Sales Executive',
    company: 'ABC Pvt Ltd',
    salary: '₹18,000 – ₹25,000/month',
    location: 'Varanasi',
    verified: true,
    match: 94,
    type: 'Full-time',
    posted: '2 days ago',
  },
  {
    title: 'Delivery Executive',
    company: 'QuickServe',
    salary: '₹15,000 – ₹22,000/month',
    location: 'Lucknow',
    verified: true,
    match: 88,
    type: 'Full-time',
    posted: '1 day ago',
  },
  {
    title: 'Customer Support',
    company: 'TechNova Solutions',
    salary: '₹17,000 – ₹23,000/month',
    location: 'Noida',
    verified: true,
    match: 91,
    type: 'Full-time',
    posted: '5 hours ago',
  },
  {
    title: 'Back Office',
    company: 'ABC Pvt Ltd',
    salary: '₹16,000 – ₹20,000/month',
    location: 'Delhi',
    verified: true,
    match: 82,
    type: 'Full-time',
    posted: '3 days ago',
  },
  {
    title: 'Driver',
    company: 'QuickServe',
    salary: '₹19,000 – ₹26,000/month',
    location: 'Varanasi',
    verified: false,
    match: 76,
    type: 'Full-time',
    posted: '6 days ago',
  },
  {
    title: 'Warehouse Associate',
    company: 'TechNova Solutions',
    salary: '₹14,500 – ₹19,000/month',
    location: 'Noida',
    verified: true,
    match: 85,
    type: 'Part-time',
    posted: 'Today',
  },
]

export const matchBreakdown = [
  { label: 'Skills Match', value: 96 },
  { label: 'Experience Match', value: 90 },
  { label: 'Location Match', value: 100 },
  { label: 'Salary Match', value: 88 },
  { label: 'Education Match', value: 95 },
]

export const employerStats = [
  { label: 'Active Jobs', value: '8' },
  { label: 'Applications', value: '146' },
  { label: 'Shortlisted', value: '23' },
  { label: 'Interviews', value: '9' },
  { label: 'Hired', value: '4' },
]

export const adminStats = [
  { label: 'Candidates', value: '125,420' },
  { label: 'Employers', value: '5,320' },
  { label: 'Active Jobs', value: '8,240' },
  { label: 'Pending Verification', value: '312' },
  { label: 'Applications Today', value: '4,921' },
]

export const flowSteps = [
  'Search Jobs',
  'Filter',
  'Job Detail',
  'Apply',
  'Application Tracking',
  'Interview',
  'Hired',
]
