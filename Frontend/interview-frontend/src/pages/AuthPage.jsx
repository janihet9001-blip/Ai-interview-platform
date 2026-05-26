import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

  .ap-page {
    position: fixed !important;
    inset: 0 !important;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #020816;
    font-family: 'DM Sans', sans-serif;
    z-index: 0;
  }
  .ap-vanta {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 0 !important;
  }
  .ap-particles {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 1; overflow: hidden;
  }
  .ap-particle {
    position: absolute; bottom: -10px; border-radius: 50%;
    background: linear-gradient(135deg, #60a5fa, #06b6d4);
    animation: apRise linear infinite;
  }
  @keyframes apRise {
    0%   { transform: translateY(0) scale(1); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.5; }
    100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
  }
  .ap-rings {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: 1;
  }
  .ap-ring {
    position: absolute; border-radius: 50%;
    border: 1px solid rgba(37,99,235,.20);
    width: 80px; height: 80px;
    animation: apRing 11s ease-out infinite;
  }
  @keyframes apRing {
    0%   { width: 80px;  height: 80px;  opacity: 0.7; }
    100% { width: 900px; height: 900px; opacity: 0; }
  }
  .ap-top-badge {
    position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 8px; padding: 6px 18px;
    background: rgba(4,6,24,.78);
    border: 1px solid rgba(96,165,250,.28); border-radius: 50px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    letter-spacing: 2px; color: rgba(120,190,255,.9);
    white-space: nowrap; backdrop-filter: blur(12px); z-index: 10;
  }
  .ap-badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e; box-shadow: 0 0 8px #22c55e;
    flex-shrink: 0; animation: apDot 1.8s ease-in-out infinite;
  }
  @keyframes apDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.3)} }
  .ap-chip {
    position: absolute; display: flex; flex-direction: column;
    align-items: center; padding: 10px 16px;
    background: rgba(4,8,36,.72);
    border: 1px solid rgba(80,160,255,.22); border-radius: 14px;
    backdrop-filter: blur(12px); z-index: 10;
    animation: apChip 5s ease-in-out infinite;
  }
  .ap-chip-v { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #fff; line-height: 1; }
  .ap-chip-l { font-size: 9.5px; color: rgba(96,165,250,.82); font-weight: 600; letter-spacing: .5px; margin-top: 3px; font-family: 'JetBrains Mono', monospace; }
  .ap-chip-a { top: 18%; left: 5%; animation-delay: 0s; }
  .ap-chip-b { top: 18%; right: 5%; animation-delay: 1.6s; }
  .ap-chip-c { bottom: 22%; right: 5%; animation-delay: 3.2s; }
  @keyframes apChip { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

  /* ── MAIN CARD ── */
  .ap-card {
    position: relative; z-index: 20;
    width: 820px; max-width: 96vw; height: 540px;
    border-radius: 24px; overflow: hidden;
    box-shadow: 0 30px 80px rgba(0,0,0,.7), 0 0 0 1px rgba(80,140,255,.12);
    animation: apCard .6s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes apCard {
    from { opacity:0; transform:translateY(28px) scale(.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }

  /* ── SIGN IN FORM ── */
  .ap-signin {
    position: absolute; top: 0; left: 0;
    width: 50%; height: 100%;
    background: #f0f4ff;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 36px 44px; box-sizing: border-box;
    transition: all .6s ease-in-out;
    z-index: 2;
  }
  .ap-signin.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateX(10%);
  }

  /* ── SIGN UP FORM ── */
  .ap-signup {
    position: absolute; top: 0; right: 0;
    width: 50%; height: 100%;
    background: #f0f4ff;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 32px 44px; box-sizing: border-box;
    transition: all .6s ease-in-out;
    z-index: 2;
    overflow-y: auto;
  }
  .ap-signup.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateX(-10%);
  }

  /* ── BLUE OVERLAY PANEL ── */
  .ap-overlay {
    position: absolute; top: 0; left: 50%;
    width: 50%; height: 100%; z-index: 10;
    background: linear-gradient(145deg, #2563eb 0%, #1d4ed8 55%, #1e3a8a 100%);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 40px 36px; text-align: center;
    transition: transform .6s ease-in-out;
    overflow: hidden;
  }
  /* Login mode: blue rests on the right */
  .ap-overlay.login-mode {
    transform: translateX(0);
  }
  /* Register mode: blue slides over to the left */
  .ap-overlay.register-mode {
    transform: translateX(-100%);
  }
  
  .ap-overlay::before {
    content: ''; position: absolute;
    top: -80px; right: -80px;
    width: 260px; height: 260px; border-radius: 50%;
    background: rgba(255,255,255,.07); pointer-events: none;
  }
  .ap-overlay::after {
    content: ''; position: absolute;
    bottom: -100px; left: -60px;
    width: 300px; height: 300px; border-radius: 50%;
    background: rgba(255,255,255,.05); pointer-events: none;
  }
  .ap-overlay-title {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
    color: #fff; margin-bottom: 14px; position: relative; z-index: 1;
    line-height: 1.2;
  }
  .ap-overlay-sub {
    font-size: 13.5px; color: rgba(255,255,255,.78); line-height: 1.7;
    margin-bottom: 32px; position: relative; z-index: 1;
  }
  .ap-overlay-btn {
    padding: 12px 36px; border-radius: 50px;
    border: 2px solid rgba(255,255,255,.9); background: transparent;
    color: #fff; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: .5px;
    transition: background .2s, transform .15s, box-shadow .2s;
    position: relative; z-index: 1;
  }
  .ap-overlay-btn:hover {
    background: rgba(255,255,255,.18);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,.2);
  }

  /* ── SHARED FORM ELEMENTS ── */
  .ap-brand {
    display: flex; align-items: center; gap: 10px; margin-bottom: 18px;
  }
  .ap-logo {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #2563eb, #06b6d4);
    border-radius: 10px; display: flex; align-items: center; justify-content: center;
  }
  .ap-brand-name {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #1e293b;
  }
  .ap-brand-name span { color: #2563eb; }
  .ap-form-title {
    font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800;
    color: #1e293b; margin-bottom: 4px; text-align: center;
  }
  .ap-form-sub { font-size: 12.5px; color: #64748b; margin-bottom: 16px; text-align: center; }
  .ap-social-row { display: flex; gap: 10px; margin-bottom: 12px; }
  .ap-social-btn {
    width: 38px; height: 38px; border-radius: 50%;
    border: 1.5px solid #cbd5e1; background: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: border-color .2s, transform .15s, box-shadow .2s;
  }
  .ap-social-btn:hover {
    border-color: #3b82f6; transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59,130,246,.2);
  }
  .ap-or { font-size: 11px; color: #94a3b8; margin-bottom: 12px; font-family: 'JetBrains Mono', monospace; }
  .ap-input {
    width: 100%; padding: 11px 16px;
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px;
    color: #1e293b; font-family: 'DM Sans', sans-serif; font-size: 14px;
    outline: none; margin-bottom: 10px; box-sizing: border-box;
    transition: border-color .2s, box-shadow .2s;
  }
  .ap-input::placeholder { color: #94a3b8; }
  .ap-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
  .ap-input-wrap { position: relative; width: 100%; }
  .ap-eye {
    position: absolute; right: 12px; top: 50%; transform: translateY(-60%);
    background: none; border: none; cursor: pointer; color: #94a3b8;
    transition: color .15s; padding: 2px;
  }
  .ap-eye:hover { color: #3b82f6; }
  .ap-row {
    display: flex; justify-content: space-between; align-items: center;
    width: 100%; margin-bottom: 14px;
  }
  .ap-remember {
    display: flex; align-items: center; gap: 7px;
    font-size: 13px; color: #64748b; cursor: pointer;
  }
  .ap-chk {
    width: 15px; height: 15px; border-radius: 4px;
    border: 1.5px solid #cbd5e1; background: #fff;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: all .2s;
  }
  .ap-chk-on { background: #2563eb; border-color: #2563eb; }
  .ap-forgot {
    background: none; border: none; font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 600; color: #3b82f6; cursor: pointer;
    transition: color .2s; padding: 0;
  }
  .ap-forgot:hover { color: #2563eb; }
  .ap-btn {
    width: 100%; padding: 12px;
    background: #2563eb; border: none; border-radius: 50px;
    color: #fff; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    position: relative; overflow: hidden;
    transition: background .2s, transform .15s, box-shadow .2s;
  }
  .ap-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
    transform: translateX(-100%); transition: transform .5s ease;
  }
  .ap-btn:hover::after { transform: translateX(100%); }
  .ap-btn:hover:not(:disabled) {
    background: #1d4ed8; transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(37,99,235,.4);
  }
  .ap-btn:disabled { opacity: .55; cursor: not-allowed; }
  .ap-spinner {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
    border-radius: 50%; animation: apSpin .65s linear infinite;
  }
  @keyframes apSpin { to{transform:rotate(360deg)} }
  .ap-error {
    width: 100%; padding: 10px 14px; background: #fee2e2;
    border: 1px solid #fca5a5; border-radius: 8px;
    color: #dc2626; font-size: 13px; margin-bottom: 10px;
    animation: apErr .3s ease;
  }
  @keyframes apErr { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:translateY(0)} }

  /* Resume upload */
  .ap-upload {
    width: 100%; display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 10px; cursor: pointer;
    box-sizing: border-box; margin-bottom: 10px; transition: all .2s;
  }
  .ap-upload-icon {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }

  @media(max-width: 700px) {
    .ap-card { flex-direction: column; height: auto; width: 92vw; }
    .ap-signin, .ap-signup { position: relative; width: 100%; height: auto; transform: none !important; opacity: 1; }
    .ap-signin.hidden, .ap-signup.hidden { display: none; }
    .ap-overlay { position: relative; width: 100%; height: 200px; border-radius: 16px !important; left: 0; transform: none !important; }
    .ap-chip-a,.ap-chip-b,.ap-chip-c { display: none; }
  }
`

const SocialButtons = () => (
  <div className="ap-social-row">
    <div className="ap-social-btn" title="Facebook">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    </div>
    <div className="ap-social-btn" title="Google">
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    </div>
    <div className="ap-social-btn" title="LinkedIn">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="#0077b5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </div>
  </div>
)

export default function AuthPage() {
  const [mode, setMode] = useState('login') // 'login' | 'register'

  // Login state
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register state
  const [fullName,   setFullName]   = useState('')
  const [regEmail,   setRegEmail]   = useState('')
  const [regPass,    setRegPass]    = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [regErr,     setRegErr]     = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const { login } = useAuth()
  const vantaRef    = useRef(null)
  const vantaEffect = useRef(null)

  useEffect(() => {
    if (!document.getElementById('ap-styles')) {
      const el = document.createElement('style')
      el.id = 'ap-styles'; el.textContent = STYLES
      document.head.appendChild(el)
    }
    return () => { document.getElementById('ap-styles')?.remove() }
  }, [])

  useEffect(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }, [])

  useEffect(() => {
    const loadScript = (src) =>
      new Promise((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script')
        s.src = src; s.onload = resolve
        document.head.appendChild(s)
      })
    const init = async () => {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js')
      await loadScript('https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.globe.min.js')
      if (vantaRef.current && !vantaEffect.current && window.VANTA) {
        vantaEffect.current = window.VANTA.GLOBE({
          el: vantaRef.current, mouseControls: true, touchControls: true,
          gyroControls: false, minHeight: 200, minWidth: 200,
          scale: 1.0, scaleMobile: 1.0,
          color: 0x3b82f6, color2: 0x60a5fa, backgroundColor: 0x020816,
          points: 14, maxDistance: 22, spacing: 18,
        })
      }
    }
    init()
    return () => { if (vantaEffect.current) { vantaEffect.current.destroy(); vantaEffect.current = null } }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true); setLoginErr('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login({ id: data.id, email: data.email, fullName: data.fullName, role: data.role }, data.token)
    } catch {
      setLoginErr('Invalid email or password')
      setLoginLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegLoading(true); setRegErr('')
    try {
      const { data } = await api.post('/auth/register', { fullName, email: regEmail, password: regPass })
      if (resumeFile) {
        try {
          const formData = new FormData()
          formData.append('file', resumeFile)
          await fetch(`${import.meta.env.VITE_API_URL}/users/upload-resume`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${data.token}` },
            body: formData,
          })
        } catch { /* silent */ }
      }
      login({ id: data.id, email: data.email, fullName: data.fullName, role: data.role }, data.token)
    } catch {
      setRegErr('Registration failed. Email may already be in use.')
      setRegLoading(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <div className="ap-page">
      <div ref={vantaRef} className="ap-vanta" />

      <div className="ap-particles">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="ap-particle" style={{
            left: `${(i * 37 + 11) % 100}%`,
            width: `${(i % 3) + 2}px`, height: `${(i % 3) + 2}px`,
            animationDuration: `${10 + (i % 7) * 2}s`,
            animationDelay: `${(i * 1.3) % 11}s`,
            opacity: 0.25 + (i % 4) * 0.12,
          }} />
        ))}
      </div>

      <div className="ap-rings">
        {[0, 2.5, 5, 7.5].map((d, i) => (
          <div key={i} className="ap-ring" style={{ animationDelay: `${d}s` }} />
        ))}
      </div>

      <div className="ap-top-badge">
        <span className="ap-badge-dot" />
        NEURAL NETWORK ACTIVE
      </div>

      <div className="ap-chip ap-chip-a"><span className="ap-chip-v">98%</span><span className="ap-chip-l">Accuracy</span></div>
      <div className="ap-chip ap-chip-b"><span className="ap-chip-v">2.4s</span><span className="ap-chip-l">Response</span></div>
      <div className="ap-chip ap-chip-c"><span className="ap-chip-v">50k+</span><span className="ap-chip-l">Interviews</span></div>

      {/* ── MAIN CARD ── */}
      <div className="ap-card">

        {/* Sign In Form */}
        <div className={`ap-signin${isLogin ? '' : ' hidden'}`}>
          <div className="ap-brand">
            <div className="ap-logo">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="24" rx="6" stroke="white" strokeWidth="1.5"/>
                <path d="M12 14L16 18L20 14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="2.5" fill="white"/>
              </svg>
            </div>
            <span className="ap-brand-name">Interview<span>AI</span></span>
          </div>

          <h2 className="ap-form-title">Sign In</h2>
          <p className="ap-form-sub">or use your account</p>
          <SocialButtons />
          <p className="ap-or">or use your account</p>

          <form onSubmit={handleLogin} autoComplete="off" style={{ width: '100%' }}>
            <input
              type="email" className="ap-input"
              placeholder="Email Address"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
            <div className="ap-input-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                className="ap-input" style={{ paddingRight: '40px' }}
                placeholder="Password"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
              <button type="button" className="ap-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            <div className="ap-row">
              <label className="ap-remember" onClick={() => setRemember(p => !p)}>
                <div className={`ap-chk${remember ? ' ap-chk-on' : ''}`}>
                  {remember && (
                    <svg width="9" height="7" viewBox="0 0 10 8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4l2.5 2.5L9 1"/>
                    </svg>
                  )}
                </div>
                Remember me
              </label>
              <button type="button" className="ap-forgot">Forgot password?</button>
            </div>

            {loginErr && <div className="ap-error">{loginErr}</div>}

            <button type="submit" className="ap-btn" disabled={loginLoading}>
              {loginLoading && <span className="ap-spinner" />}
              {loginLoading ? 'Signing in…' : 'SIGN IN'}
            </button>
          </form>
        </div>

        {/* Sign Up Form */}
        <div className={`ap-signup${isLogin ? ' hidden' : ''}`}>
          <h2 className="ap-form-title">Create Account</h2>
          <p className="ap-form-sub">or use your email for registration</p>
          <SocialButtons />
          <p className="ap-or">or use your email for registration</p>

          <form onSubmit={handleRegister} style={{ width: '100%' }}>
            <input
              type="text" className="ap-input"
              placeholder="Full Name"
              value={fullName} onChange={e => setFullName(e.target.value)} required
            />
            <input
              type="email" className="ap-input"
              placeholder="Email Address"
              value={regEmail} onChange={e => setRegEmail(e.target.value)} required
            />
            <input
              type="password" className="ap-input"
              placeholder="Password (min 8 characters)"
              value={regPass} onChange={e => setRegPass(e.target.value)} required
            />

            <label className="ap-upload" style={{
              background: resumeFile ? '#10B98110' : '#fff',
              border: `1.5px dashed ${resumeFile ? '#10B98160' : '#e2e8f0'}`,
            }}>
              <input type="file" accept=".pdf" style={{ display: 'none' }}
                onChange={e => setResumeFile(e.target.files[0] || null)} />
              <div className="ap-upload-icon" style={{ background: resumeFile ? '#10B98120' : '#f1f5f9' }}>
                {resumeFile ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {resumeFile ? (
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: '#10B981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {resumeFile.name}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Resume <span style={{ fontSize: '11px', color: '#94a3b8' }}>optional · PDF only</span>
                  </p>
                )}
              </div>
              {resumeFile && (
                <div onClick={e => { e.preventDefault(); setResumeFile(null) }}
                  style={{ padding: '4px', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
              )}
            </label>

            {regErr && <div className="ap-error">{regErr}</div>}

            <button type="submit" className="ap-btn" disabled={regLoading}>
              {regLoading && <span className="ap-spinner" />}
              {regLoading ? 'Creating account…' : 'SIGN UP'}
            </button>
          </form>
        </div>

        {/* ── SLIDING BLUE PANEL ── */}
        <div className={`ap-overlay ${isLogin ? 'login-mode' : 'register-mode'}`}>
          {isLogin ? (
            <>
              <h2 className="ap-overlay-title">Hey There!</h2>
              <p className="ap-overlay-sub">Begin your amazing journey by creating<br />an account with us today</p>
              <button className="ap-overlay-btn" onClick={() => setMode('register')}>SIGN UP</button>
            </>
          ) : (
            <>
              <h2 className="ap-overlay-title">Welcome Back!</h2>
              <p className="ap-overlay-sub">Stay connected by logging in with your<br />credentials and continue your experience</p>
              <button className="ap-overlay-btn" onClick={() => setMode('login')}>SIGN IN</button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
