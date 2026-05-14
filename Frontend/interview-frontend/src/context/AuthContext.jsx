import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  // sessionStorage clears when tab closes — forces re-login like Google
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('user')
      const token = sessionStorage.getItem('token')
      if (!saved || !token) return null
      const parsed = JSON.parse(saved)
      if (!parsed?.id || !parsed?.role || !parsed?.email) {
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('token')
        return null
      }
      return parsed
    } catch {
      sessionStorage.removeItem('user')
      sessionStorage.removeItem('token')
      return null
    }
  })

  const navigate = useNavigate()

const login = (userData, token) => {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    if (userData.role === 'ADMIN') {
      navigate('/recruiter')
    } else {
      navigate('/waiting')
    }
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
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