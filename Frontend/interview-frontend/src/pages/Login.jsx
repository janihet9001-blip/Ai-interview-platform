import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused]   = useState('')
  const { login } = useAuth()
  const vantaRef    = useRef(null)
  const vantaEffect = useRef(null)

  useEffect(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }, [])

  useEffect(() => {
    const loadScript = (src) =>
      new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script')
        s.src = src
        s.onload = resolve
        document.head.appendChild(s)
      })

    const init = async () => {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js')
      await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js')
      if (vantaRef.current && !vantaEffect.current && window.VANTA) {
        vantaEffect.current = window.VANTA.GLOBE({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1.0,
          scaleMobile: 1.0,
          color: 0x2563eb,
          color2: 0x93c5fd,
          backgroundColor: 0xf5f9ff,
          points: 13,
          maxDistance: 24,
          spacing: 18,
        })
      }
    }

    init()
    return () => {
      if (vantaEffect.current) { vantaEffect.current.destroy(); vantaEffect.current = null }
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login({ id: data.id, email: data.email, fullName: data.fullName, role: data.role }, data.token)
    } catch {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div className="l-page">

      {/* Vanta globe background */}
      <div ref={vantaRef} className="l-bg" />

      {/* Ambient glow orbs */}
      <div className="l-ambient">
        <div className="l-orb l-orb-1" />
        <div className="l-orb l-orb-2" />
        <div className="l-orb l-orb-3" />
      </div>

      {/* Perimeter grid */}
      <div className="l-grid" />

      {/* Expanding rings */}
      <div className="l-rings">
        {[0, 2.5, 5, 7.5].map((d, i) => (
          <div key={i} className="l-ring" style={{ animationDelay: `${d}s` }} />
        ))}
      </div>

      {/* Floating particles */}
      <div className="l-particles">
        {Array.from({ length: 26 }).map((_, i) => (
          <div
            key={i}
            className="l-particle"
            style={{
              left: `${Math.random() * 100}%`,
              width:  `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              animationDuration: `${Math.random() * 13 + 9}s`,
              animationDelay:    `${Math.random() * 12}s`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="l-card">

        {/* Brand */}
        <div className="l-brand">
          <div className="l-logo-mark">AI</div>
          <span className="l-brand-name">
            Interview<span className="l-brand-accent">AI</span>
          </span>
        </div>

        <h1 className="l-heading">Welcome back.</h1>
        <p className="l-sub">Secure access &bull; premium experience</p>

        <form onSubmit={handleLogin}>

          {/* Email */}
          <div className={`l-field${focused === 'email' ? ' l-field--active' : ''}`}>
            <label className="l-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="2" y="4" width="20" height="16" rx="3"/>
                <path d="m2 7 10 7 10-7"/>
              </svg>
              Email address
            </label>
            <div className="l-input-wrap">
              <input
                type="email"
                className="l-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className={`l-field${focused === 'pass' ? ' l-field--active' : ''}`}>
            <label className="l-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Password
            </label>
            <div className="l-input-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                className="l-input"
                placeholder="··········"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused('pass')}
                onBlur={() => setFocused('')}
                required
              />
              <button
                type="button"
                className="l-eye"
                onClick={() => setShowPass(p => !p)}
                tabIndex={-1}
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember / Forgot row */}
          <div className="l-row">
            <label
              className={`l-remember${remember ? ' l-remember--on' : ''}`}
              onClick={() => setRemember(p => !p)}
            >
              <div className={`l-check${remember ? ' l-check--on' : ''}`}>
                {remember && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4l2.5 2.5L9 1"/>
                  </svg>
                )}
              </div>
              Remember me
            </label>
            <button type="button" className="l-forgot">Forgot password?</button>
          </div>

          {/* Error */}
          {error && (
            <div className="l-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="l-btn" disabled={loading}>
            {loading && <span className="l-spinner" />}
            {loading ? 'Signing in...' : 'Sign in to InterviewAI'}
          </button>

        </form>

        <div className="l-divider"><span>or</span></div>

        <p className="l-register">
          No account yet?{' '}
          <Link to="/register">Create one free &rarr;</Link>
        </p>

        {/* Trust badges */}
        <div className="l-badges">
          <span className="l-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            End-to-end encrypted
          </span>
          <span className="l-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
            Zero-trust secure
          </span>
          <span className="l-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M20 12v6H4v-6M12 2v12m-3-3 3 3 3-3"/>
            </svg>
            Premium AI
          </span>
        </div>

        <p className="l-footer">
          By signing in you agree to our{' '}
          <span>Terms of Service</span> and <span>Privacy Policy</span>.
        </p>

      </div>
    </div>
  )
}
