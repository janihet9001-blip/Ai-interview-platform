import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import SimplePeer from 'simple-peer'
import PropTypes from 'prop-types'

export default function CameraStream({ sessionId, userId }) {
  const peerRef = useRef(null)
  const stompRef = useRef(null)
  const streamRef = useRef(null)
  const cameraStartedRef = useRef(false)
  const [showBanner, setShowBanner] = useState(false)
  const [cameraStarted, setCameraStarted] = useState(false)
  const [error, setError] = useState(null)

  const stopAllTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop()
        track.enabled = false
      })
      streamRef.current = null
    }
  }

  const startStream = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })

      streamRef.current = stream
      cameraStartedRef.current = true
      setCameraStarted(true)
      setShowBanner(false)

      const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
      })

      peer.on('signal', (signal) => {
        if (stompRef.current?.connected) {
          stompRef.current.publish({
            destination: '/app/webrtc/offer',
            body: JSON.stringify({ signal, userId, sessionId }),
          })
        }
      })

      peer.on('error', (err) => {
        console.error('Peer connection error:', err)
        setError('Camera connection failed. Please refresh and try again.')
      })

      peer.on('close', () => {
        stopAllTracks()
      })

      peerRef.current = peer
    } catch (err) {
      console.error('Camera access error:', err)
      if (err.name === 'NotAllowedError') {
        alert('Camera access denied. Please allow camera in browser settings and refresh.')
      } else if (err.name === 'NotFoundError') {
        alert('No camera found. Please connect a camera and refresh.')
      } else {
        alert('Failed to access camera. Please check your permissions.')
      }
      setError(err.message)
      setShowBanner(true)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) {
        try { peerRef.current.destroy() } catch (e) {}
        peerRef.current = null
      }
      stopAllTracks()
      if (stompRef.current) {
        try { stompRef.current.deactivate() } catch (e) {}
        stompRef.current = null
      }
    }
  }, [])

  // WebSocket connection setup
  useEffect(() => {
    if (!sessionId || !userId) return

    const stomp = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
stomp.subscribe(`/topic/webrtc/answer/${userId}`, (msg) => {
  try {
    const { signal } = JSON.parse(msg.body)
    if (peerRef.current && !peerRef.current.destroyed) {
      peerRef.current.signal(signal)
    } else {
      // Peer not ready yet — retry once after a short delay
      setTimeout(() => {
        if (peerRef.current && !peerRef.current.destroyed) {
          peerRef.current.signal(signal)
        }
      }, 2000)
    }
  } catch (err) {
    console.error('Failed to process WebRTC answer:', err)
  }
})
      },
      onStompError: (frame) => { console.error('STOMP error:', frame) },
      onDisconnect: () => { console.log('WebSocket disconnected for camera stream') },
    })

    stomp.activate()
    stompRef.current = stomp

    const bannerTimeout = setTimeout(() => {
      if (!cameraStartedRef.current) {
        setShowBanner(true)
      }
    }, 0)

    return () => {
      clearTimeout(bannerTimeout)
      if (stompRef.current) {
        try { stompRef.current.deactivate() } catch (e) {}
        stompRef.current = null
      }
    }
  }, [sessionId, userId])

  if (cameraStarted) return null
  if (!showBanner && !error) return null

  return (
    <>
      <style>{`
        @keyframes fadeUp-camera {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
        }
        @keyframes pulse-cam {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1;   }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        top: '72px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999,
        background: 'linear-gradient(145deg, #0F121A 0%, rgba(15,18,26,0.98) 100%)',
        border: error
          ? '1px solid rgba(248,113,113,0.35)'
          : '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: error
          ? '0 8px 32px rgba(248,113,113,0.12)'
          : '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: '400px',
        animation: 'fadeUp-camera 0.3s ease forwards',
        backdropFilter: 'blur(20px)',
      }}>

        {/* Icon */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
          background: error ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
          border: error ? '1px solid rgba(248,113,113,0.25)' : '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {error ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '13px', fontWeight: '600',
            color: error ? '#F87171' : '#F3F4F6',
            marginBottom: '2px',
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            {error ? 'Camera Error' : 'Camera Access Required'}
          </div>
          <div style={{
            fontSize: '11px', color: '#6B7280', lineHeight: '1.5',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {error
              ? 'Unable to access camera. Check permissions and refresh.'
              : 'This interview requires camera access for identity verification.'}
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={startStream}
          style={{
            padding: '7px 16px', borderRadius: '8px',
            background: error ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.08)',
            color: error ? '#F87171' : '#F3F4F6',
            border: error ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(255,255,255,0.15)',
            fontWeight: '600', fontSize: '12px', cursor: 'pointer', flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = error ? 'rgba(248,113,113,0.22)' : 'rgba(255,255,255,0.15)'
            e.currentTarget.style.borderColor = error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.3)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = error ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.08)'
            e.currentTarget.style.borderColor = error ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.15)'
          }}
        >
          {error ? 'Try Again' : 'Allow Camera'}
        </button>

        {/* Dismiss (only when no error) */}
        {!error && (
          <button
            onClick={() => setShowBanner(false)}
            style={{
              background: 'transparent', border: 'none',
              color: '#4B5563', cursor: 'pointer',
              padding: '4px', flexShrink: 0, lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.2s',
            }}
            aria-label="Close"
            onMouseEnter={e => { e.currentTarget.style.color = '#9CA3AF' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4B5563' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>
    </>
  )
}

CameraStream.propTypes = {
  sessionId: PropTypes.number,
  userId: PropTypes.number,
}