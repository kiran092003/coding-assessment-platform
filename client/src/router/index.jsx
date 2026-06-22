import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
// Auth pages (existing)
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
// Layout
import AppLayout from '@/components/layout/AppLayout'
// Pages
import HomePage from '@/pages/HomePage'
import QuestionsPage from '@/pages/QuestionsPage'
import QuestionSolvePage from '@/pages/QuestionSolvePage'
import ContestsPage from '@/pages/ContestsPage'
import ContestDetailPage from '@/pages/ContestDetailPage'
import ContestSolvePage from '@/pages/ContestSolvePage'
import ContestLeaderboardPage from '@/pages/ContestLeaderboardPage'
import ContestArenaPage from '@/pages/ContestArenaPage'
import MySubmissionsPage from '@/pages/MySubmissionsPage'
import ProfilePage from '@/pages/ProfilePage'
import NotFoundPage from '@/pages/NotFoundPage'
// Admin pages
import AdminQuestionsPage from '@/pages/admin/AdminQuestionsPage'
import CreateQuestionPage from '@/pages/admin/CreateQuestionPage'
import EditQuestionPage from '@/pages/admin/EditQuestionPage'
import TestCasesPage from '@/pages/admin/TestCasesPage'
import AdminContestsPage from '@/pages/admin/AdminContestsPage'
import CreateContestPage from '@/pages/admin/CreateContestPage'
import EditContestPage from '@/pages/admin/EditContestPage'
import ContestQuestionsPage from '@/pages/admin/ContestQuestionsPage'
import MapQuestionsPage from '@/pages/admin/MapQuestionsPage'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <Navigate to="/" replace /> : children
}

function AdminRoute({ children }) {
  const { user, isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <PublicRoute><LoginPage /></PublicRoute>
  },
  {
    path: '/signup',
    element: <PublicRoute><SignupPage /></PublicRoute>
  },
  {
    path: '/register',
    element: <PublicRoute><SignupPage /></PublicRoute>
  },
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/questions', element: <QuestionsPage /> },
      { path: '/questions/:id', element: <QuestionSolvePage /> },
      { path: '/contests', element: <ContestsPage /> },
      { path: '/contests/:id', element: <ContestDetailPage /> },
      { path: '/contests/:id/solve/:questionId', element: <ContestSolvePage /> },
      { path: '/contests/:id/leaderboard', element: <ContestLeaderboardPage /> },
      { path: '/submissions', element: <MySubmissionsPage /> },
      { path: '/profile', element: <ProfilePage /> },
      // Admin routes
      { path: '/admin/questions', element: <AdminRoute><AdminQuestionsPage /></AdminRoute> },
      { path: '/admin/questions/create', element: <AdminRoute><CreateQuestionPage /></AdminRoute> },
      { path: '/admin/questions/:id/edit', element: <AdminRoute><EditQuestionPage /></AdminRoute> },
      { path: '/admin/questions/:id/testcases', element: <AdminRoute><TestCasesPage /></AdminRoute> },
      { path: '/admin/contests', element: <AdminRoute><AdminContestsPage /></AdminRoute> },
      { path: '/admin/contests/create', element: <AdminRoute><CreateContestPage /></AdminRoute> },
      { path: '/admin/contests/:id/edit', element: <AdminRoute><EditContestPage /></AdminRoute> },
      { path: '/admin/contests/:id/questions', element: <AdminRoute><ContestQuestionsPage /></AdminRoute> },
      { path: '/admin/map-questions', element: <AdminRoute><MapQuestionsPage /></AdminRoute> },
    ]
  },
  {
    path: '/contests/:id/arena',
    element: <ProtectedRoute><ContestArenaPage /></ProtectedRoute>
  },
  { path: '*', element: <NotFoundPage /> }
])

export default function Router() {
  return <RouterProvider router={router} />
}
