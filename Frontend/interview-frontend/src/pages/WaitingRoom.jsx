import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

export default function WaitingRoom() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const stompClient = useRef(null)

  // Camera state
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [camStatus, setCamStatus] = useState('idle') // idle | loading | active | denied
  const [isMuted, setIsMuted] = useState(false)
  const [isCamOff, setIsCamOff] = useState(false)

  // Block back button
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // WebSocket for session start
  useEffect(() => {
    if (!user?.id) return
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      onConnect: () => {
        client.subscribe(`/topic/session/${user.id}`, (msg) => {
          const data = JSON.parse(msg.body)
          navigate(`/interview/${data.jobRole}?sessionId=${data.id}`)
        })
      },
    })
    client.activate()
    stompClient.current = client
    return () => client.deactivate()
  }, [user, navigate])

  // Start camera on mount
  useEffect(() => {
    let stream
    async function startCamera() {
      setCamStatus('loading')
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setCamStatus('active')
      } catch {
        setCamStatus('denied')
      }
    }
    startCamera()
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  const toggleMute = () => {
    if (!streamRef.current) return
    streamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted })
    setIsMuted(v => !v)
  }

  const toggleCam = () => {
    if (!streamRef.current) return
    streamRef.current.getVideoTracks().forEach(t => { t.enabled = isCamOff })
    setIsCamOff(v => !v)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body)',
      padding: '32px 24px',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '40px',
        width: '100%',
        maxWidth: '900px',
        alignItems: 'center',
      }}>

        {/* ── LEFT: Waiting content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

          {/* Spinner */}
          <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '44px' }}>
            <div style={{
              position: 'absolute', inset: '-16px', borderRadius: '50%',
              border: '1px solid rgba(37,99,235,0.12)',
              animation: 'breathe 3s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '-6px', borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.04)',
            }} />
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.05)',
              borderTopColor: '#2563EB',
              borderRightColor: 'rgba(6,182,212,0.4)',
              animation: 'spin 1.8s linear infinite',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '10px', height: '10px', borderRadius: '50%',
              background: '#2563EB',
              boxShadow: '0 0 16px #2563EB, 0 0 32px rgba(37,99,235,0.4)',
              animation: 'pulse-dot 1.5s ease-in-out infinite',
            }} />
          </div>

          <div style={{ animation: 'fadeUp 0.5s ease forwards' }}>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--cyan)',
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px',
            }}>
              Stand by
            </p>

            <h1 style={{
              fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '800',
              marginBottom: '16px', lineHeight: 1.2,
            }}>
              Your interview will<br />begin shortly
            </h1>

            <p style={{
              color: 'var(--text-dim)', fontSize: '15px',
              maxWidth: '340px', margin: '0 auto 36px',
            }}>
              Your recruiter is preparing your session. You will be redirected automatically when it starts.
            </p>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              padding: '12px 20px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '999px', marginBottom: '36px',
            }}>
              <div style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#06B6D4', boxShadow: '0 0 8px #06B6D4',
                animation: 'pulse-dot 1.5s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-dim)' }}>
                Connected as {user?.fullName}
              </span>
            </div>

            <div>
              <button className="btn-ghost" onClick={logout} style={{ fontSize: '14px' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Camera panel ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: '0 0 24px rgba(6,182,212,0.08)',
          animation: 'fadeUp 0.6s ease 0.1s forwards',
          opacity: 0,
        }}>
          {/* Camera header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px',
            background: 'var(--surface2)',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: camStatus === 'active' ? 'var(--cyan)' : 'var(--text-muted)',
              boxShadow: camStatus === 'active' ? '0 0 6px var(--cyan)' : 'none',
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              color: 'var(--text)', letterSpacing: '0.08em', flex: 1,
            }}>
              {user?.fullName?.toUpperCase() ?? 'YOU'}
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '9px',
              letterSpacing: '0.15em', color: 'var(--red)',
              background: '#EF444415', border: '1px solid #EF444440',
              borderRadius: '4px', padding: '2px 6px',
            }}>
              LIVE
            </span>
          </div>

          {/* Video area */}
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '4/3',
            background: '#050810', overflow: 'hidden',
          }}>
            {/* Actual video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: 'block', transform: 'scaleX(-1)',
                opacity: camStatus === 'active' && !isCamOff ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
            />

            {/* Loading state */}
            {camStatus === 'loading' && (
              <div style={overlayStyle}>
                <div style={{
                  width: '26px', height: '26px', borderRadius: '50%',
                  border: '2px solid var(--border)', borderTopColor: 'var(--cyan)',
                  animation: 'spin 0.9s linear infinite',
                }} />
                <span style={overlayTextStyle}>Starting camera…</span>
              </div>
            )}

            {/* Denied state */}
            {camStatus === 'denied' && (
              <div style={overlayStyle}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="var(--red)" strokeWidth="1.5">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2" />
                </svg>
                <span style={{ ...overlayTextStyle, color: 'var(--red)' }}>Camera denied</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', padding: '0 12px' }}>
                  Allow camera access in browser settings
                </span>
              </div>
            )}

            {/* Cam off avatar */}
            {camStatus === 'active' && isCamOff && (
              <div style={overlayStyle}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: 'var(--surface3)', border: '2px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--accent)',
                }}>
                  {user?.fullName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <span style={overlayTextStyle}>Camera off</span>
              </div>
            )}

            {/* Scan line when active */}
            {camStatus === 'active' && !isCamOff && (
              <div style={{
                position: 'absolute', left: 0, right: 0, height: '1px',
                background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
                opacity: 0.3, animation: 'scanline 3s linear infinite',
                pointerEvents: 'none',
              }} />
            )}

            {/* Corner brackets */}
            {[
              { top: 8, left: 8, borderTop: '2px solid var(--cyan)', borderLeft: '2px solid var(--cyan)' },
              { top: 8, right: 8, borderTop: '2px solid var(--cyan)', borderRight: '2px solid var(--cyan)' },
              { bottom: 8, left: 8, borderBottom: '2px solid var(--cyan)', borderLeft: '2px solid var(--cyan)' },
              { bottom: 8, right: 8, borderBottom: '2px solid var(--cyan)', borderRight: '2px solid var(--cyan)' },
            ].map((style, i) => (
              <div key={i} style={{ position: 'absolute', width: 14, height: 14, opacity: 0.6, ...style }} />
            ))}
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 12px 10px', flexWrap: 'wrap',
          }}>
            <button
              onClick={toggleMute}
              style={isMuted ? camBtnActiveStyle : camBtnStyle}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="1" y1="1" x2="23" y2="23" />
                  <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                  <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                  <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={toggleCam}
              style={isCamOff ? camBtnActiveStyle : camBtnStyle}
              title={isCamOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isCamOff ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              )}
              <span>{isCamOff ? 'Start Cam' : 'Stop Cam'}</span>
            </button>

            <div style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px',
              fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: camStatus === 'active' ? 'var(--green)' : 'var(--red)',
                display: 'inline-block',
                animation: camStatus === 'active' ? 'pulse-dot 2s infinite' : 'none',
              }} />
              {camStatus === 'active' ? 'Live' : camStatus}
            </div>
          </div>

          {/* Info strip */}
          <div style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface2)',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              color: 'var(--text-muted)', margin: 0, lineHeight: 1.5,
            }}>
              Your camera is visible to the recruiter during the interview. Ensure good lighting.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanline { 0% { top: 0 } 100% { top: 100% } }
      `}</style>
    </div>
  )
}

// Shared inline styles
const overlayStyle = {
  position: 'absolute', inset: 0,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: '10px',
  background: 'var(--surface2)',
}
const overlayTextStyle = {
  fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)',
}
const camBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '5px',
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: '6px', padding: '5px 10px',
  color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '10px',
  cursor: 'pointer', transition: 'all 0.15s',
}
const camBtnActiveStyle = {
  display: 'flex', alignItems: 'center', gap: '5px',
  background: '#EF444420', border: '1px solid #EF444450',
  borderRadius: '6px', padding: '5px 10px',
  color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '10px',
  cursor: 'pointer', transition: 'all 0.15s',
}