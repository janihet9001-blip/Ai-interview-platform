import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
    --shadow-3d: 0 20px 60px rgba(99, 102, 241, 0.12), 0 8px 20px rgba(0, 0, 0, 0.06);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --transition-fast: 150ms ease;
    --transition-base: 200ms ease;
    --transition-smooth: 300ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
    --transition-bounce: 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
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
    background: linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 40%, #E0E7FF 70%, #F8FAFC 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 24px;
    position: relative;
    overflow: hidden;
    perspective: 1000px;
  }

  .bg-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    opacity: 0.5;
  }

  .bg-orb-1 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%);
    top: -100px;
    right: -100px;
    animation: orbFloat1 8s ease-in-out infinite;
  }

  .bg-orb-2 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
    bottom: -80px;
    left: -80px;
    animation: orbFloat2 10s ease-in-out infinite;
  }

  .bg-orb-3 {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.04) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation: orbFloat3 12s ease-in-out infinite;
  }

  @keyframes orbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(-30px, 30px) scale(1.15); }
  }

  @keyframes orbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(30px, -20px) scale(1.1); }
  }

  @keyframes orbFloat3 {
    0%, 100% { transform: translate(-50%, -50%) scale(1); }
    50% { transform: translate(-50%, -50%) scale(1.2); }
  }

  .bg-grid-pattern {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.15;
    background-image: 
      linear-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.05) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 70%);
  }

  .floating-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
  }

  .particle {
    position: absolute;
    border-radius: 50%;
    background: var(--accent-500);
    opacity: 0;
    animation: particleFloat linear infinite;
  }

  @keyframes particleFloat {
    0% {
      transform: translateY(100vh) translateX(0) scale(0);
      opacity: 0;
    }
    10% {
      opacity: 0.6;
    }
    90% {
      opacity: 0.1;
    }
    100% {
      transform: translateY(-10vh) translateX(var(--drift-x)) scale(1.5);
      opacity: 0;
    }
  }

  .login-container {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 440px;
    animation: card3DEntry 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    transform-style: preserve-3d;
  }

  @keyframes card3DEntry {
    from {
      opacity: 0;
      transform: translateY(30px) rotateX(10deg) scale(0.95);
      filter: blur(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0) rotateX(0deg) scale(1);
      filter: blur(0);
    }
  }

  .auth-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-xl);
    padding: 44px 40px 36px;
    box-shadow: var(--shadow-3d);
    transform-style: preserve-3d;
    transition: all var(--transition-smooth);
    position: relative;
    overflow: hidden;
  }

  .auth-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-500), var(--accent-200), transparent);
    opacity: 0;
    transition: opacity var(--transition-smooth);
  }

  .auth-card:hover::before {
    opacity: 1;
  }

  .auth-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 30px 80px rgba(99, 102, 241, 0.15), 0 10px 30px rgba(0, 0, 0, 0.08);
  }

  .card-shine {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
      rgba(99, 102, 241, 0.03) 0%,
      transparent 50%
    );
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .auth-card:hover .card-shine {
    opacity: 1;
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
    transition: all var(--transition-spring);
    cursor: pointer;
  }

  .logo-icon:hover {
    transform: scale(1.1) rotate(10deg);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }

  .logo-icon:active {
    transform: scale(0.95) rotate(0deg);
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
    background: linear-gradient(135deg, #6366F1, #818CF8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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
    transition: color var(--transition-fast);
  }

  .field:focus-within .field-label {
    color: var(--accent-500);
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
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  }

  .input:focus {
    border-color: var(--border-focus);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.06), 0 2px 8px rgba(99, 102, 241, 0.08);
    transform: translateY(-1px);
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

  .toggle-password:active {
    transform: translateY(-50%) scale(0.9);
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
    transition: all var(--transition-spring);
    flex-shrink: 0;
  }

  .checkbox.active {
    background: var(--accent-500);
    border-color: var(--accent-500);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    transform: scale(1.1);
  }

  .remember-text {
    font-size: 13px;
    color: var(--text-tertiary);
    font-weight: 500;
    transition: color var(--transition-fast);
  }

  .remember:hover .remember-text {
    color: var(--text-secondary);
  }

  .forgot-link {
    background: none;
    border: none;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent-500);
    cursor: pointer;
    transition: all var(--transition-fast);
    padding: 4px 8px;
    border-radius: 4px;
    position: relative;
  }

  .forgot-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 8px;
    right: 8px;
    height: 1.5px;
    background: var(--accent-500);
    transform: scaleX(0);
    transition: transform var(--transition-base);
  }

  .forgot-link:hover {
    color: var(--accent-700);
    background: var(--accent-50);
  }

  .forgot-link:hover::after {
    transform: scaleX(1);
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
    animation: shakeError 0.4s ease;
  }

  @keyframes shakeError {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
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
    position: relative;
    overflow: hidden;
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.6s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4F46E5, #4338CA);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35), 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .submit-btn:hover:not(:disabled)::before {
    left: 100%;
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
    transition: all 0.1s ease;
  }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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
    transition: all var(--transition-fast);
    padding: 2px 6px;
    border-radius: 4px;
    position: relative;
  }

  .register-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 6px;
    right: 6px;
    height: 1.5px;
    background: var(--accent-500);
    transform: scaleX(0);
    transition: transform var(--transition-base);
  }

  .register-link:hover {
    color: var(--accent-700);
    background: var(--accent-50);
  }

  .register-link:hover::after {
    transform: scaleX(1);
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
    transition: all var(--transition-smooth);
    cursor: default;
  }

  .feature-badge:hover {
    background: var(--accent-100);
    border-color: var(--accent-200);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
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
    transition: all var(--transition-fast);
    position: relative;
  }

  .footer-link::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--accent-500);
    transform: scaleX(0);
    transition: transform var(--transition-base);
  }

  .footer-link:hover {
    color: var(--accent-500);
  }

  .footer-link:hover::after {
    transform: scaleX(1);
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

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`

function FloatingParticles() {
  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < 15; i++) {
      arr.push({
        id: i,
        left: Math.random() * 100 + '%',
        size: Math.random() * 4 + 2 + 'px',
        duration: Math.random() * 12 + 8 + 's',
        delay: Math.random() * 10 + 's',
        driftX: (Math.random() - 0.5) * 100 + 'px'
      })
    }
    return arr
  }, [])

  return (
    <div className="floating-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            '--drift-x': p.driftX
          }}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const cardRef = useRef(null)
  const { login } = useAuth()

  useEffect(() => {
    if (!document.getElementById('modern-login-styles')) {
      const el = document.createElement('style')
      el.id = 'modern-login-styles'
      el.textContent = STYLES
      document.head.appendChild(el)
    }
    return () => {
      const el = document.getElementById('modern-login-styles')
      if (el) el.remove()
    }
  }, [])

  useEffect(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    cardRef.current.style.setProperty('--mouse-x', x + '%')
    cardRef.current.style.setProperty('--mouse-y', y + '%')
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return
    cardRef.current.style.setProperty('--mouse-x', '50%')
    cardRef.current.style.setProperty('--mouse-y', '50%')
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
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-grid-pattern" />
      <FloatingParticles />

      <div className="login-container">
        <div
          ref={cardRef}
          className="auth-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-shine" />

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