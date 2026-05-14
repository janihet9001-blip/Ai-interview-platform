import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/register', { fullName, email, password })
      login({ id: data.id, email: data.email, fullName: data.fullName, role: data.role }, data.token)
    } catch {
      setError('Registration failed. Email may already be in use.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        animation: 'fadeUp 0.5s ease forwards',
      }}>

        {/* Logo */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '32px',
          }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: '800', fontSize: '16px', color: 'white',
            }}>AI</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800' }}>
              InterviewAI
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: '800',
            lineHeight: 1.2,
            marginBottom: '8px',
          }}>
            Create account
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>
            Start your interview preparation today
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
        }}>
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Full name
              </label>
              <input
                className="input"
                type="text"
                placeholder="Jay Candidate"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Email address
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)', marginBottom: '8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Password
              </label>
              <input
                className="input"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div style={{
                background: '#EF444415',
                border: '1px solid #EF444440',
                borderRadius: 'var(--radius)',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '14px',
                color: '#F87171',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-dim)', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--cyan)', textDecoration: 'none', fontWeight: '600' }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}