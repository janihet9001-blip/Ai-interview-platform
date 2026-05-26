import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // ✅ Added loading state

  const navigate = useNavigate()

  // ✅ Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const saved = sessionStorage.getItem('auth')
        const token = sessionStorage.getItem('token')
        
        if (!saved || !token) {
          setLoading(false)
          return null
        }
        
        const parsed = JSON.parse(saved)
        
        // Validate user data
        if (!parsed?.id || !parsed?.role || !parsed?.email) {
          sessionStorage.removeItem('auth')
          sessionStorage.removeItem('token')
          setLoading(false)
          return null
        }
        
        setUser(parsed)
      } catch (error) {
        console.error('Auth check failed:', error)
        sessionStorage.removeItem('auth')
        sessionStorage.removeItem('token')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const login = (userData, token) => {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('auth', JSON.stringify(userData))
    setUser(userData)
    
    if (userData.role === 'ADMIN') {
      navigate('/recruiter')
    } else {
      navigate('/waiting')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('auth')
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}