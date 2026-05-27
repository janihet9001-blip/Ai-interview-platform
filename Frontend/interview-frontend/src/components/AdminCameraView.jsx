import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import SimplePeer from 'simple-peer'
import PropTypes from 'prop-types'

export default function AdminCameraView({ userId }) {
  const videoRef = useRef(null)
  const peerRef = useRef(null)
  const stompRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [error, setError] = useState(null)

  const cleanup = () => {
    if (peerRef.current) {
      try { peerRef.current.destroy() } catch (e) {}
      peerRef.current = null
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => { try { t.stop() } catch (e) {} })
      videoRef.current.srcObject = null
    }
    if (stompRef.current) {
      try { if (stompRef.current.connected) stompRef.current.deactivate() } catch (e) {}
      stompRef.current = null
    }
  }

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided')
      return
    }

    setConnectionStatus('connecting')
    setError(null)

    const stomp = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setConnectionStatus('connected')

        stomp.subscribe(`/topic/webrtc/offer/${userId}`, (msg) => {
          try {
            const { signal } = JSON.parse(msg.body)

            if (peerRef.current) {
              try { peerRef.current.destroy() } catch (e) {}
              peerRef.current = null
            }

            const peer = new SimplePeer({ initiator: false, trickle: false })

            peer.on('signal', (answerSignal) => {
              if (stomp.connected) {
                stomp.publish({
                  destination: '/app/webrtc/answer',
                  body: JSON.stringify({ signal: answerSignal, userId }),
                })
              }
            })

            peer.on('stream', (stream) => {
              if (videoRef.current) {
                videoRef.current.srcObject = stream
                setConnectionStatus('connected')
              }
            })

            peer.on('error', (err) => {
              console.error('Peer connection error:', err)
              setError('Camera stream connection failed')
              setConnectionStatus('error')
            })

            peer.on('close', () => {
              if (videoRef.current) videoRef.current.srcObject = null
              setConnectionStatus('disconnected')
            })

            peer.signal(signal)
            peerRef.current = peer
          } catch (err) {
            console.error('Failed to process WebRTC offer:', err)
            setError('Failed to establish camera connection')
            setConnectionStatus('error')
          }
        })
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame)
        setError('WebSocket connection error')
        setConnectionStatus('error')
      },
      onDisconnect: () => { setConnectionStatus('disconnected') },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event)
        setError('Network connection error')
        setConnectionStatus('error')
      },
    })

    stomp.activate()
    stompRef.current = stomp

    return cleanup
  }, [userId])

  const statusDot = {
    connected:    { color: '#10B981', shadow: 'rgba(16,185,129,0.4)',  anim: false },
    connecting:   { color: '#D1D5DB', shadow: 'rgba(209,213,219,0.3)', anim: true  },
    error:        { color: '#F87171', shadow: 'rgba(248,113,113,0.4)', anim: false },
    disconnected: { color: '#4B5563', shadow: 'transparent',           anim: false },
  }[connectionStatus] ?? { color: '#4B5563', shadow: 'transparent', anim: false }

  const statusLabel = {
    connected:    'Live',
    connecting:   'Connecting...',
    error:        'Error',
    disconnected: 'Waiting',
  }[connectionStatus] ?? 'Waiting'

  const borderColor = {
    connected:    'rgba(16,185,129,0.25)',
    connecting:   'rgba(255,255,255,0.06)',
    error:        'rgba(248,113,113,0.25)',
    disconnected: 'rgba(255,255,255,0.06)',
  }[connectionStatus] ?? 'rgba(255,255,255,0.06)'

  return (
    <>
      <style>{`
        @keyframes pulse-admin-cam {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1;   }
        }
        @keyframes scanline-admin {
          0%   { top: 0;    }
          100% { top: 100%; }
        }
      `}</style>

      {/* Panel wrapper — matches recruiter dashboard .panel */}
      <div style={{
        background: 'linear-gradient(145deg, #0F121A 0%, rgba(15,18,26,0.95) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        isolation: 'isolate',
        transition: 'border-color 0.2s',
      }}>

        {/* Panel header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: '8px',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Status dot */}
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: statusDot.color,
              boxShadow: `0 0 6px ${statusDot.shadow}`,
              display: 'inline-block',
              animation: statusDot.anim ? 'pulse-admin-cam 1.5s ease-in-out infinite' : 'none',
            }} />
            <span style={{
              fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
              color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '600',
            }}>
              Candidate Camera
            </span>
          </div>

          {/* Status badge */}
          <span style={{
            fontSize: '9px', fontWeight: '600',
            fontFamily: "'JetBrains Mono', monospace",
            borderRadius: '20px', padding: '2px 10px',
            letterSpacing: '0.06em',
            color: statusDot.color,
            background: `${statusDot.color}18`,
            border: `1px solid ${statusDot.color}40`,
          }}>
            {statusLabel}
          </span>
        </div>

        {/* Video area */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4/3',
          background: '#050810',
          overflow: 'hidden',
        }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
              border: 'none',
            }}
          />

          {/* Waiting overlay */}
          {connectionStatus !== 'connected' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '10px',
              background: 'rgba(5,8,16,0.92)',
            }}>
              {connectionStatus === 'connecting' && (
                <>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.08)',
                    borderTopColor: 'rgba(255,255,255,0.4)',
                    animation: 'spin-admin 1s linear infinite',
                  }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px', color: '#6B7280', letterSpacing: '0.08em',
                    textAlign: 'center', maxWidth: '160px', lineHeight: '1.5',
                  }}>
                    Waiting for candidate camera...
                  </span>
                </>
              )}

              {connectionStatus === 'disconnected' && (
                <>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.5">
                      <polygon points="23 7 16 12 23 17 23 7"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                  </div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px', color: '#4B5563', letterSpacing: '0.08em',
                  }}>
                    No feed
                  </span>
                </>
              )}

              {connectionStatus === 'error' && (
                <>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(248,113,113,0.08)',
                    border: '1px solid rgba(248,113,113,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2">
                      <line x1="1" y1="1" x2="23" y2="23"/>
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34"/>
                      <path d="M23 7v10"/>
                    </svg>
                  </div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px', color: '#F87171', letterSpacing: '0.08em',
                    textAlign: 'center', maxWidth: '150px', lineHeight: '1.5',
                  }}>
                    {error || 'Connection error'}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Scanline when live */}
          {connectionStatus === 'connected' && (
            <div style={{
              position: 'absolute', left: 0, right: 0, height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
              opacity: 0.4, animation: 'scanline-admin 3s linear infinite',
              pointerEvents: 'none',
            }} />
          )}

          {/* Corner brackets */}
          {[
            { top: 8, left: 8,  borderTop: '1.5px solid rgba(255,255,255,0.25)', borderLeft:  '1.5px solid rgba(255,255,255,0.25)' },
            { top: 8, right: 8, borderTop: '1.5px solid rgba(255,255,255,0.25)', borderRight: '1.5px solid rgba(255,255,255,0.25)' },
            { bottom: 8, left: 8,  borderBottom: '1.5px solid rgba(255,255,255,0.25)', borderLeft:  '1.5px solid rgba(255,255,255,0.25)' },
            { bottom: 8, right: 8, borderBottom: '1.5px solid rgba(255,255,255,0.25)', borderRight: '1.5px solid rgba(255,255,255,0.25)' },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 12, height: 12, opacity: 0.6, ...s }} />
          ))}
        </div>

        {/* Bottom strip */}
        <div style={{
          padding: '7px 14px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px', color: '#4B5563', margin: 0, lineHeight: 1.5,
          }}>
            {connectionStatus === 'connected'
              ? 'Live feed — candidate camera active'
              : connectionStatus === 'connecting'
              ? 'Awaiting candidate to enable camera'
              : connectionStatus === 'error'
              ? (error || 'Stream unavailable')
              : 'Select a candidate and launch an interview'}
          </p>
        </div>
      </div>

      <style>{`@keyframes spin-admin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

AdminCameraView.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
}