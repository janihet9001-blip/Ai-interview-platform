import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Interviews from './pages/Interviews'
import Results from './pages/Results'
import History from './pages/History'
import Progress from './pages/Progress'
import Profile from './pages/Profile'
import RecruiterDashboard from './pages/RecruiterDashboard'
import WaitingRoom from './pages/WaitingRoom'

// ✅ Create a simple spinner component or import from LoadingStates
const FullPageSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-bg z-50">
    <div className="w-12 h-12 border-4 border-accent/20 rounded-full animate-spin border-t-accent" />
  </div>
)

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <FullPageSpinner />
  }
  
  return user ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <FullPageSpinner />
  }
  
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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