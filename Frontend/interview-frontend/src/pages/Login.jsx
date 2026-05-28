import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState('')
  const [remainingAttempts, setRemainingAttempts] = useState(null)
  const [lockoutMinutes, setLockoutMinutes] = useState(null)
  const [rateLimitError, setRateLimitError] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'dark'
  })
  const { login } = useAuth()
  const vantaRef = useRef(null)
  const vantaEffect = useRef(null)

  // Apply theme to html element
  useEffect(() => {
    localStorage.setItem('theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockoutMinutes || lockoutMinutes <= 0) return
    
    const interval = setInterval(() => {
      setLockoutMinutes(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setLockoutMinutes(null)
          setRemainingAttempts(null)
          return null
        }
        return prev - 1
      })
    }, 60000)
    
    return () => clearInterval(interval)
  }, [lockoutMinutes])

  useEffect(() => {
    if (sessionStorage.getItem('token')) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('auth')
    }
  }, [])

  useEffect(() => {
    let retryTimer = null

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script')
        s.src = src
        s.onload = resolve
        s.onerror = reject
        document.head.appendChild(s)
      })

    const initVanta = () => {
      if (!vantaRef.current || vantaEffect.current) return
      if (!window.VANTA || !window.VANTA.GLOBE) {
        retryTimer = setTimeout(initVanta, 100)
        return
      }
      try {
        vantaEffect.current = window.VANTA.GLOBE({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
          scale: 1.0,
          scaleMobile: 1.0,
          color: theme === 'dark' ? 0x8E9AA8 : 0x475569,
          color2: theme === 'dark' ? 0x4A5568 : 0x94A3B8,
          backgroundColor: theme === 'dark' ? 0x06080D : 0xFFFFFF,
          points: 10,
          maxDistance: 22,
          spacing: 20,
        })
      } catch (err) {
        console.error('Vanta init failed:', err)
      }
    }

    const run = async () => {
      try {
        await loadScript('/three.min.js')
        await loadScript('/vanta.globe.min.js')
        initVanta()
      } catch (err) {
        console.error('Vanta script load failed:', err)
      }
    }

    run()

    return () => {
      if (retryTimer) clearTimeout(retryTimer)
      if (vantaEffect.current) {
        try { vantaEffect.current.destroy() } catch (e) {}
        vantaEffect.current = null
      }
    }
  }, [theme])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setRemainingAttempts(null)
    setRateLimitError(false)
    
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login({ id: data.id, email: data.email, fullName: data.fullName, role: data.role }, data.token)
    } catch (err) {
      const response = err.response?.data
      
      if (err.response?.status === 429) {
        if (response?.code === 'ACCOUNT_LOCKED') {
          setLockoutMinutes(response.remainingMinutes || 15)
          setError(response.error || 'Account temporarily locked due to multiple failed attempts.')
        } else {
          setRateLimitError(true)
          setError(response?.error || 'Too many requests. Please wait a minute.')
        }
      } else if (err.response?.status === 401) {
        setError(response?.error || 'Invalid email or password')
        if (response?.remainingAttempts !== undefined && response.remainingAttempts > 0) {
          setRemainingAttempts(response.remainingAttempts)
        }
      } else {
        setError('Invalid email or password')
      }
      setLoading(false)
    }
  }

  const trackMouse = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`)
    e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* Dark Theme (default) */
        :root,
        .dark {
          --bg-dark: #0A0C12;
          --bg-darker: #06080D;
          --bg-surface: #0F121A;
          --bg-surface-light: #151A24;
          --border: rgba(255,255,255,0.05);
          --border-light: rgba(255,255,255,0.08);
          --text: #E8EDF2;
          --text-dim: #8E9AA8;
          --text-muted: #4A5568;
          --vanta-color: 0x8E9AA8;
          --vanta-color2: 0x4A5568;
          --vanta-bg: 0x06080D;
        }

        /* Light Theme */
        .light {
          --bg-dark: #F8FAFC;
          --bg-darker: #FFFFFF;
          --bg-surface: #FFFFFF;
          --bg-surface-light: #F1F5F9;
          --border: rgba(0, 0, 0, 0.08);
          --border-light: rgba(0, 0, 0, 0.05);
          --text: #0F172A;
          --text-dim: #475569;
          --text-muted: #64748B;
          --vanta-color: 0x475569;
          --vanta-color2: 0x94A3B8;
          --vanta-bg: 0xFFFFFF;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-page {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-darker);
          font-family: var(--font-body);
          overflow: hidden; z-index: 0;
        }

        .login-vanta {
          position: absolute !important; inset: 0 !important;
          width: 100% !important; height: 100% !important; z-index: 0 !important;
        }

        .scene-bg {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 40% at 20% 10%, rgba(30,40,60,0.3) 0%, transparent 55%),
            radial-gradient(ellipse 50% 35% at 85% 80%, rgba(20,30,50,0.25) 0%, transparent 60%);
        }

        .light .scene-bg {
          background:
            radial-gradient(ellipse 60% 40% at 20% 10%, rgba(0,0,0,0.03) 0%, transparent 55%),
            radial-gradient(ellipse 50% 35% at 85% 80%, rgba(0,0,0,0.02) 0%, transparent 60%);
        }

        /* particles */
        .lp-particles { position: absolute; inset: 0; pointer-events: none; z-index: 2; overflow: hidden; }
        .lp-particle  {
          position: absolute; bottom: -10px; border-radius: 50%;
          background: rgba(255,255,255,0.12);
          animation: lpRise linear infinite;
        }
        .light .lp-particle {
          background: rgba(0,0,0,0.08);
        }
        @keyframes lpRise {
          0%   { transform: translateY(0) scale(1);        opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.2; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }

        /* rings */
        .lp-rings {
          position: absolute; inset: 0; z-index: 2;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none;
        }
        .lp-ring {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          width: 80px; height: 80px;
          animation: lpRing 12s ease-out infinite;
        }
        .light .lp-ring {
          border: 1px solid rgba(0,0,0,0.08);
        }
        @keyframes lpRing {
          0%   { width:  80px; height:  80px; opacity: 0.5; }
          100% { width: 900px; height: 900px; opacity: 0;   }
        }

        /* top badge */
        .lp-top-badge {
          position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 8px;
          padding: 6px 18px;
          background: rgba(10,12,18,0.85);
          border: 1px solid var(--border-light); border-radius: 50px;
          font-family: var(--font-mono); font-size: 10px;
          letter-spacing: 2px; color: var(--text-dim);
          white-space: nowrap; backdrop-filter: blur(12px); z-index: 10;
        }
        .light .lp-top-badge {
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(0,0,0,0.08);
        }
        .lp-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #10B981; box-shadow: 0 0 6px rgba(16,185,129,0.5);
          flex-shrink: 0; animation: pulseDot 1.8s ease-in-out infinite;
        }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.3)} }

        /* stat chips */
        .lp-chip {
          position: absolute; display: flex; flex-direction: column; align-items: center;
          padding: 10px 16px;
          background: linear-gradient(145deg, var(--bg-surface) 0%, rgba(15,18,26,0.95) 100%);
          border: 1px solid var(--border-light); border-radius: 14px;
          backdrop-filter: blur(12px); z-index: 10;
          animation: chipFloat 5s ease-in-out infinite;
        }
        .light .lp-chip {
          background: linear-gradient(145deg, #FFFFFF 0%, #F1F5F9 100%);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .lp-chip-v { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--text); line-height: 1; }
        .lp-chip-l { font-size: 9px; color: var(--text-dim); font-weight: 600; letter-spacing: .5px; margin-top: 3px; font-family: var(--font-mono); }
        .lp-chip-a { top: 18%; left: 5%;  animation-delay: 0s;   }
        .lp-chip-b { top: 18%; right: 5%; animation-delay: 1.6s; }
        .lp-chip-c { bottom: 22%; right: 5%; animation-delay: 3.2s; }
        @keyframes chipFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        /* card */
        .login-card {
          position: relative; z-index: 20;
          width: 420px; max-width: 94vw;
          max-height: 96vh; overflow-y: auto; scrollbar-width: none;
          background: linear-gradient(145deg, var(--bg-surface) 0%, rgba(10,12,18,0.97) 100%);
          border: 1px solid var(--border-light); border-radius: 20px;
          padding: 40px 36px 32px;
          backdrop-filter: blur(30px) saturate(160%);
          box-shadow: 0 8px 60px rgba(0,0,0,0.7), inset 0 0 80px rgba(255,255,255,0.02);
          animation: cardIn .5s cubic-bezier(.22,1,.36,1) both;
          transition: border-color .3s, box-shadow .3s;
          isolation: isolate;
        }
        .light .login-card {
          background: linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 8px 60px rgba(0, 0, 0, 0.06), inset 0 0 80px rgba(0, 0, 0, 0.01);
        }
        .login-card::-webkit-scrollbar { display: none; }
        .login-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 20px;
          background: radial-gradient(circle 200px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, transparent 70%);
          opacity: 0; transition: opacity .25s ease; pointer-events: none;
        }
        .light .login-card::before {
          background: radial-gradient(circle 200px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.01) 40%, transparent 70%);
        }
        .login-card:hover { border-color: rgba(255,255,255,0.18); }
        .light .login-card:hover { border-color: rgba(0,0,0,0.15); }
        .login-card:hover::before { opacity: 1; }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(24px) scale(.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);   }
        }

        /* top shimmer line */
        .card-shimmer {
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(255,255,255,0.08), transparent);
          border-radius: 20px 20px 0 0; pointer-events: none;
        }
        .light .card-shimmer {
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), rgba(0,0,0,0.05), transparent);
        }

        /* brand */
        .login-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; justify-content: center; }
        .login-logo-box {
          width: 40px; height: 40px;
          background: rgba(255,255,255,0.08);
          border: 1px solid var(--border-light);
          border-radius: 11px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 12px rgba(255,255,255,0.06); flex-shrink: 0;
        }
        .light .login-logo-box {
          background: rgba(0,0,0,0.04);
          border: 1px solid rgba(0,0,0,0.08);
        }
        .login-brand-name {
          font-family: var(--font-display); font-size: 20px; font-weight: 800;
          background: linear-gradient(110deg, #FFFFFF 20%, #8E9AA8 50%, #FFFFFF 80%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmerText 4s linear infinite; letter-spacing: -.02em;
        }
        .light .login-brand-name {
          background: linear-gradient(110deg, #1E293B 20%, #64748B 50%, #1E293B 80%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes shimmerText { 0%{background-position:200% center} 100%{background-position:-200% center} }

        /* heading */
        .login-h1 {
          font-family: var(--font-display); font-size: 26px; font-weight: 800;
          color: var(--text); text-align: center; letter-spacing: -.03em; margin-bottom: 6px;
        }
        .login-sub {
          font-size: 11px; color: var(--text-muted); text-align: left;
          margin-bottom: 26px; padding-left: 12px;
          border-left: 2px solid rgba(255,255,255,0.12); line-height: 1.5;
          font-family: var(--font-mono); letter-spacing: .03em;
        }
        .light .login-sub {
          border-left: 2px solid rgba(0,0,0,0.1);
        }

        /* field */
        .lp-field { margin-bottom: 15px; }
        .lp-label {
          display: flex; align-items: center; gap: 7px;
          font-size: 10px; font-weight: 600; color: var(--text-muted);
          letter-spacing: .1em; text-transform: uppercase; margin-bottom: 7px;
          font-family: var(--font-mono); transition: color .2s;
        }
        .lp-label svg { flex-shrink: 0; transition: color .2s; }
        .lp-field-active .lp-label { color: var(--text-dim); }

        .lp-iw { position: relative; display: flex; align-items: center; }
        .lp-input {
          width: 100%; padding: 11px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border); border-radius: 10px;
          color: var(--text); font-family: var(--font-body); font-size: 13px;
          outline: none; transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .light .lp-input {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.08);
          color: #0F172A;
        }
        .lp-input::placeholder { color: var(--text-muted); }
        .lp-input:hover:not(:focus) { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); }
        .light .lp-input:hover:not(:focus) { border-color: rgba(0,0,0,0.15); background: rgba(0,0,0,0.03); }
        .lp-input:focus {
          border-color: rgba(255,255,255,0.28);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.06);
        }
        .light .lp-input:focus {
          border-color: rgba(0,0,0,0.25);
          box-shadow: 0 0 0 3px rgba(0,0,0,0.03);
          background: rgba(0,0,0,0.04);
        }
        .lp-input-p { padding-right: 42px; }
        .lp-eye {
          position: absolute; right: 11px; background: none; border: none;
          cursor: pointer; color: var(--text-muted);
          display: flex; align-items: center; padding: 4px;
          border-radius: 6px; transition: color .15s, background .15s;
        }
        .lp-eye:hover { color: var(--text-dim); background: rgba(255,255,255,0.06); }
        .light .lp-eye:hover { background: rgba(0,0,0,0.04); }

        /* row */
        .lp-row {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 18px;
        }
        .lp-remember {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; color: var(--text-muted);
          cursor: pointer; user-select: none; transition: color .2s;
          font-family: var(--font-body);
        }
        .lp-remember:hover { color: var(--text-dim); }
        .lp-chk {
          width: 15px; height: 15px;
          border: 1px solid var(--border-light); border-radius: 5px;
          background: rgba(255,255,255,0.03);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all .2s;
        }
        .light .lp-chk {
          border: 1px solid rgba(0,0,0,0.15);
          background: rgba(0,0,0,0.02);
        }
        .lp-chk-on { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); }
        .light .lp-chk-on { background: rgba(0,0,0,0.08); border-color: rgba(0,0,0,0.25); }
        .lp-forgot {
          background: none; border: none; font-family: var(--font-body);
          font-size: 12px; font-weight: 600; color: var(--text-dim);
          cursor: pointer; transition: color .2s; padding: 0;
        }
        .lp-forgot:hover { color: var(--text); }

        /* info message (remaining attempts) */
        .lp-info {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 13px;
          background: rgba(249,115,22,0.1);
          border: 1px solid rgba(249,115,22,0.3);
          border-radius: 9px;
          color: #F97316;
          font-size: 12px;
          margin-bottom: 14px;
          font-family: var(--font-mono);
          animation: fadeInInfo 0.3s ease;
        }
        @keyframes fadeInInfo {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* error */
        .lp-error {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 13px; background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.2); border-radius: 9px;
          color: #F87171; font-size: 12px; margin-bottom: 14px;
          animation: errIn .25s ease;
        }
        .lp-error svg { flex-shrink: 0; }
        @keyframes errIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }

        /* submit button */
        .btn-launch {
          width: 100%; padding: 12px;
          border-radius: 10px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all .25s ease;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
          color: #FFFFFF; font-family: var(--font-body);
          position: relative; overflow: hidden; letter-spacing: .01em;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .light .btn-launch {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.12);
          color: #0F172A;
        }
        .btn-launch::before {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle 150px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 40%, transparent 70%);
          opacity: 0; transition: opacity .25s ease; pointer-events: none;
        }
        .light .btn-launch::before {
          background: radial-gradient(circle 150px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.03) 40%, transparent 70%);
        }
        .btn-launch:hover:not(:disabled) {
          background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.38);
          transform: translateY(-2px); box-shadow: 0 4px 20px rgba(255,255,255,0.07);
        }
        .light .btn-launch:hover:not(:disabled) {
          background: rgba(0, 0, 0, 0.1);
          border-color: rgba(0, 0, 0, 0.25);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .btn-launch:hover:not(:disabled)::before { opacity: 1; }
        .btn-launch:active:not(:disabled) { transform: translateY(0); }
        .btn-launch:disabled { opacity: .3; cursor: not-allowed; transform: none; }

        /* spinner */
        .lp-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff;
          border-radius: 50%; animation: spin .6s linear infinite; flex-shrink: 0;
        }
        .light .lp-spinner {
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #0F172A;
        }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* divider */
        .lp-div { position: relative; text-align: center; margin: 18px 0; }
        .lp-div::before,.lp-div::after {
          content: ''; position: absolute; top: 50%; height: 1px;
          width: calc(50% - 18px); background: var(--border);
        }
        .lp-div::before{left:0} .lp-div::after{right:0}
        .lp-div span { font-size: 10px; color: var(--text-muted); padding: 0 10px; font-family: var(--font-mono); }

        /* register link */
        .lp-reg {
          text-align: center; font-size: 12px;
          color: var(--text-muted); margin-bottom: 18px;
          font-family: var(--font-body);
        }
        .lp-reg a { color: var(--text-dim); font-weight: 600; text-decoration: none; transition: color .2s; }
        .lp-reg a:hover { color: var(--text); }

        /* trust badges */
        .lp-trust { display: flex; justify-content: center; gap: 7px; flex-wrap: wrap; margin-bottom: 12px; }
        .lp-tbadge {
          display: flex; align-items: center; gap: 5px;
          padding: 3px 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border); border-radius: 50px;
          font-size: 10px; color: var(--text-muted);
          font-family: var(--font-mono); letter-spacing: .3px;
          transition: background .2s, border-color .2s;
        }
        .light .lp-tbadge {
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
        .lp-tbadge:hover { background: rgba(255,255,255,0.07); border-color: var(--border-light); color: var(--text-dim); }
        .light .lp-tbadge:hover { background: rgba(0, 0, 0, 0.06); color: var(--text); }

        /* footer */
        .lp-footer { text-align: center; font-size: 10.5px; color: var(--text-muted); }
        .lp-footer span { color: var(--text-dim); cursor: pointer; transition: color .2s; }
        .lp-footer span:hover { color: var(--text); }

        /* scrollbar */
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .light ::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .light ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); }

        @media(max-width:500px){
          .login-card{width:92vw;padding:28px 18px 24px}
          .lp-chip-a{top:10%;left:2%} .lp-chip-b{top:10%;right:2%} .lp-chip-c{display:none}
          .login-h1{font-size:22px}
        }
      `}</style>

      <div className="login-page">

        {/* Vanta Globe */}
        <div ref={vantaRef} className="login-vanta" />

        {/* Scene tint */}
        <div className="scene-bg" />

        {/* Particles */}
        <div className="lp-particles">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="lp-particle" style={{
              left: `${(i * 37 + 11) % 100}%`,
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              animationDuration: `${10 + (i % 7) * 2}s`,
              animationDelay: `${(i * 1.3) % 11}s`,
            }} />
          ))}
        </div>

        {/* Rings */}
        <div className="lp-rings">
          {[0, 2.8, 5.6, 8.4].map((d, i) => (
            <div key={i} className="lp-ring" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>

        {/* Status badge */}
        <div className="lp-top-badge">
          <span className="lp-badge-dot" />
          SYSTEM ONLINE
        </div>

        {/* Stat chips */}
        <div className="lp-chip lp-chip-a">
          <span className="lp-chip-v">98%</span>
          <span className="lp-chip-l">Accuracy</span>
        </div>
        <div className="lp-chip lp-chip-b">
          <span className="lp-chip-v">2.4s</span>
          <span className="lp-chip-l">Response</span>
        </div>
        <div className="lp-chip lp-chip-c">
          <span className="lp-chip-v">50k+</span>
          <span className="lp-chip-l">Interviews</span>
        </div>

        {/* Card */}
        <div className="login-card" onMouseMove={trackMouse}>
          <div className="card-shimmer" />

          {/* Brand */}
          <div className="login-brand">
            <div className="login-logo-box">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5" color="var(--text)"/>
                <path d="M12 14L16 18L20 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
              </svg>
            </div>
            <span className="login-brand-name">InterviewAI</span>
          </div>

          <h1 className="login-h1">Welcome back.</h1>
          <p className="login-sub">Secure access · recruiter portal</p>

          <form onSubmit={handleLogin} autoComplete="off">

            {/* Email */}
            <div className={`lp-field${focused === 'email' ? ' lp-field-active' : ''}`}>
              <label className="lp-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="4" width="20" height="16" rx="3"/>
                  <path d="m2 7 10 7 10-7"/>
                </svg>
                Email address
              </label>
              <input
                type="email" className="lp-input"
                placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                required
              />
            </div>

            {/* Password */}
            <div className={`lp-field${focused === 'pass' ? ' lp-field-active' : ''}`}>
              <label className="lp-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Password
              </label>
              <div className="lp-iw">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="lp-input lp-input-p"
                  placeholder="··········"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pass')} onBlur={() => setFocused('')}
                  required
                />
                <button type="button" className="lp-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                  {showPass ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="lp-row">
              <label className="lp-remember" onClick={() => setRemember(p => !p)}>
                <div className={`lp-chk${remember ? ' lp-chk-on' : ''}`}>
                  {remember && (
                    <svg width="8" height="6" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 4l2.5 2.5L9 1"/>
                    </svg>
                  )}
                </div>
                Remember me
              </label>
              <button type="button" className="lp-forgot" disabled style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                Forgot password?
              </button>
            </div>

            {/* Remaining Attempts Info */}
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <div className="lp-info">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before temporary lock
              </div>
            )}

            {/* Lockout Info */}
            {lockoutMinutes !== null && lockoutMinutes > 0 && (
              <div className="lp-error" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Account temporarily locked. {lockoutMinutes} minute{lockoutMinutes !== 1 ? 's' : ''} remaining.
              </div>
            )}

            {/* Rate Limit Error */}
            {rateLimitError && (
              <div className="lp-error" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Too many requests. Please wait a minute.
              </div>
            )}

            {/* Error */}
            {error && !lockoutMinutes && !rateLimitError && (
              <div className="lp-error">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" className="btn-launch" disabled={loading || lockoutMinutes !== null}
              onMouseMove={trackMouse}
            >
              {loading && <span className="lp-spinner" />}
              {loading ? 'Signing in…' : 'Sign in to InterviewAI'}
            </button>

          </form>

          <div className="lp-div"><span>or</span></div>

          <p className="lp-reg">
            No account yet? <Link to="/register">Create one free →</Link>
          </p>

          <div className="lp-trust">
            {['End-to-end encrypted', 'Zero-trust secure', 'Premium AI'].map(label => (
              <span key={label} className="lp-tbadge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {label}
              </span>
            ))}
          </div>

          <p className="lp-footer">
            By signing in you agree to our{' '}
            <span>Terms of Service</span> and <span>Privacy Policy</span>.
          </p>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            width: '44px',
            height: '44px',
            borderRadius: '40px',
            background: theme === 'dark' 
              ? 'linear-gradient(135deg, #0F121A, #151A24)'
              : 'linear-gradient(135deg, #FFFFFF, #F1F5F9)',
            border: theme === 'dark' 
              ? '1px solid rgba(255,255,255,0.15)'
              : '1px solid rgba(0,0,0,0.1)',
            boxShadow: theme === 'dark'
              ? '0 4px 20px rgba(0,0,0,0.3)'
              : '0 4px 20px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = theme === 'dark'
              ? '0 0 20px rgba(255,255,255,0.15)'
              : '0 0 20px rgba(0,0,0,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = theme === 'dark'
              ? '0 4px 20px rgba(0,0,0,0.3)'
              : '0 4px 20px rgba(0,0,0,0.08)'
          }}
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8EDF2" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

      </div>
    </>
  )
}