import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Interviews from './pages/Interviews'
import Results from './pages/Results'
import History from './pages/History'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import RecruiterDashboard from './pages/RecruiterDashboard'
import WaitingRoom from './pages/WaitingRoom'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />

      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/interview/:role" element={<PrivateRoute><Interviews /></PrivateRoute>} />
      <Route path="/results/:sessionId" element={<PrivateRoute><Results /></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
      <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/waiting" element={<PrivateRoute><WaitingRoom /></PrivateRoute>} />

      <Route path="/recruiter" element={<AdminRoute><RecruiterDashboard /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App