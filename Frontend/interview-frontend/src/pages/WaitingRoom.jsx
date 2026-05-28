import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import API from '../services/api'

export default function WaitingRoom() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const stompClient = useRef(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [camStatus, setCamStatus] = useState('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)
  const [error, setError] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkExistingSession = async () => {
      if (!user?.id) { setCheckingSession(false); return }
      try {
        const response = await API.get(`/interview/my-sessions`)
        const sessions = response.data || []
        const activeSession = sessions.find(s => s.status === 'IN_PROGRESS')
        if (activeSession) { navigate(`/interview/${activeSession.jobRole}?sessionId=${activeSession.id}`, { replace: true }); return }
      } catch (err) { console.error('Failed to check existing sessions:', err) }
      finally { setCheckingSession(false) }
    }
    checkExistingSession()
  }, [user, navigate])

  useEffect(() => {
    window.history.replaceState(null, '', '/waiting')
    window.history.pushState(null, '', '/waiting')
    const handlePopState = () => { window.history.pushState(null, '', '/waiting') }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!user?.id || checkingSession) return
    let isSubscribed = true
    let reconnectTimeout = null
    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
      reconnectDelay: 5000, heartbeatIncoming: 4000, heartbeatOutgoing: 4000,
      onConnect: () => {
        if (!isSubscribed) return
        client.subscribe(`/topic/session/${user.id}`, (msg) => {
          try {
            const data = JSON.parse(msg.body)
            if (isSubscribed) navigate(`/interview/${data.jobRole}?sessionId=${data.id}`, { replace: true })
          } catch (err) { console.error('Failed to parse session start message:', err); setError('Failed to start session. Please contact support.') }
        })
      },
      onDisconnect: () => {
        if (isSubscribed) reconnectTimeout = setTimeout(() => { if (isSubscribed && !client.connected) client.activate() }, 3000)
      },
      onStompError: () => setError('Connection error. Please refresh the page.'),
      onWebSocketError: () => setError('Network connection issue. Please check your internet.'),
    })
    client.activate()
    stompClient.current = client
    return () => {
      isSubscribed = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (stompClient.current) { try { stompClient.current.deactivate() } catch (e) {} stompClient.current = null }
    }
  }, [user, navigate, checkingSession])

  useEffect(() => {
    let mounted = true
    let stream = null
    async function startCamera() {
      if (!mounted) return
      setCamStatus('loading'); setError(null)
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCamStatus('active')
      } catch (err) {
        if (!mounted) return
        if (err.name === 'NotAllowedError') { setError('Camera access denied. Please allow camera in browser settings.'); setCamStatus('denied') }
        else if (err.name === 'NotFoundError') { setError('No camera found. Please connect a camera.'); setCamStatus('denied') }
        else { setError('Failed to access camera.'); setCamStatus('denied') }
      }
    }
    startCamera()
    return () => {
      mounted = false
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => { t.stop(); t.enabled = false }); streamRef.current = null }
      if (videoRef.current) videoRef.current.srcObject = null
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (!streamRef.current) return
    streamRef.current.getAudioTracks().forEach(t => { t.enabled = !isMuted })
    setIsMuted(prev => !prev)
  }, [isMuted])

  const toggleCam = useCallback(() => {
    if (!streamRef.current) return
    streamRef.current.getVideoTracks().forEach(t => { t.enabled = isCamOff })
    setIsCamOff(prev => !prev)
  }, [isCamOff])

  const isLight = theme === 'light'

  if (checkingSession) {
    return (
      <>
        <style>{getBaseStyles(theme)}</style>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isLight ? '#F8FAFC' : 'linear-gradient(135deg, #0A0C12 0%, #06080D 100%)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: `2px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, borderTopColor: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: isLight ? '#64748B' : '#6B7280', fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Checking your session...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{getBaseStyles(theme)}</style>
      <div className="scene-bg" />
      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

        {/* Navbar */}
        <nav className="top-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#FFFFFF,#8E9AA8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: '11px', color: '#0A0C12', boxShadow: isLight ? '0 1px 4px rgba(0,0,0,0.15)' : '0 0 12px rgba(255,255,255,0.2)', flexShrink: 0 }}>AI</div>
            <span className="logo-text">InterviewAI</span>
            <span className="badge-gray badge-candidate" style={{ marginLeft: '4px' }}>Candidate</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '12px', color: isLight ? '#334155' : '#8E9AA8' }}>{user?.fullName}</span>

            {/* Theme toggle */}
            <button onClick={toggleTheme} style={{
              width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer',
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
              border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease', flexShrink: 0,
            }}
              onMouseEnter={e => e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'}>
              {isLight ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8EDF2" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>

            <button className="btn-ghost-gray" onClick={logout} style={{ padding: '6px 16px', fontSize: '12px' }}>Sign out</button>
          </div>
        </nav>

        {/* Main */}
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 32px' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px', animation: 'fadeUp 0.4s ease forwards' }}>
            <p style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: isLight ? '#64748B' : 'rgba(220,222,230,0.5)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '8px' }}>Candidate Portal</p>
            <h1 className="page-heading">Waiting Room</h1>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '28px', alignItems: 'flex-start' }}>

            {/* Left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeUp 0.5s ease 0.1s forwards', opacity: 0, animationFillMode: 'forwards' }}>

              {/* Status card */}
              <div className="panel" onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`) }}>
                <div className="panel-header">
                  <div className="panel-step">
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.5)', animation: 'pulse-dot 2s infinite' }} />
                  </div>
                  <span className="panel-title">Session Status</span>
                  <span className="badge-gray badge-live" style={{ marginLeft: 'auto' }}>Live</span>
                </div>
                <div className="panel-body">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {/* Spinner */}
                      <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', inset: '-8px', borderRadius: '50%', border: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`, animation: 'breathe 3s ease-in-out infinite' }} />
                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `1.5px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'}`, borderTopColor: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', borderRightColor: isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)', animation: 'spin 2s linear infinite' }} />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '8px', height: '8px', borderRadius: '50%', background: isLight ? '#334155' : '#E5E7EB', boxShadow: isLight ? '0 0 12px rgba(51,65,85,0.4)' : '0 0 12px rgba(229,231,235,0.6)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: isLight ? '#0F172A' : '#F3F4F6', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Your interview will begin shortly</h2>
                        <p style={{ fontSize: '13px', color: isLight ? '#475569' : '#8E9AA8', lineHeight: '1.6', margin: 0 }}>Your recruiter is preparing your session. You will be redirected automatically when it starts.</p>
                      </div>
                    </div>

                    <div style={{ padding: '12px 16px', background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px rgba(16,185,129,0.4)', animation: 'pulse-dot 2s infinite', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: isLight ? '#475569' : '#D1D5DB' }}>Connected as <strong style={{ color: isLight ? '#0F172A' : '#F3F4F6' }}>{user?.fullName}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips card */}
              <div className="panel" onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`) }}>
                <div className="panel-header">
                  <div className="panel-step" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: '700', color: isLight ? '#64748B' : '#9CA3AF' }}>i</div>
                  <span className="panel-title">Before You Begin</span>
                </div>
                <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Ensure you are in a quiet, well-lit environment',
                    'Close all unnecessary tabs and applications',
                    'Do not use AI tools or search engines during the interview',
                    'All activity is monitored — answer in your own words',
                    'Keep your camera on and visible throughout',
                  ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 10px', background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)', borderRadius: '7px', border: `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)'}` }}>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: isLight ? '#94A3B8' : '#6B7280', marginTop: '5px', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: isLight ? '#475569' : '#9CA3AF', lineHeight: '1.5' }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', borderLeft: '3px solid #F87171' }}>
                  <p style={{ fontSize: '12px', color: '#F87171', margin: 0, fontFamily: 'var(--font-mono)' }}>{error}</p>
                </div>
              )}
            </div>

            {/* Right — Camera */}
            <div style={{ animation: 'fadeUp 0.5s ease 0.2s forwards', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="panel" style={{ overflow: 'hidden' }} onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`) }}>

                <div className="panel-header" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: camStatus === 'active' ? '#10B981' : (isLight ? '#94A3B8' : '#4B5563'), display: 'inline-block', ...(camStatus === 'active' ? { animation: 'pulse-dot 2s infinite', boxShadow: '0 0 6px rgba(16,185,129,0.4)' } : {}) }} />
                    <span className="panel-title">{user?.fullName?.toUpperCase() ?? 'YOU'}</span>
                  </div>
                  <span className="badge-gray badge-live">LIVE</span>
                </div>

                {/* Video */}
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: isLight ? '#E2E8F0' : '#050810', overflow: 'hidden' }}>
                  <video ref={videoRef} autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)', opacity: camStatus === 'active' && !isCamOff ? 1 : 0, transition: 'opacity 0.3s' }} />

                  {camStatus === 'loading' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: isLight ? 'rgba(248,250,252,0.95)' : 'rgba(10,12,18,0.95)' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: `2px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`, borderTopColor: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', animation: 'spin 0.9s linear infinite' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: isLight ? '#64748B' : '#6B7280', letterSpacing: '0.1em' }}>Starting camera...</span>
                    </div>
                  )}

                  {camStatus === 'denied' && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: isLight ? 'rgba(248,250,252,0.95)' : 'rgba(10,12,18,0.95)' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="1.5">
                        <line x1="1" y1="1" x2="23" y2="23" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2" />
                      </svg>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#F87171', letterSpacing: '0.08em' }}>Camera denied</span>
                      <button onClick={() => window.location.reload()} style={{ padding: '5px 14px', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '6px', color: isLight ? '#334155' : '#E5E7EB', fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>Retry</button>
                    </div>
                  )}

                  {camStatus === 'active' && isCamOff && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: isLight ? 'rgba(241,245,249,0.95)' : 'rgba(10,12,18,0.95)' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '22px', color: isLight ? '#64748B' : '#6B7280', fontWeight: '700' }}>
                        {user?.fullName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: isLight ? '#64748B' : '#6B7280' }}>Camera off</span>
                    </div>
                  )}

                  {camStatus === 'active' && !isCamOff && (
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', opacity: 0.4, animation: 'scanline 3s linear infinite', pointerEvents: 'none' }} />
                  )}

                  {/* Corner brackets */}
                  {[
                    { top: 8, left: 8, borderTop: `1.5px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}`, borderLeft: `1.5px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}` },
                    { top: 8, right: 8, borderTop: `1.5px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}`, borderRight: `1.5px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}` },
                    { bottom: 8, left: 8, borderBottom: `1.5px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}`, borderLeft: `1.5px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}` },
                    { bottom: 8, right: 8, borderBottom: `1.5px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}`, borderRight: `1.5px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)'}` },
                  ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 14, height: 14, opacity: 0.7, ...s }} />)}
                </div>

                {/* Controls */}
                <div className="panel-body" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={toggleMute} disabled={camStatus !== 'active'}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isMuted ? 'rgba(248,113,113,0.1)' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'), border: isMuted ? '1px solid rgba(248,113,113,0.3)' : `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '7px', padding: '6px 12px', color: isMuted ? '#F87171' : (isLight ? '#475569' : '#9CA3AF'), fontFamily: 'var(--font-mono)', fontSize: '11px', cursor: camStatus !== 'active' ? 'not-allowed' : 'pointer', opacity: camStatus !== 'active' ? 0.4 : 1, transition: 'all 0.2s' }}>
                    {isMuted ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                    )}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </button>

                  <button onClick={toggleCam} disabled={camStatus !== 'active'}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: isCamOff ? 'rgba(248,113,113,0.1)' : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)'), border: isCamOff ? '1px solid rgba(248,113,113,0.3)' : `1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '7px', padding: '6px 12px', color: isCamOff ? '#F87171' : (isLight ? '#475569' : '#9CA3AF'), fontFamily: 'var(--font-mono)', fontSize: '11px', cursor: camStatus !== 'active' ? 'not-allowed' : 'pointer', opacity: camStatus !== 'active' ? 0.4 : 1, transition: 'all 0.2s' }}>
                    {isCamOff ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    )}
                    {isCamOff ? 'Start Cam' : 'Stop Cam'}
                  </button>

                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)', fontSize: '9px', color: isLight ? '#94A3B8' : '#6B7280' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: camStatus === 'active' ? '#10B981' : '#F87171', display: 'inline-block', animation: camStatus === 'active' ? 'pulse-dot 2s infinite' : 'none' }} />
                    {camStatus === 'active' ? 'Live' : camStatus}
                  </div>
                </div>

                {/* Info strip */}
                <div style={{ padding: '8px 14px', borderTop: `1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'}`, background: isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.01)' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: isLight ? '#94A3B8' : '#4B5563', margin: 0, lineHeight: 1.5 }}>
                    Your camera is visible to the recruiter. Ensure good lighting.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

function getBaseStyles(theme) {
  const isLight = theme === 'light'
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    :root {
      --font-mono: 'JetBrains Mono', monospace;
      --font-display: 'Inter', system-ui, sans-serif;
      --font-body: 'Inter', system-ui, sans-serif;
      --radius: 12px; --radius-sm: 8px; --radius-lg: 16px;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body, #root {
      background: ${isLight ? '#F8FAFC' : 'linear-gradient(135deg, #0A0C12 0%, #06080D 100%)'};
      color: ${isLight ? '#0F172A' : '#E8EDF2'};
      font-family: var(--font-body);
      min-height: 100vh;
    }

    .scene-bg {
      position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background: ${isLight
        ? 'radial-gradient(ellipse 60% 40% at 20% 10%, rgba(0,0,0,0.03) 0%, transparent 55%), radial-gradient(ellipse 50% 35% at 85% 80%, rgba(0,0,0,0.02) 0%, transparent 60%)'
        : 'radial-gradient(ellipse 60% 40% at 20% 10%, rgba(30,40,60,0.25) 0%, transparent 55%), radial-gradient(ellipse 50% 35% at 85% 80%, rgba(20,30,50,0.2) 0%, transparent 60%)'};
    }

    .top-nav {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 36px; height: 64px;
      background: ${isLight ? 'rgba(255,255,255,0.95)' : 'rgba(10,12,18,0.85)'};
      border-bottom: 1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'};
      position: sticky; top: 0; z-index: 100; backdrop-filter: blur(20px);
    }

    .logo-text {
      font-family: var(--font-display); font-weight: 800; font-size: 18px;
      background: ${isLight
        ? 'linear-gradient(110deg, #000000 20%, #334155 50%, #000000 80%)'
        : 'linear-gradient(110deg, #FFFFFF 20%, #8E9AA8 45%, #FFFFFF 70%)'};
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      animation: shimmer-premium 4s linear infinite; letter-spacing: -0.02em;
    }

    .page-heading {
      font-family: var(--font-display); font-size: 32px; font-weight: 800;
      background: ${isLight
        ? 'linear-gradient(110deg, #000000 25%, #334155 50%, #000000 75%)'
        : 'linear-gradient(110deg, #FFFFFF 25%, #8E9AA8 50%, #FFFFFF 75%)'};
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      animation: shimmer-premium 5s linear infinite; letter-spacing: -0.03em;
    }

    .panel {
      background: ${isLight
        ? 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)'
        : 'linear-gradient(145deg, #0F121A 0%, rgba(15,18,26,0.95) 100%)'};
      border: 1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'};
      border-radius: 12px; position: relative; isolation: isolate;
      transition: border-color 0.2s; overflow: hidden;
    }
    .panel::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(circle 180px at var(--mouse-x,50%) var(--mouse-y,50%), ${isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)'} 0%, ${isLight ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.02)'} 40%, transparent 70%);
      opacity: 0; transition: opacity 0.25s ease; pointer-events: none;
    }
    .panel:hover { border-color: ${isLight ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.16)'}; }
    .panel:hover::before { opacity: 1; }

    .panel-header {
      padding: 10px 14px;
      border-bottom: 1px solid ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'};
      display: flex; align-items: center; gap: 8px;
    }
    .panel-step {
      width: 20px; height: 20px; border-radius: 5px;
      background: ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'};
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-family: var(--font-mono); font-weight: 700;
      color: ${isLight ? '#64748B' : '#9CA3AF'};
    }
    .panel-title {
      font-size: 10px; font-family: var(--font-mono);
      color: ${isLight ? '#64748B' : '#6B7280'};
      letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600;
    }
    .panel-body { padding: 12px 14px; }

    .badge-gray { font-size: 9px; font-weight: 600; font-family: monospace; border-radius: 20px; padding: 2px 10px; letter-spacing: 0.06em; }
    .badge-live { background: rgba(229,231,235,0.1); color: #E5E7EB; border: 1px solid rgba(229,231,235,0.25); animation: pulse-glow 2s infinite; }
    .badge-candidate {
      background: ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'};
      color: ${isLight ? '#334155' : '#9CA3AF'};
      border: 1px solid ${isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)'};
    }

    .btn-ghost-gray {
      background: transparent;
      border: 1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)'};
      border-radius: 8px;
      color: ${isLight ? '#334155' : '#9CA3AF'};
      cursor: pointer; font-family: var(--font-body); font-size: 12px;
      transition: all 0.25s ease;
    }
    .btn-ghost-gray:hover {
      border-color: ${isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.25)'};
      color: ${isLight ? '#0F172A' : '#E5E7EB'};
      background: ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'};
    }

    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: ${isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'}; border-radius: 10px; }
    ::-webkit-scrollbar-thumb { background: ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.1)'}; border-radius: 10px; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse-dot { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
    @keyframes pulse-glow { 0%, 100% { opacity: .8; } 50% { opacity: 1; box-shadow: 0 0 8px rgba(229,231,235,0.35); } }
    @keyframes breathe { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.8; } }
    @keyframes scanline { 0% { top: 0; } 100% { top: 100%; } }
    @keyframes shimmer-premium { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
  `
}