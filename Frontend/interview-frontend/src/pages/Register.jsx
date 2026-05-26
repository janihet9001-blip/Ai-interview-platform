import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import PropTypes from 'prop-types'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false })
  const { login } = useAuth()
  const navigate = useNavigate()
  const abortControllerRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Validation functions
  const validateFullName = useCallback((name) => {
    if (!name.trim()) return 'Full name is required'
    if (name.trim().length < 2) return 'Full name must be at least 2 characters'
    if (name.trim().length > 100) return 'Full name must be less than 100 characters'
    return null
  }, [])

  const validateEmail = useCallback((emailValue) => {
    if (!emailValue.trim()) return 'Email is required'
    const emailRegex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/
    if (!emailRegex.test(emailValue)) return 'Please enter a valid email address'
    if (emailValue.length > 255) return 'Email must be less than 255 characters'
    return null
  }, [])

  const validatePassword = useCallback((pass) => {
    if (!pass) return 'Password is required'
    if (pass.length < 8) return 'Password must be at least 8 characters'
    if (pass.length > 100) return 'Password must be less than 100 characters'
    // Optional: Add strength check
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(pass)) return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number'
    return null
  }, [])

  const validateResume = useCallback((file) => {
    if (!file) return null
    if (file.type !== 'application/pdf') return 'Only PDF files are allowed'
    if (file.size > 5 * 1024 * 1024) return 'File size must be less than 5MB'
    return null
  }, [])

  // Get field errors
  const fullNameError = touched.fullName ? validateFullName(fullName) : null
  const emailError = touched.email ? validateEmail(email) : null
  const passwordError = touched.password ? validatePassword(password) : null
  const resumeError = resumeFile ? validateResume(resumeFile) : null

  const isFormValid = () => {
    return !validateFullName(fullName) && 
           !validateEmail(email) && 
           !validatePassword(password) &&
           !validateResume(resumeFile)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    
    // Validate all fields before submission
    const fullNameValidationError = validateFullName(fullName)
    const emailValidationError = validateEmail(email)
    const passwordValidationError = validatePassword(password)
    const resumeValidationError = validateResume(resumeFile)
    
    if (fullNameValidationError || emailValidationError || passwordValidationError || resumeValidationError) {
      setError(fullNameValidationError || emailValidationError || passwordValidationError || resumeValidationError || 'Please fix the errors above')
      setTouched({ fullName: true, email: true, password: true })
      return
    }
    
    setLoading(true)
    setError('')
    
    // Create abort controller for this request
    abortControllerRef.current = new AbortController()
    
    try {
      // 1. Register user
      const { data } = await api.post('/auth/register', { 
        fullName: fullName.trim(), 
        email: email.trim().toLowerCase(), 
        password 
      })

      // 2. Upload resume if provided — failure doesn't block login but log error
      if (resumeFile) {
        try {
          const formData = new FormData()
          formData.append('file', resumeFile)
          await fetch(`${import.meta.env.VITE_API_URL}/users/upload-resume`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${data.token}` },
            body: formData,
            signal: abortControllerRef.current.signal
          })
        } catch (uploadErr) {
          if (uploadErr.name !== 'AbortError') {
            console.error('Resume upload failed:', uploadErr)
            // Don't block registration, but show warning
            setError('Account created but resume upload failed. You can upload later.')
          }
        }
      }

      // 3. Login
      login(
        { 
          id: data.id, 
          email: data.email, 
          fullName: data.fullName, 
          role: data.role 
        }, 
        data.token
      )
    } catch (err) {
      console.error('Registration error:', err)
      if (err.response?.status === 409) {
        setError('An account with this email already exists. Please login instead.')
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid registration data. Please check your inputs.')
      } else if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      } else {
        setError('Registration failed. Please try again later.')
      }
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null
    if (file) {
      const validationError = validateResume(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }
    setResumeFile(file)
    setError('')
  }

  const removeFile = (e) => {
    e.preventDefault()
    setResumeFile(null)
    setError('')
  }

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)',
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
          <form onSubmit={handleRegister} noValidate>

            {/* Full Name Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Full name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                className="input"
                type="text"
                placeholder="Jay Candidate"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                onBlur={() => handleBlur('fullName')}
                required
                aria-invalid={!!fullNameError}
                aria-describedby={fullNameError ? "fullNameError" : undefined}
                style={{
                  borderColor: fullNameError ? '#EF4444' : undefined,
                }}
              />
              {fullNameError && (
                <p id="fullNameError" style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#EF4444',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {fullNameError}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Email address <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                required
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "emailError" : undefined}
                style={{
                  borderColor: emailError ? '#EF4444' : undefined,
                }}
              />
              {emailError && (
                <p id="emailError" style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#EF4444',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>
                Password <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                className="input"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                required
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "passwordError" : undefined}
                style={{
                  borderColor: passwordError ? '#EF4444' : undefined,
                }}
              />
              {passwordError && (
                <p id="passwordError" style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#EF4444',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {passwordError}
                </p>
              )}
              {!touched.password && !passwordError && (
                <p style={{
                  marginTop: '6px',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Must contain uppercase, lowercase, and number (min 8 chars)
                </p>
              )}
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
                  optional · PDF only · Max 5MB
                </span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                background: resumeFile ? '#10B98110' : 'var(--surface2)',
                border: `1px dashed ${resumeFile ? '#10B98160' : resumeError ? '#EF4444' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <input
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
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
                        Recruiters use this for screening
                      </p>
                    </>
                  )}
                </div>

                {/* Remove */}
                {resumeFile && (
                  <div
                    onClick={removeFile}
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
              {resumeError && (
                <p style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#EF4444',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {resumeError}
                </p>
              )}
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
              }} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !isFormValid()}
              style={{ 
                width: '100%', 
                padding: '14px', 
                fontSize: '15px',
                opacity: loading || !isFormValid() ? 0.6 : 1,
                cursor: loading || !isFormValid() ? 'not-allowed' : 'pointer',
              }}
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
      
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
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