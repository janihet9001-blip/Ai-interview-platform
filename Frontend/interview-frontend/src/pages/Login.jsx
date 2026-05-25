import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --bg-primary: #F8FAFC;
    --bg-secondary: #FFFFFF;
    --bg-tertiary: #F1F5F9;
    --accent-50: #EEF2FF;
    --accent-100: #E0E7FF;
    --accent-200: #C7D2FE;
    --accent-500: #6366F1;
    --accent-600: #4F46E5;
    --accent-700: #4338CA;
    --text-primary: #0F172A;
    --text-secondary: #334155;
    --text-tertiary: #64748B;
    --text-quaternary: #94A3B8;
    --border-light: #E2E8F0;
    --border-medium: #CBD5E1;
    --border-focus: #818CF8;
    --success: #10B981;
    --success-bg: #ECFDF5;
    --error: #EF4444;
    --error-bg: #FEF2F2;
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --transition-fast: 150ms ease;
    --transition-base: 200ms ease;
    --transition-smooth: 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    background: var(--bg-primary);
  }

  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #F8FAFC 0%, #EEF2FF 50%, #E0E7FF 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .bg-pattern {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.4;
    background-image: 
      radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.06) 0%, transparent 50%),
      radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.02) 0%, transparent 50%);
  }

  .bg-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.3;
    background-image: 
      linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .login-container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 440px;
    animation: fadeInUp 0.5s ease both;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .auth-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-xl);
    padding: 44px 40px 36px;
    box-shadow: var(--shadow-xl);
  }

  .brand-section {
    text-align: center;
    margin-bottom: 36px;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #6366F1, #4F46E5);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
  }

  .logo-icon svg {
    width: 26px;
    height: 26px;
  }

  .brand-name {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }

  .brand-accent {
    color: var(--accent-500);
  }

  .brand-tagline {
    font-size: 14px;
    color: var(--text-tertiary);
    font-weight: 400;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: -0.1px;
  }

  .input-wrap {
    position: relative;
  }

  .input {
    width: 100%;
    padding: 12px 16px;
    background: var(--bg-primary);
    border: 1.5px solid var(--border-light);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    outline: none;
    transition: all var(--transition-base);
  }

  .input::placeholder {
    color: var(--text-quaternary);
    font-weight: 400;
  }

  .input:hover {
    border-color: var(--border-medium);
  }

  .input:focus {
    border-color: var(--border-focus);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
  }

  .input-padding-right {
    padding-right: 44px;
  }

  .toggle-password {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--text-quaternary);
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: all var(--transition-fast);
  }

  .toggle-password:hover {
    color: var(--accent-500);
    background: var(--accent-50);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .remember {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }

  .checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid var(--border-medium);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }

  .checkbox.active {
    background: var(--accent-500);
    border-color: var(--accent-500);
  }

  .remember-text {
    font-size: 13px;
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .forgot-link {
    background: none;
    border: none;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent-500);
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .forgot-link:hover {
    color: var(--accent-700);
  }

  .error-box {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--error-bg);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--radius-md);
    color: var(--error);
    font-size: 13px;
    font-weight: 500;
  }

  .error-icon {
    flex-shrink: 0;
  }

  .submit-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #6366F1, #4F46E5);
    border: none;
    border-radius: var(--radius-md);
    color: white;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-smooth);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    letter-spacing: 0.2px;
  }

  .submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4F46E5, #4338CA);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
    transform: translateY(-1px);
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 20px 0;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: var(--border-light);
  }

  .divider-text {
    font-size: 12px;
    color: var(--text-quaternary);
    font-weight: 500;
  }

  .register-row {
    text-align: center;
    margin-bottom: 20px;
  }

  .register-text {
    font-size: 14px;
    color: var(--text-tertiary);
  }

  .register-link {
    color: var(--accent-500);
    font-weight: 600;
    text-decoration: none;
    margin-left: 4px;
    transition: color var(--transition-fast);
  }

  .register-link:hover {
    color: var(--accent-700);
  }

  .features {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .feature-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--accent-50);
    border: 1px solid var(--accent-100);
    border-radius: 100px;
    font-size: 11px;
    color: var(--accent-600);
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  .badge-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-500);
    flex-shrink: 0;
  }

  .footer-text {
    text-align: center;
    font-size: 12px;
    color: var(--text-quaternary);
    line-height: 1.6;
  }

  .footer-link {
    color: var(--text-tertiary);
    cursor: pointer;
    font-weight: 500;
    transition: color var(--transition-fast);
  }

  .footer-link:hover {
    color: var(--accent-500);
  }

  @media (max-width: 480px) {
    .auth-card {
      padding: 32px 20px 28px;
      border-radius: var(--radius-lg);
    }
    .brand-name {
      font-size: 22px;
    }
    .login-container {
      padding: 0;
    }
  }
`

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()

  useEffect(() => {
    if (!document.getElementById('clean-login-styles')) {
      const el = document.createElement('style')
      el.id = 'clean-login-styles'
      el.textContent = STYLES
      document.head.appendChild(el)
    }
    return () => {
      const el = document.getElementById('clean-login-styles')
      if (el) el.remove()
    }
  }, [])

  useEffect(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(
        { id: data.id, email: data.email, fullName: data.fullName, role: data.role },
        data.token
      )
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password. Please try again.'
      setError(message)
      setLoading(false)
    }
  }, [email, password, login])

  const features = useMemo(() => [
    'SOC2 Compliant',
    '256-bit Encryption',
    '99.9% Uptime'
  ], [])

  return (
    <div className="login-page">
      <div className="bg-pattern" />
      <div className="bg-grid" />

      <div className="login-container">
        <div className="auth-card">
          <div className="brand-section">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.5 7.5L20 8L16 12.5L17 18L12 15L7 18L8 12.5L4 8L9.5 7.5L12 2Z" fill="white" />
              </svg>
            </div>
            <h1 className="brand-name">
              Interview<span className="brand-accent">AI</span>
            </h1>
            <p className="brand-tagline">Sign in to your account</p>
          </div>

          <form className="form" onSubmit={handleSubmit} autoComplete="off">
            <div className="field">
              <label className="field-label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input input-padding-right"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPass(prev => !prev)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="row">
              <div className="remember" onClick={() => setRemember(prev => !prev)}>
                <div className={`checkbox${remember ? ' active' : ''}`}>
                  {remember && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4l3 3 5-6" />
                    </svg>
                  )}
                </div>
                <span className="remember-text">Remember me</span>
              </div>
              <button type="button" className="forgot-link">Forgot password?</button>
            </div>

            {error && (
              <div className="error-box">
                <svg className="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading && <div className="spinner" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-text">or</span>
            <div className="divider-line" />
          </div>

          <div className="register-row">
            <span className="register-text">
              Don&apos;t have an account?
              <Link to="/register" className="register-link">Create one</Link>
            </span>
          </div>

          <div className="features">
            {features.map((item) => (
              <div key={item} className="feature-badge">
                <span className="badge-dot" />
                {item}
              </div>
            ))}
          </div>

          <p className="footer-text">
            By signing in, you agree to our{' '}
            <span className="footer-link">Terms of Service</span> and{' '}
            <span className="footer-link">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}