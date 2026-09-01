// One-time (re-runnable) dev script to populate the live Firestore `jobs`
// collection with realistic mock data, through the real Firebase client SDK
// and the real security rules — not a bypass, not the Admin SDK. Run with:
//
//   node scripts/seedJobs.mjs
//
// from the project root, after firestore.rules has been published. Safe to
// re-run: the seed employer account is reused (sign-in falls back if it
// already exists) and every job uses a deterministic id, so re-running
// upserts the same 12 jobs instead of duplicating them.

import { readFileSync } from 'fs'
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

const envText = readFileSync('.env', 'utf8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1').replace(/,$/, '')
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)

const SEED_EMPLOYER_EMAIL = 'seed-employer@arconnect.dev'
const SEED_EMPLOYER_PASSWORD = 'SeedEmployer123!'
const SEED_EMPLOYER_NAME = 'ABC Pvt Ltd (Seed)'

async function getOrCreateSeedEmployer() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, SEED_EMPLOYER_EMAIL, SEED_EMPLOYER_PASSWORD)
    await setDoc(doc(db, 'users', cred.user.uid), {
      full_name: SEED_EMPLOYER_NAME,
      email: SEED_EMPLOYER_EMAIL,
      role: 'employer',
      phone: null,
      avatar_url: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    console.log('Created seed employer account:', cred.user.uid)
    return cred.user
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, SEED_EMPLOYER_EMAIL, SEED_EMPLOYER_PASSWORD)
      console.log('Reusing existing seed employer account:', cred.user.uid)
      return cred.user
    }
    throw err
  }
}

function job(id, data) {
  return { id, data }
}

