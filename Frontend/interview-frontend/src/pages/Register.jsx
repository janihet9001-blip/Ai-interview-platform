import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'

export default function Register() {
  const [fullName,   setFullName]   = useState('')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [showPass,   setShowPass]   = useState(false)
  const [focused,    setFocused]    = useState('')
  const [touched,    setTouched]    = useState({ fullName: false, email: false, password: false })
  const { login }   = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate    = useNavigate()
  const vantaRef    = useRef(null)
  const vantaEffect = useRef(null)
  const abortRef    = useRef(null)

  useEffect(() => {
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [])

  /* ── Vanta Globe ── */
  useEffect(() => {
    let retryTimer = null
    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
        const s = document.createElement('script')
        s.src = src; s.onload = resolve; s.onerror = reject
        document.head.appendChild(s)
      })
    const initVanta = () => {
      if (!vantaRef.current || vantaEffect.current) return
      if (!window.VANTA || !window.VANTA.GLOBE) { retryTimer = setTimeout(initVanta, 100); return }
      try {
        vantaEffect.current = window.VANTA.GLOBE({
          el: vantaRef.current,
          mouseControls: true, touchControls: true, gyroControls: false,
          minHeight: 200, minWidth: 200, scale: 1.0, scaleMobile: 1.0,
          color: theme === 'dark' ? 0x8E9AA8 : 0x475569,
          color2: theme === 'dark' ? 0x4A5568 : 0x94A3B8,
          backgroundColor: theme === 'dark' ? 0x06080D : 0xFFFFFF,
          points: 10, maxDistance: 22, spacing: 20,
        })
      } catch (err) { console.error('Vanta init failed:', err) }
    }
    const run = async () => {
      try {
        await loadScript('/three.min.js')
        await loadScript('/vanta.globe.min.js')
        initVanta()
      } catch (err) { console.error('Vanta script load failed:', err) }
    }
    run()
    return () => {
      if (retryTimer) clearTimeout(retryTimer)
      if (vantaEffect.current) { try { vantaEffect.current.destroy() } catch (e) {} vantaEffect.current = null }
    }
  }, [theme])

  /* ── Validation ── */
  const validateFullName = useCallback((v) => {
    if (!v.trim()) return 'Full name is required'
    if (v.trim().length < 2) return 'At least 2 characters'
    if (v.trim().length > 100) return 'Too long'
    return null
  }, [])
  const validateEmail = useCallback((v) => {
    if (!v.trim()) return 'Email is required'
    if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(v)) return 'Invalid email address'
    return null
  }, [])
  const validatePassword = useCallback((v) => {
    if (!v) return 'Password is required'
    if (v.length < 8) return 'At least 8 characters'
    if (!/[A-Z]/.test(v)) return 'Need one uppercase letter'
    if (!/[a-z]/.test(v)) return 'Need one lowercase letter'
    if (!/[0-9]/.test(v)) return 'Need one number'
    return null
  }, [])
  const validateResume = useCallback((f) => {
    if (!f) return null
    if (f.type !== 'application/pdf') return 'PDF only'
    if (f.size > 5 * 1024 * 1024) return 'Max 5 MB'
    return null
  }, [])

  const fullNameError = touched.fullName ? validateFullName(fullName) : null
  const emailError    = touched.email    ? validateEmail(email)       : null
  const passwordError = touched.password ? validatePassword(password) : null
  const resumeError   = resumeFile       ? validateResume(resumeFile) : null
  const isValid = !validateFullName(fullName) && !validateEmail(email) && !validatePassword(password) && !validateResume(resumeFile)

  /* ── Submit ── */
  const handleRegister = async (e) => {
    e.preventDefault()
    const e1 = validateFullName(fullName), e2 = validateEmail(email), e3 = validatePassword(password), e4 = validateResume(resumeFile)
    if (e1 || e2 || e3 || e4) { setError(e1 || e2 || e3 || e4 || 'Fix errors above'); setTouched({ fullName: true, email: true, password: true }); return }
    setLoading(true); setError('')
    abortRef.current = new AbortController()
    try {
      const { data } = await api.post('/auth/register', { fullName: fullName.trim(), email: email.trim().toLowerCase(), password })
      if (resumeFile) {
        try {
          const fd = new FormData(); fd.append('file', resumeFile)
          await api.post('/users/upload-resume', fd, {
            headers: { Authorization: `Bearer ${data.token}`, 'Content-Type': 'multipart/form-data' }
          })
        } catch (uploadErr) { if (uploadErr.name !== 'AbortError') setError('Account created but resume upload failed. You can upload later.') }
      }
      login({ id: data.id, email: data.email, fullName: data.fullName, role: data.role }, data.token)
    } catch (err) {
      if (err.response?.status === 409) setError('Email already exists. Sign in instead.')
      else if (err.response?.status === 400) setError(err.response?.data?.message || 'Invalid data.')
      else if (err.name !== 'AbortError') setError('Registration failed. Try again.')
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0] || null
    if (file) { const err = validateResume(file); if (err) { setError(err); return } }
    setResumeFile(file); setError('')
  }

  const trackMouse = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`)
    e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top)  / r.height) * 100}%`)
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
          --font-mono: 'JetBrains Mono', monospace;
          --font-display: 'Inter', system-ui, sans-serif;
          --font-body: 'Inter', system-ui, sans-serif;
          --radius: 12px;
          --radius-lg: 16px;
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
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rg-page {
          position: fixed; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-darker);
          font-family: var(--font-body);
          overflow: hidden; z-index: 0;
        }
        .rg-vanta {
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
        .rg-particles { position: absolute; inset: 0; pointer-events: none; z-index: 2; overflow: hidden; }
        .rg-particle  {
          position: absolute; bottom: -10px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
          animation: rgRise linear infinite;
        }
        .light .rg-particle { background: rgba(0,0,0,0.08); }
        @keyframes rgRise {
          0%   { transform: translateY(0) scale(1);        opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.15; }
          100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
        }

        /* rings */
        .rg-rings { position: absolute; inset: 0; z-index: 2; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .rg-ring  { position: absolute; border-radius: 50%; border: 1px solid rgba(255,255,255,0.05); width: 80px; height: 80px; animation: rgRing 12s ease-out infinite; }
        .light .rg-ring { border: 1px solid rgba(0,0,0,0.08); }
        @keyframes rgRing { 0%{width:80px;height:80px;opacity:0.4} 100%{width:900px;height:900px;opacity:0} }

        /* top badge */
        .rg-top-badge {
          position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 8px; padding: 6px 18px;
          background: rgba(10,12,18,0.85); border: 1px solid var(--border-light); border-radius: 50px;
          font-family: var(--font-mono); font-size: 10px; letter-spacing: 2px; color: var(--text-dim);
          white-space: nowrap; backdrop-filter: blur(12px); z-index: 10;
        }
        .light .rg-top-badge {
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(0,0,0,0.08);
        }
        .rg-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #10B981; box-shadow: 0 0 6px rgba(16,185,129,0.5); flex-shrink: 0; animation: pulseDot 1.8s ease-in-out infinite; }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.3)} }

        /* stat chips */
        .rg-chip { position: absolute; display: flex; flex-direction: column; align-items: center; padding: 10px 16px; background: linear-gradient(145deg,var(--bg-surface) 0%,rgba(15,18,26,0.95) 100%); border: 1px solid var(--border-light); border-radius: 14px; backdrop-filter: blur(12px); z-index: 10; animation: chipFloat 5s ease-in-out infinite; }
        .light .rg-chip { background: linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%); border: 1px solid rgba(0,0,0,0.06); }
        .rg-chip-v { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--text); line-height: 1; }
        .rg-chip-l { font-size: 9px; color: var(--text-dim); font-weight: 600; letter-spacing: .5px; margin-top: 3px; font-family: var(--font-mono); }
        .rg-chip-a { top: 18%; left: 5%;  animation-delay: 0s; }
        .rg-chip-b { top: 18%; right: 5%; animation-delay: 1.6s; }
        .rg-chip-c { bottom: 22%; right: 5%; animation-delay: 3.2s; }
        @keyframes chipFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }

        /* scrollable card */
        .rg-card {
          position: relative; z-index: 20;
          width: 460px; max-width: 94vw;
          max-height: 92vh; overflow-y: auto; scrollbar-width: none;
          background: linear-gradient(145deg, var(--bg-surface) 0%, rgba(10,12,18,0.97) 100%);
          border: 1px solid var(--border-light); border-radius: 20px;
          padding: 36px 34px 30px;
          backdrop-filter: blur(30px) saturate(160%);
          box-shadow: 0 8px 60px rgba(0,0,0,0.7), inset 0 0 80px rgba(255,255,255,0.02);
          animation: cardIn .5s cubic-bezier(.22,1,.36,1) both;
          transition: border-color .3s, box-shadow .3s;
          isolation: isolate;
        }
        .light .rg-card {
          background: linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%);
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 8px 60px rgba(0,0,0,0.06), inset 0 0 80px rgba(0,0,0,0.01);
        }
        .rg-card::-webkit-scrollbar { display: none; }
        .rg-card::before {
          content: ''; position: absolute; inset: 0; border-radius: 20px;
          background: radial-gradient(circle 200px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, transparent 70%);
          opacity: 0; transition: opacity .25s ease; pointer-events: none;
        }
        .light .rg-card::before {
          background: radial-gradient(circle 200px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.01) 40%, transparent 70%);
        }
        .rg-card:hover { border-color: rgba(255,255,255,0.18); }
        .light .rg-card:hover { border-color: rgba(0,0,0,0.15); }
        .rg-card:hover::before { opacity: 1; }
        @keyframes cardIn { from{opacity:0;transform:translateY(24px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

        .card-shimmer { position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg,transparent,rgba(255,255,255,0.18),rgba(255,255,255,0.08),transparent); border-radius: 20px 20px 0 0; pointer-events: none; }
        .light .card-shimmer { background: linear-gradient(90deg, transparent, rgba(0,0,0,0.1), rgba(0,0,0,0.05), transparent); }

        /* brand */
        .rg-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; justify-content: center; }
        .rg-logo-box { width: 40px; height: 40px; background: rgba(255,255,255,0.08); border: 1px solid var(--border-light); border-radius: 11px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(255,255,255,0.06); flex-shrink: 0; }
        .light .rg-logo-box { background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08); }
        .rg-brand-name { font-family: var(--font-display); font-size: 20px; font-weight: 800; background: linear-gradient(110deg,#FFFFFF 20%,#8E9AA8 50%,#FFFFFF 80%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shimmerText 4s linear infinite; letter-spacing: -.02em; }
        .light .rg-brand-name { background: linear-gradient(110deg, #1E293B 20%, #64748B 50%, #1E293B 80%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        @keyframes shimmerText { 0%{background-position:200% center} 100%{background-position:-200% center} }

        .rg-h1 { font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--text); text-align: center; letter-spacing: -.03em; margin-bottom: 5px; }
        .rg-sub { font-size: 11px; color: var(--text-muted); text-align: left; margin-bottom: 22px; padding-left: 12px; border-left: 2px solid rgba(255,255,255,0.12); line-height: 1.5; font-family: var(--font-mono); letter-spacing: .03em; }
        .light .rg-sub { border-left: 2px solid rgba(0,0,0,0.1); }

        /* fields */
        .rg-field { margin-bottom: 14px; }
        .rg-label { display: flex; align-items: center; gap: 7px; font-size: 10px; font-weight: 600; color: var(--text-muted); letter-spacing: .1em; text-transform: uppercase; margin-bottom: 7px; font-family: var(--font-mono); transition: color .2s; }
        .rg-label svg { flex-shrink: 0; transition: color .2s; }
        .rg-field-active .rg-label { color: var(--text-dim); }
        .rg-field-active .rg-label svg { color: #8E9AA8; }

        .rg-iw { position: relative; display: flex; align-items: center; }
        .rg-input {
          width: 100%; padding: 11px 14px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border); border-radius: 10px;
          color: var(--text); font-family: var(--font-body); font-size: 13px;
          outline: none; transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .light .rg-input {
          background: rgba(0,0,0,0.02);
          border: 1px solid rgba(0,0,0,0.08);
          color: #0F172A;
        }
        .rg-input::placeholder { color: var(--text-muted); }
        .rg-input:hover:not(:focus) { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); }
        .light .rg-input:hover:not(:focus) { border-color: rgba(0,0,0,0.15); background: rgba(0,0,0,0.03); }
        .rg-input:focus { border-color: rgba(255,255,255,0.28); box-shadow: 0 0 0 3px rgba(255,255,255,0.05); background: rgba(255,255,255,0.06); }
        .light .rg-input:focus { border-color: rgba(0,0,0,0.25); box-shadow: 0 0 0 3px rgba(0,0,0,0.03); background: rgba(0,0,0,0.04); }
        .rg-input-err { border-color: rgba(248,113,113,0.4) !important; }
        .rg-input-p { padding-right: 42px; }

        .rg-eye { position: absolute; right: 11px; background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; padding: 4px; border-radius: 6px; transition: color .15s, background .15s; }
        .rg-eye:hover { color: var(--text-dim); background: rgba(255,255,255,0.06); }
        .light .rg-eye:hover { background: rgba(0,0,0,0.04); }

        .rg-field-err { font-size: 10px; color: #F87171; font-family: var(--font-mono); margin-top: 5px; }
        .rg-field-hint { font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 5px; }

        /* upload zone */
        .rg-upload {
          display: flex; align-items: center; gap: 12px; padding: 11px 13px;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.1); border-radius: 10px;
          cursor: pointer; transition: all .2s;
        }
        .light .rg-upload { background: rgba(0,0,0,0.01); border: 1px dashed rgba(0,0,0,0.1); }
        .rg-upload:hover { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.04); }
        .light .rg-upload:hover { border-color: rgba(0,0,0,0.2); background: rgba(0,0,0,0.02); }
        .rg-upload-ok { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.04); }
        .rg-upload-icon { width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; }
        .light .rg-upload-icon { background: rgba(0,0,0,0.03); }

        /* error box */
        .rg-error { display: flex; align-items: center; gap: 8px; padding: 10px 13px; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 9px; color: #F87171; font-size: 12px; margin-bottom: 13px; animation: errIn .25s ease; }
        @keyframes errIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:translateY(0)} }

        /* button */
        .btn-launch {
          width: 100%; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all .25s ease;
          border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.08);
          color: #FFFFFF; font-family: var(--font-body);
          position: relative; overflow: hidden; letter-spacing: .01em;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .light .btn-launch {
          background: rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.12);
          color: #0F172A;
        }
        .btn-launch::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle 150px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 40%, transparent 70%); opacity: 0; transition: opacity .25s ease; pointer-events: none; }
        .light .btn-launch::before { background: radial-gradient(circle 150px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.03) 40%, transparent 70%); }
        .btn-launch:hover:not(:disabled) { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.38); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(255,255,255,0.07); }
        .light .btn-launch:hover:not(:disabled) { background: rgba(0,0,0,0.1); border-color: rgba(0,0,0,0.25); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .btn-launch:hover:not(:disabled)::before { opacity: 1; }
        .btn-launch:active:not(:disabled) { transform: translateY(0); }
        .btn-launch:disabled { opacity: .3; cursor: not-allowed; }

        .rg-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; flex-shrink: 0; }
        .light .rg-spinner { border: 2px solid rgba(0,0,0,0.2); border-top-color: #0F172A; }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* divider */
        .rg-div { position: relative; text-align: center; margin: 16px 0; }
        .rg-div::before,.rg-div::after { content: ''; position: absolute; top: 50%; height: 1px; width: calc(50% - 18px); background: var(--border); }
        .rg-div::before{left:0} .rg-div::after{right:0}
        .rg-div span { font-size: 10px; color: var(--text-muted); padding: 0 10px; font-family: var(--font-mono); }

        .rg-login { text-align: center; font-size: 12px; color: var(--text-muted); font-family: var(--font-body); }
        .rg-login a { color: var(--text-dim); font-weight: 600; text-decoration: none; transition: color .2s; }
        .rg-login a:hover { color: var(--text); }

        /* trust */
        .rg-trust { display: flex; justify-content: center; gap: 7px; flex-wrap: wrap; margin: 14px 0 10px; }
        .rg-tbadge { display: flex; align-items: center; gap: 5px; padding: 3px 10px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 50px; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); letter-spacing: .3px; transition: all .2s; }
        .light .rg-tbadge { background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06); }
        .rg-tbadge:hover { background: rgba(255,255,255,0.07); border-color: var(--border-light); color: var(--text-dim); }
        .light .rg-tbadge:hover { background: rgba(0,0,0,0.06); color: var(--text); }

        .rg-footer { text-align: center; font-size: 10.5px; color: var(--text-muted); }
        .rg-footer span { color: var(--text-dim); cursor: pointer; transition: color .2s; }
        .rg-footer span:hover { color: var(--text); }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .light ::-webkit-scrollbar-track { background: rgba(0,0,0,0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .light ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); }

        @media(max-width:500px){
          .rg-card{width:92vw;padding:26px 16px 22px}
          .rg-chip-a{top:10%;left:2%} .rg-chip-b{top:10%;right:2%} .rg-chip-c{display:none}
          .rg-h1{font-size:20px}
        }
      `}</style>

      <div className="rg-page">

        {/* Vanta */}
        <div ref={vantaRef} className="rg-vanta" />
        <div className="scene-bg" />

        {/* Particles */}
        <div className="rg-particles">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="rg-particle" style={{
              left: `${(i * 37 + 11) % 100}%`,
              width: `${(i % 3) + 2}px`, height: `${(i % 3) + 2}px`,
              animationDuration: `${10 + (i % 7) * 2}s`,
              animationDelay: `${(i * 1.3) % 11}s`,
            }} />
          ))}
        </div>

        {/* Rings */}
        <div className="rg-rings">
          {[0, 2.8, 5.6, 8.4].map((d, i) => (
            <div key={i} className="rg-ring" style={{ animationDelay: `${d}s` }} />
          ))}
        </div>

        {/* Badge */}
        <div className="rg-top-badge">
          <span className="rg-badge-dot" />
          JOIN THE PLATFORM
        </div>

        {/* Chips */}
        <div className="rg-chip rg-chip-a"><span className="rg-chip-v">98%</span><span className="rg-chip-l">Accuracy</span></div>
        <div className="rg-chip rg-chip-b"><span className="rg-chip-v">2.4s</span><span className="rg-chip-l">Response</span></div>
        <div className="rg-chip rg-chip-c"><span className="rg-chip-v">50k+</span><span className="rg-chip-l">Interviews</span></div>

        {/* Card */}
        <div className="rg-card" onMouseMove={trackMouse}>
          <div className="card-shimmer" />

          {/* Brand */}
          <div className="rg-brand">
            <div className="rg-logo-box">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="4" width="24" height="24" rx="6" stroke="currentColor" strokeWidth="1.5" color="var(--text)"/>
                <path d="M12 14L16 18L20 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="16" cy="16" r="2.5" fill="currentColor"/>
              </svg>
            </div>
            <span className="rg-brand-name">InterviewAI</span>
          </div>

          <h1 className="rg-h1">Create account.</h1>
          <p className="rg-sub">Start your interview preparation today</p>

          <form onSubmit={handleRegister} noValidate>

            {/* Full Name */}
            <div className={`rg-field${focused === 'name' ? ' rg-field-active' : ''}`}>
              <label className="rg-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                Full name
              </label>
              <input
                className={`rg-input${fullNameError ? ' rg-input-err' : ''}`}
                type="text" placeholder="Jay Raval"
                value={fullName} onChange={e => setFullName(e.target.value)}
                onFocus={() => setFocused('name')}
                onBlur={() => { setFocused(''); setTouched(p => ({ ...p, fullName: true })) }}
                required
              />
              {fullNameError && <p className="rg-field-err">{fullNameError}</p>}
            </div>

            {/* Email */}
            <div className={`rg-field${focused === 'email' ? ' rg-field-active' : ''}`}>
              <label className="rg-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/></svg>
                Email address
              </label>
              <input
                className={`rg-input${emailError ? ' rg-input-err' : ''}`}
                type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')}
                onBlur={() => { setFocused(''); setTouched(p => ({ ...p, email: true })) }}
                required
              />
              {emailError && <p className="rg-field-err">{emailError}</p>}
            </div>

            {/* Password */}
            <div className={`rg-field${focused === 'pass' ? ' rg-field-active' : ''}`}>
              <label className="rg-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Password
              </label>
              <div className="rg-iw">
                <input
                  className={`rg-input rg-input-p${passwordError ? ' rg-input-err' : ''}`}
                  type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pass')}
                  onBlur={() => { setFocused(''); setTouched(p => ({ ...p, password: true })) }}
                  required
                />
                <button type="button" className="rg-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                  {showPass ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {passwordError
                ? <p className="rg-field-err">{passwordError}</p>
                : !touched.password && <p className="rg-field-hint">Uppercase, lowercase, number · min 8 chars</p>
              }
            </div>

            {/* Resume Upload */}
            <div className="rg-field">
              <label className="rg-label">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Resume
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, marginLeft: '4px' }}>optional · PDF · max 5MB</span>
              </label>
              <label className={`rg-upload${resumeFile ? ' rg-upload-ok' : ''}`}>
                <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                <div className="rg-upload-icon">
                  {resumeFile ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {resumeFile ? (
                    <>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '600', color: '#10B981', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{resumeFile.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{(resumeFile.size / 1024).toFixed(0)} KB · click to change</p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>Click to upload resume</p>
                      <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Recruiters use this for screening</p>
                    </>
                  )}
                </div>
                {resumeFile && (
                  <div onClick={e => { e.preventDefault(); setResumeFile(null) }}
                    style={{ padding: '4px', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, transition: 'color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#F87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </div>
                )}
              </label>
              {resumeError && <p className="rg-field-err">{resumeError}</p>}
            </div>

            {/* Error */}
            {error && (
              <div className="rg-error">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" className="btn-launch"
              disabled={loading || !isValid}
              onMouseMove={trackMouse}
            >
              {loading && <span className="rg-spinner" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>

          </form>

          <div className="rg-div"><span>or</span></div>

          <p className="rg-login">
            Already have an account? <Link to="/login">Sign in →</Link>
          </p>

          <div className="rg-trust">
            {['End-to-end encrypted', 'Zero-trust secure', 'Free forever'].map(label => (
              <span key={label} className="rg-tbadge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {label}
              </span>
            ))}
          </div>

          <p className="rg-footer">
            By creating an account you agree to our{' '}
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