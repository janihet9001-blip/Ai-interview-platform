import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

  .lp-page {
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
  .lp-vanta {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 0 !important;
  }
  .lp-particles {
    position: absolute; inset: 0;
    pointer-events: none; z-index: 1; overflow: hidden;
  }
  .lp-particle {
    position: absolute; bottom: -10px; border-radius: 50%;
    background: linear-gradient(135deg, #60a5fa, #06b6d4);
    animation: lpRise linear infinite;
  }
  @keyframes lpRise {
    0%   { transform: translateY(0) scale(1);       opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.5; }
    100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
  }
  .lp-rings {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: 1;
  }
  .lp-ring {
    position: absolute; border-radius: 50%;
    border: 1px solid rgba(37,99,235,.20);
    width: 80px; height: 80px;
    animation: lpRing 11s ease-out infinite;
  }
  @keyframes lpRing {
    0%   { width: 80px;  height: 80px;  opacity: 0.7; }
    100% { width: 900px; height: 900px; opacity: 0;   }
  }
  .lp-top-badge {
    position: absolute; top: 22px; left: 50%; transform: translateX(-50%);
    display: flex; align-items: center; gap: 8px;
    padding: 6px 18px;
    background: rgba(4,6,24,.78);
    border: 1px solid rgba(96,165,250,.28); border-radius: 50px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    letter-spacing: 2px; color: rgba(120,190,255,.9);
    white-space: nowrap; backdrop-filter: blur(12px); z-index: 10;
  }
  .lp-badge-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #22c55e; box-shadow: 0 0 8px #22c55e;
    flex-shrink: 0; animation: lpDot 1.8s ease-in-out infinite;
  }
  @keyframes lpDot {
    0%,100% { opacity: 1; transform: scale(1);   }
    50%      { opacity: .3; transform: scale(1.3); }
  }
  .lp-chip {
    position: absolute; display: flex; flex-direction: column;
    align-items: center; padding: 10px 16px;
    background: rgba(4,8,36,.72);
    border: 1px solid rgba(80,160,255,.22); border-radius: 14px;
    backdrop-filter: blur(12px); z-index: 10;
    animation: lpChip 5s ease-in-out infinite;
  }
  .lp-chip-v {
    font-family: 'Syne', sans-serif; font-size: 18px;
    font-weight: 800; color: #fff; line-height: 1;
  }
  .lp-chip-l {
    font-size: 9.5px; color: rgba(96,165,250,.82); font-weight: 600;
    letter-spacing: .5px; margin-top: 3px;
    font-family: 'JetBrains Mono', monospace;
  }
  .lp-chip-a { top: 18%; left: 5%;  animation-delay: 0s;   }
  .lp-chip-b { top: 18%; right: 5%; animation-delay: 1.6s; }
  .lp-chip-c { bottom: 22%; right: 5%; animation-delay: 3.2s; }
  @keyframes lpChip {
    0%,100% { transform: translateY(0);   }
    50%      { transform: translateY(-8px); }
  }
  .lp-card {
    position: relative; z-index: 20;
    width: 420px; max-width: 94vw;
    max-height: 96vh; overflow-y: auto; scrollbar-width: none;
    background: rgba(6,10,36,.75);
    border: 1px solid rgba(80,140,255,.26); border-radius: 26px;
    padding: 42px 38px 34px;
    backdrop-filter: blur(30px) saturate(160%);
    -webkit-backdrop-filter: blur(30px) saturate(160%);
    box-shadow:
      0 0 0 1px rgba(80,160,255,.06),
      0 8px 40px rgba(0,0,0,.7),
      inset 0 0 80px rgba(37,99,235,.08),
      0 32px 80px rgba(0,0,0,.4);
    animation: lpCard .6s cubic-bezier(.22,1,.36,1) both;
    transition: border-color .3s, box-shadow .3s;
  }
  .lp-card::-webkit-scrollbar { display: none; }
  .lp-card:hover {
    border-color: rgba(96,165,250,.38);
    box-shadow:
      0 0 0 1px rgba(80,160,255,.1),
      0 8px 60px rgba(0,0,0,.75),
      inset 0 0 100px rgba(37,99,235,.1),
      0 0 60px rgba(59,130,246,.1);
  }
  @keyframes lpCard {
    from { opacity:0; transform:translateY(28px) scale(.97); }
    to   { opacity:1; transform:translateY(0)    scale(1);   }
  }
  .lp-card::before {
    content:''; position:absolute; inset:0; border-radius:26px; padding:1px;
    background: linear-gradient(125deg,
      rgba(37,99,235,.4), rgba(96,165,250,.8),
      rgba(139,92,246,.5), rgba(147,197,253,.85), rgba(37,99,235,.4));
    background-size: 300% 300%;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    opacity:0; transition: opacity .45s;
    animation: lpBorder 8s ease infinite; pointer-events:none;
  }
  .lp-card:hover::before { opacity:1; }
  @keyframes lpBorder {
    0%   { background-position: 0% 50%;   }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%;   }
  }
  .lp-shimmer {
    position:absolute; top:0; left:12%; right:12%; height:1px;
    background: linear-gradient(90deg, transparent, rgba(120,180,255,.75), rgba(180,130,255,.6), transparent);
    border-radius:50%; pointer-events:none;
    animation: lpShimmer 4s ease-in-out infinite;
  }
  @keyframes lpShimmer { 0%,100%{opacity:.7} 50%{opacity:1} }
  .lp-brand {
    display:flex; align-items:center; gap:12px;
    margin-bottom:28px; justify-content:center;
  }
  .lp-logo-box {
    width:42px; height:42px;
    background: linear-gradient(135deg,#2563eb,#06b6d4);
    border-radius:12px; display:flex; align-items:center; justify-content:center;
    box-shadow: 0 0 20px rgba(37,99,235,.6); flex-shrink:0;
    position:relative; overflow:hidden;
  }
  .lp-logo-box::after {
    content:''; position:absolute; top:-50%; left:-60%;
    width:180%; height:180%;
    background: linear-gradient(115deg, rgba(255,255,255,.22) 0%, transparent 70%);
    transform: rotate(25deg);
    animation: lpLogoShine 5s ease-in-out infinite;
  }
  @keyframes lpLogoShine {
    0%   { transform: translateX(-100%) rotate(25deg); }
    75%  { transform: translateX(80%)   rotate(25deg); }
    100% { transform: translateX(180%)  rotate(25deg); }
  }
  .lp-brand-name {
    font-family:'Syne',sans-serif; font-size:20px;
    font-weight:800; color:#fff; letter-spacing:-.3px;
  }
  .lp-brand-name span { color:#60a5fa; }
  .lp-h1 {
    font-family:'Syne',sans-serif; font-size:27px; font-weight:800;
    color:#fff; text-align:center; letter-spacing:-.5px; margin-bottom:6px;
  }
  .lp-sub {
    font-size:13px; color:rgba(148,163,184,.72); text-align:left;
    margin-bottom:28px; padding-left:14px;
    border-left:2.5px solid rgba(37,99,235,.6); line-height:1.5;
  }
  .lp-field { margin-bottom:16px; }
  .lp-label {
    display:flex; align-items:center; gap:7px;
    font-size:11px; font-weight:600; color:rgba(148,163,184,.65);
    letter-spacing:1px; text-transform:uppercase; margin-bottom:8px;
    font-family:'JetBrains Mono',monospace; transition:color .22s;
  }
  .lp-label svg { color:rgba(96,165,250,.6); flex-shrink:0; transition:color .22s; }
  .lp-field-active .lp-label { color:rgba(96,165,250,.9); }
  .lp-field-active .lp-label svg { color:#60a5fa; }
  .lp-iw { position:relative; display:flex; align-items:center; }
  .lp-input {
    width:100%; padding:13px 16px;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(80,140,255,.18); border-radius:11px;
    color:#e2e8f0; font-family:'DM Sans',sans-serif; font-size:14px;
    outline:none; transition:border-color .22s, box-shadow .22s, background .22s;
  }
  .lp-input::placeholder { color:rgba(100,116,139,.5); }
  .lp-input:hover:not(:focus) {
    border-color:rgba(80,140,255,.32); background:rgba(255,255,255,.06);
  }
  .lp-input:focus {
    border-color:rgba(96,165,250,.6);
    box-shadow:0 0 0 3px rgba(37,99,235,.15), 0 0 20px rgba(37,99,235,.08);
    background:rgba(255,255,255,.07);
  }
  .lp-input-p { padding-right:44px; }
  .lp-eye {
    position:absolute; right:12px; background:none; border:none;
    cursor:pointer; color:rgba(100,116,139,.65);
    display:flex; align-items:center; padding:4px;
    border-radius:6px; transition:color .15s, background .15s;
  }
  .lp-eye:hover { color:#60a5fa; background:rgba(96,165,250,.1); }
  .lp-row {
    display:flex; justify-content:space-between; align-items:center;
    margin-bottom:20px;
  }
  .lp-remember {
    display:flex; align-items:center; gap:8px;
    font-size:13px; color:rgba(148,163,184,.72);
    cursor:pointer; user-select:none; transition:color .2s;
  }
  .lp-remember:hover { color:rgba(148,163,184,1); }
  .lp-chk {
    width:16px; height:16px;
    border:1.5px solid rgba(80,140,255,.35); border-radius:5px;
    background:rgba(255,255,255,.04);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; transition:all .2s;
  }
  .lp-chk-on {
    background:#2563eb; border-color:#2563eb;
    box-shadow:0 0 10px rgba(37,99,235,.5);
  }
  .lp-forgot {
    background:none; border:none; font-family:'DM Sans',sans-serif;
    font-size:13px; font-weight:600; color:#60a5fa;
    cursor:pointer; transition:color .2s; padding:0;
  }
  .lp-forgot:hover { color:#93c5fd; }
  .lp-error {
    display:flex; align-items:center; gap:8px;
    padding:11px 14px; background:rgba(239,68,68,.10);
    border:1px solid rgba(239,68,68,.28); border-radius:10px;
    color:#f87171; font-size:13px; margin-bottom:16px;
    animation:lpErr .3s ease;
  }
  .lp-error svg { flex-shrink:0; }
  @keyframes lpErr {
    from { opacity:0; transform:translateY(-6px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  .lp-btn {
    width:100%; padding:14px;
    background:linear-gradient(135deg,#2563eb,#1d4ed8);
    border:none; border-radius:11px; color:#fff;
    font-family:'DM Sans',sans-serif; font-size:14.5px; font-weight:700;
    letter-spacing:.2px; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:10px;
    position:relative; overflow:hidden;
    box-shadow:0 4px 20px rgba(37,99,235,.5);
    transition:transform .15s, box-shadow .15s;
  }
  .lp-btn::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(180deg,rgba(255,255,255,.1) 0%,transparent 55%);
    border-radius:inherit; pointer-events:none;
  }
  .lp-btn::after {
    content:''; position:absolute; inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.18),transparent);
    transform:translateX(-100%); transition:transform .5s ease;
  }
  .lp-btn:hover::after { transform:translateX(100%); }
  .lp-btn:hover:not(:disabled) {
    transform:translateY(-2px);
    box-shadow:0 8px 32px rgba(37,99,235,.65), 0 0 50px rgba(59,130,246,.15);
  }
  .lp-btn:active:not(:disabled) { transform:translateY(0); }
  .lp-btn:disabled { opacity:.55; cursor:not-allowed; transform:none; }
  .lp-spinner {
    width:16px; height:16px;
    border:2.5px solid rgba(255,255,255,.3); border-top-color:#fff;
    border-radius:50%; animation:lpSpin .65s linear infinite; flex-shrink:0;
  }
  @keyframes lpSpin { to { transform:rotate(360deg); } }
  .lp-div {
    position:relative; text-align:center; margin:20px 0;
  }
  .lp-div::before,.lp-div::after {
    content:''; position:absolute; top:50%; height:1px;
    width:calc(50% - 20px); background:rgba(80,140,255,.16);
  }
  .lp-div::before{left:0} .lp-div::after{right:0}
  .lp-div span {
    font-size:11px; color:rgba(100,116,139,.6);
    padding:0 10px; font-family:'JetBrains Mono',monospace;
  }
  .lp-reg {
    text-align:center; font-size:13px;
    color:rgba(148,163,184,.65); margin-bottom:20px;
  }
  .lp-reg a { color:#60a5fa; font-weight:700; text-decoration:none; transition:color .2s; }
  .lp-reg a:hover { color:#93c5fd; }
  .lp-trust {
    display:flex; justify-content:center; gap:8px;
    flex-wrap:wrap; margin-bottom:14px;
  }
  .lp-tbadge {
    display:flex; align-items:center; gap:5px;
    padding:4px 10px;
    background:rgba(37,99,235,.10);
    border:1px solid rgba(37,99,235,.22); border-radius:50px;
    font-size:10.5px; color:rgba(96,165,250,.85);
    font-family:'JetBrains Mono',monospace; letter-spacing:.3px;
    transition:background .2s, border-color .2s;
  }
  .lp-tbadge:hover {
    background:rgba(37,99,235,.18); border-color:rgba(37,99,235,.4);
  }
  .lp-footer {
    text-align:center; font-size:11.5px; color:rgba(100,116,139,.5);
  }
  .lp-footer span { color:rgba(96,165,250,.65); cursor:pointer; transition:color .2s; }
  .lp-footer span:hover { color:#60a5fa; }
  @media(max-width:500px){
    .lp-card{width:92vw;padding:30px 20px 26px}
    .lp-chip-a{top:10%;left:2%} .lp-chip-b{top:10%;right:2%} .lp-chip-c{display:none}
    .lp-h1{font-size:22px}
  }
`

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused,  setFocused]  = useState('')
  const { login } = useAuth()
  const vantaRef    = useRef(null)
  const vantaEffect = useRef(null)
  const styleRef    = useRef(null)

  /* inject CSS once */
  useEffect(() => {
    if (!document.getElementById('lp-styles')) {
      const el = document.createElement('style')
      el.id = 'lp-styles'
      el.textContent = STYLES
      document.head.appendChild(el)
      styleRef.current = el
    }
    return () => { document.getElementById('lp-styles')?.remove() }
  }, [])

  useEffect(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }, [])

  /* Vanta Globe */
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
          color: 0x3b82f6,
          color2: 0x60a5fa,
          backgroundColor: 0x020816,
          points: 14,
          maxDistance: 22,
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

  const TRUST = ['End-to-end encrypted', 'Zero-trust secure', 'Premium AI']

  return (
    <div className="lp-page">

      {/* Vanta Globe bg */}
      <div ref={vantaRef} className="lp-vanta" />

      {/* Particles */}
      <div className="lp-particles">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="lp-particle" style={{
            left:              `${(i * 37 + 11) % 100}%`,
            width:             `${(i % 3) + 2}px`,
            height:            `${(i % 3) + 2}px`,
            animationDuration: `${10 + (i % 7) * 2}s`,
            animationDelay:    `${(i * 1.3) % 11}s`,
            opacity:            0.25 + (i % 4) * 0.12,
          }} />
        ))}
      </div>

      {/* Rings */}
      <div className="lp-rings">
        {[0, 2.5, 5, 7.5].map((d, i) => (
          <div key={i} className="lp-ring" style={{ animationDelay: `${d}s` }} />
        ))}
      </div>

      {/* Status badge */}
      <div className="lp-top-badge">
        <span className="lp-badge-dot" />
        NEURAL NETWORK ACTIVE
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
      <div className="lp-card">
        <div className="lp-shimmer" />

        {/* Brand */}
        <div className="lp-brand">
          <div className="lp-logo-box">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="4" width="24" height="24" rx="6" stroke="white" strokeWidth="1.5"/>
              <path d="M12 14L16 18L20 14" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="16" cy="16" r="2.5" fill="white"/>
            </svg>
          </div>
          <span className="lp-brand-name">Interview<span>AI</span></span>
        </div>

        <h1 className="lp-h1">Welcome back.</h1>
        <p className="lp-sub">Secure access &bull; premium experience</p>

        <form onSubmit={handleLogin} autoComplete="off">

          {/* Email */}
          <div className={`lp-field${focused === 'email' ? ' lp-field-active' : ''}`}>
            <label className="lp-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
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
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
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
          </div>

          {/* Row */}
          <div className="lp-row">
            <label className="lp-remember" onClick={() => setRemember(p => !p)}>
              <div className={`lp-chk${remember ? ' lp-chk-on' : ''}`}>
                {remember && (
                  <svg width="9" height="7" viewBox="0 0 10 8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 4l2.5 2.5L9 1"/>
                  </svg>
                )}
              </div>
              Remember me
            </label>
            <button type="button" className="lp-forgot">Forgot password?</button>
          </div>

          {error && (
            <div className="lp-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button type="submit" className="lp-btn" disabled={loading}>
            {loading && <span className="lp-spinner" />}
            {loading ? 'Signing in…' : 'Sign in to InterviewAI'}
          </button>

        </form>

        <div className="lp-div"><span>or</span></div>

        <p className="lp-reg">
          No account yet? <Link to="/register">Create one free &rarr;</Link>
        </p>

        <div className="lp-trust">
          {TRUST.map(label => (
            <span key={label} className="lp-tbadge">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    </div>
  )
}