const JOBS = (employerId) => [
  job('seed-job-01', {
    title: 'Sales Executive',
    companyName: 'ABC Pvt Ltd',
    employerId,
    location: 'Varanasi',
    workMode: 'Onsite',
    jobType: 'Full-time',
    experienceLevel: '0-2 years',
    salaryMin: 18000,
    salaryMax: 25000,
    skills: ['Sales', 'Communication', 'Field Work'],
    description: 'Drive sales for our retail partners across Varanasi, building lasting relationships with local shop owners.',
    responsibilities: [
      'Visit local shops and generate new sales leads',
      'Meet daily/weekly sales targets',
      'Report to Area Sales Manager',
    ],
    requirements: ['12th Pass', '0-2 yrs experience', 'Two-wheeler with valid license', 'Hindi/English'],
    employerVerified: true,
    status: 'active',
  }),
  job('seed-job-02', {
    title: 'Delivery Executive',
    companyName: 'QuickServe',
    employerId,
    location: 'Lucknow',
    workMode: 'Onsite',
    jobType: 'Full-time',
    experienceLevel: 'Fresher',
    salaryMin: 15000,
    salaryMax: 22000,
    skills: ['Time Management', 'Navigation', 'Customer Service'],
    description: 'Deliver customer orders on time across Lucknow using our fleet of two-wheelers.',
    responsibilities: [
      'Pick up and deliver packages within assigned zones',
      'Maintain delivery records via the QuickServe app',
      'Provide excellent customer service at doorstep',
    ],
    requirements: ['10th Pass', 'Own two-wheeler', 'Valid driving license', 'Smartphone required'],
    employerVerified: true,
    status: 'active',
  }),
  job('seed-job-03', {
    title: 'Customer Support Executive',
    companyName: 'TechNova Solutions',
    employerId,
    location: 'Noida',
    workMode: 'Hybrid',
    jobType: 'Full-time',
    experienceLevel: '2-5 years',
    salaryMin: 17000,
    salaryMax: 23000,
    skills: ['Communication', 'Problem Solving', 'CRM Software'],
    description: 'Handle inbound customer queries via phone and chat for our SaaS clients, resolving issues promptly.',
    responsibilities: [
      'Respond to customer queries within SLA',
      'Log and track issues in the CRM',
      'Escalate complex issues to senior support',
    ],
    requirements: ['Graduate', '2+ yrs support experience', 'Fluent English & Hindi', 'Basic computer skills'],
    employerVerified: true,
    status: 'active',
  }),
  job('seed-job-04', {
    title: 'Back Office Executive',
    companyName: 'ABC Pvt Ltd',
    employerId,
    location: 'Delhi',
    workMode: 'Onsite',
    jobType: 'Full-time',
    experienceLevel: '0-2 years',
    salaryMin: 16000,
    salaryMax: 20000,
    skills: ['MS Excel', 'Data Entry', 'Documentation'],
    description: 'Support daily back-office operations including data entry, filing, and coordination with field teams.',
    responsibilities: [
      'Maintain accurate records in spreadsheets',
      'Coordinate with sales and delivery teams',
      'Prepare daily and weekly reports',
    ],
    requirements: ['Graduate', 'Good typing speed', 'MS Office knowledge'],
    employerVerified: true,
    status: 'active',
  }),
  job('seed-job-05', {
    title: 'Driver',
    companyName: 'QuickServe',
    employerId,
    location: 'Varanasi',
    workMode: 'Onsite',
    jobType: 'Full-time',
    experienceLevel: '2-5 years',
    salaryMin: 19000,
    salaryMax: 26000,
    skills: ['Driving', 'Route Planning', 'Vehicle Maintenance'],
    description: 'Drive company vehicles for local goods transport across Varanasi and nearby towns.',
    responsibilities: [
      'Transport goods safely and on schedule',
      'Perform basic vehicle maintenance checks',
      'Maintain trip logs',
    ],
    requirements: ['Valid commercial driving license', '2+ yrs driving experience', 'Clean driving record'],
    employerVerified: false,
    status: 'active',
  }),
  job('seed-job-06', {
    title: 'Warehouse Associate',
    companyName: 'TechNova Solutions',
    employerId,
    location: 'Noida',
    workMode: 'Onsite',
    jobType: 'Part-time',
    experienceLevel: 'Fresher',
    salaryMin: 14500,
    salaryMax: 19000,
    skills: ['Inventory Management', 'Physical Stamina', 'Teamwork'],
    description: 'Assist with receiving, sorting, and dispatching inventory at our Noida warehouse.',
    responsibilities: [
      'Receive and verify incoming shipments',
      'Organize inventory on shelves',
      'Assist with order packing and dispatch',
    ],
    requirements: ['10th Pass', 'Able to lift up to 20kg', 'Available for shift work'],
    employerVerified: true,
    status: 'active',
  }),
  job('seed-job-07', {
    title: 'Telecaller',
    companyName: 'ABC Pvt Ltd',
    employerId,
    location: 'Lucknow',
    workMode: 'Onsite',
    jobType: 'Full-time',
    experienceLevel: 'Fresher',
    salaryMin: 13000,
    salaryMax: 18000,
    skills: ['Communication', 'Persuasion', 'Hindi/English'],
    description: 'Make outbound calls to potential customers to promote products and generate leads.',
    responsibilities: [
      'Make outbound calls from provided lead lists',
      'Explain product offerings clearly',
      'Update call outcomes in the system',
    ],
    requirements: ['12th Pass', 'Clear speaking voice', 'Basic computer skills'],
    employerVerified: true,
    status: 'active',
  }),
  job('seed-job-08', {
    title: 'Data Entry Operator',
    companyName: 'TechNova Solutions',
    employerId,
    location: 'Delhi',
    workMode: 'Remote',
    jobType: 'Contract',
    experienceLevel: '0-2 years',
    salaryMin: 15000,
    salaryMax: 20000,
    skills: ['Typing', 'MS Excel', 'Attention to Detail'],
    description: 'Enter and verify data from scanned documents into our internal systems, working remotely.',
    responsibilities: [
      'Enter data accurately from source documents',
      'Verify entries for errors',
      'Meet daily entry targets',
    ],
    requirements: ['12th Pass', 'Typing speed 30+ WPM', 'Own laptop and internet connection'],
    employerVerified: true,
    status: 'active',
  }),
  job('seed-job-09', {
    title: 'Sales Executive',
    companyName: 'QuickServe',
    employerId,
    location: 'Noida',
    workMode: 'Onsite',
    jobType: 'Full-time',
    experienceLevel: '2-5 years',
    salaryMin: 20000,
    salaryMax: 28000,
    skills: ['Sales', 'Negotiation', 'B2B'],
    description: 'Drive B2B sales for our logistics services across the Noida region.',
    responsibilities: [
      'Identify and pursue new business clients',
      'Negotiate contracts and pricing',
      'Maintain client relationships',
    ],
    requirements: ['Graduate', '2+ yrs B2B sales experience', 'Own vehicle preferred'],
    employerVerified: true,
    status: 'active',
  }),
  job('seed-job-10', {
    title: 'Customer Support Executive',
    companyName: 'ABC Pvt Ltd',
    employerId,
    location: 'Varanasi',
    workMode: 'Onsite',
    jobType: 'Full-time',
    experienceLevel: 'Fresher',
    salaryMin: 14000,
    salaryMax: 19000,
    skills: ['Communication', 'Patience', 'Local Language'],
    description: 'Support walk-in and phone customers at our Varanasi service center.',
    responsibilities: [
      'Greet and assist walk-in customers',
      'Answer phone queries professionally',
      'Maintain the service center front desk',
    ],
    requirements: ['12th Pass', 'Friendly demeanor', 'Local language fluency'],
    employerVerified: false,
    status: 'active',
  }),
  job('seed-job-11', {
    title: 'Warehouse Associate',
    companyName: 'QuickServe',
    employerId,
    location: 'Delhi',
    workMode: 'Onsite',
    jobType: 'Full-time',
    experienceLevel: '0-2 years',
    salaryMin: 16000,
    salaryMax: 21000,
    skills: ['Inventory Management', 'Forklift', 'Safety Compliance'],
    description: 'Manage inbound and outbound inventory at our high-volume Delhi distribution center.',
    responsibilities: [
      'Operate warehouse management software',
      'Coordinate with delivery fleet for dispatch',
      'Follow safety protocols at all times',
    ],
    requirements: ['12th Pass', '1+ yr warehouse experience preferred', 'Physically fit'],
    employerVerified: true,
    status: 'active',
  }),
  job('seed-job-12', {
    title: 'Back Office Executive',
    companyName: 'TechNova Solutions',
    employerId,
    location: 'Lucknow',
    workMode: 'Hybrid',
    jobType: 'Internship',
    experienceLevel: 'Fresher',
    salaryMin: 10000,
    salaryMax: 14000,
    skills: ['MS Excel', 'Communication', 'Documentation'],
    description: 'Support the operations team with documentation and reporting as a paid intern, with strong potential for full-time conversion.',
    responsibilities: [
      'Assist with report preparation',
      'Organize digital and physical records',
      'Support the operations team as needed',
    ],
    requirements: ['Pursuing/completed graduation', 'MS Office familiarity', 'Available 5 days/week'],
    employerVerified: true,
    status: 'active',
  }),
]

async function main() {
  const employer = await getOrCreateSeedEmployer()

  const jobs = JOBS(employer.uid)
  for (const { id, data } of jobs) {
    await setDoc(doc(db, 'jobs', id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    console.log('Seeded job:', id, '-', data.title, 'in', data.location)
  }

  console.log(`\nDone. ${jobs.length} jobs seeded under employer ${employer.uid}.`)
}

main().catch((err) => {
  console.error('SEED SCRIPT ERROR:', err)
  process.exitCode = 1
})
