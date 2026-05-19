import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('auth')   // ✅ Changed from 'user' to 'auth'
      const token = sessionStorage.getItem('token')
      if (!saved || !token) return null
      const parsed = JSON.parse(saved)
      if (!parsed?.id || !parsed?.role || !parsed?.email) {
        sessionStorage.removeItem('auth')             // ✅ Changed from 'user' to 'auth'
        sessionStorage.removeItem('token')
        return null
      }
      return parsed
    } catch {
      sessionStorage.removeItem('auth')               // ✅ Changed from 'user' to 'auth'
      sessionStorage.removeItem('token')
      return null
    }
  })

  const navigate = useNavigate()

  const login = (userData, token) => {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('auth', JSON.stringify(userData))  // ✅ Changed from 'user' to 'auth'
    setUser(userData)
    if (userData.role === 'ADMIN') {
      navigate('/recruiter')
    } else {
      navigate('/waiting')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('auth')                 // ✅ Changed from 'user' to 'auth'
    setUser(null)
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}