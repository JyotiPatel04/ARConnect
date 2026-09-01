import { Routes, Route } from 'react-router-dom'

import PrototypePage from './pages/prototype/PrototypePage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import UnauthorizedPage from './pages/UnauthorizedPage'

import ProtectedRoute from './components/auth/ProtectedRoute'

import AuthLayout from './layouts/AuthLayout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

import CandidateLayout from './layouts/CandidateLayout'
import CandidateOnboardingPage from './pages/candidate/CandidateOnboardingPage'
import CandidateHomePage from './pages/candidate/CandidateHomePage'
import CandidateJobsPage from './pages/candidate/CandidateJobsPage'
import CandidateJobDetailPage from './pages/candidate/CandidateJobDetailPage'
import CandidateApplicationsPage from './pages/candidate/CandidateApplicationsPage'
import CandidateSavedJobsPage from './pages/candidate/CandidateSavedJobsPage'
import CandidateChatPage from './pages/candidate/CandidateChatPage'
import CandidateInterviewsPage from './pages/candidate/CandidateInterviewsPage'
import CandidateProfilePage from './pages/candidate/CandidateProfilePage'

import EmployerLayout from './layouts/EmployerLayout'
import EmployerDashboardPage from './pages/employer/EmployerDashboardPage'
import EmployerCompanyPage from './pages/employer/EmployerCompanyPage'
import EmployerJobsPage from './pages/employer/EmployerJobsPage'
import EmployerJobNewPage from './pages/employer/EmployerJobNewPage'
import EmployerJobDetailPage from './pages/employer/EmployerJobDetailPage'
import EmployerApplicationsPage from './pages/employer/EmployerApplicationsPage'
import EmployerCandidatesPage from './pages/employer/EmployerCandidatesPage'
import EmployerInterviewsPage from './pages/employer/EmployerInterviewsPage'
import EmployerProfilePage from './pages/employer/EmployerProfilePage'

import AdminLayout from './layouts/AdminLayout'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminCandidatesPage from './pages/admin/AdminCandidatesPage'
import AdminEmployersPage from './pages/admin/AdminEmployersPage'
import AdminJobsPage from './pages/admin/AdminJobsPage'
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage'
import AdminVerificationsPage from './pages/admin/AdminVerificationsPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/prototype" element={<PrototypePage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
        <Route path="/candidate" element={<CandidateLayout />}>
          <Route index element={<CandidateHomePage />} />
          <Route path="onboarding" element={<CandidateOnboardingPage />} />
          <Route path="home" element={<CandidateHomePage />} />
          <Route path="jobs" element={<CandidateJobsPage />} />
          <Route path="jobs/:jobId" element={<CandidateJobDetailPage />} />
          <Route path="applications" element={<CandidateApplicationsPage />} />
          <Route path="saved-jobs" element={<CandidateSavedJobsPage />} />
          <Route path="chat" element={<CandidateChatPage />} />
          <Route path="interviews" element={<CandidateInterviewsPage />} />
          <Route path="profile" element={<CandidateProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['employer']} />}>
        <Route path="/employer" element={<EmployerLayout />}>
          <Route index element={<EmployerDashboardPage />} />
          <Route path="company" element={<EmployerCompanyPage />} />
          <Route path="jobs" element={<EmployerJobsPage />} />
          <Route path="jobs/new" element={<EmployerJobNewPage />} />
          <Route path="jobs/:jobId" element={<EmployerJobDetailPage />} />
          <Route path="applications" element={<EmployerApplicationsPage />} />
          <Route path="candidates" element={<EmployerCandidatesPage />} />
          <Route path="interviews" element={<EmployerInterviewsPage />} />
          <Route path="profile" element={<EmployerProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="candidates" element={<AdminCandidatesPage />} />
          <Route path="employers" element={<AdminEmployersPage />} />
          <Route path="jobs" element={<AdminJobsPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="verifications" element={<AdminVerificationsPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
