import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // 1. Register user
      const { data } = await api.post('/auth/register', { fullName, email, password })

      // 2. Upload resume if provided — failure doesn't block login
      if (resumeFile) {
        try {
          const formData = new FormData()
          formData.append('file', resumeFile)
          await fetch(`${import.meta.env.VITE_API_URL}/users/upload-resume`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${data.token}` },
            body: formData,
          })
        } catch {
          // resume upload failed silently — user still logs in
        }
      }

      // 3. Login
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
              <label style={labelStyle}>Full name</label>
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
              <label style={labelStyle}>Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Password</label>
              <input
                className="input"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Resume Upload */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>
                Resume
                <span style={{
                  marginLeft: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  textTransform: 'none',
                  letterSpacing: 0,
                }}>
                  optional · PDF only
                </span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: resumeFile ? '#10B98110' : 'var(--surface2)',
                border: `1px dashed ${resumeFile ? '#10B98160' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <input
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={e => setResumeFile(e.target.files[0] || null)}
                />

                {/* Icon */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: resumeFile ? '#10B98120' : 'var(--surface3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {resumeFile ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {resumeFile ? (
                    <>
                      <p style={{
                        margin: 0, fontSize: '13px', fontWeight: '600',
                        color: '#10B981', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {resumeFile.name}
                      </p>
                      <p style={{
                        margin: '2px 0 0', fontSize: '11px',
                        color: 'var(--text-dim)', fontFamily: 'var(--font-mono)',
                      }}>
                        {(resumeFile.size / 1024).toFixed(0)} KB · click to change
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)', fontWeight: '500' }}>
                        Click to upload resume
                      </p>
                      <p style={{
                        margin: '2px 0 0', fontSize: '11px',
                        color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                      }}>
                        Recruiter will see this during screening
                      </p>
                    </>
                  )}
                </div>

                {/* Remove */}
                {resumeFile && (
                  <div
                    onClick={e => { e.preventDefault(); setResumeFile(null) }}
                    style={{
                      padding: '4px', borderRadius: '6px', cursor: 'pointer',
                      color: 'var(--text-muted)', flexShrink: 0,
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </div>
                )}
              </label>
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
              style={{ width: '100%', padding: '14px', fontSize: '15px' }}
            >
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

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-dim)',
  marginBottom: '8px',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
}