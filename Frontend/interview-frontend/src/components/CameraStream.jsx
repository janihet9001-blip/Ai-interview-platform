import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import SimplePeer from 'simple-peer'
import PropTypes from 'prop-types'

export default function CameraStream({ sessionId, userId }) {
  const peerRef = useRef(null)
  const stompRef = useRef(null)
  const streamRef = useRef(null) // ✅ Added to track media stream
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
        audio: false 
      })
      
      streamRef.current = stream
      setCameraStarted(true)
      setShowBanner(false)
      
      const peer = new SimplePeer({ 
        initiator: true, 
        trickle: false, 
        stream 
      })
      
      peer.on('signal', (signal) => {
        if (stompRef.current?.connected) {
          stompRef.current.publish({
            destination: '/app/webrtc/offer',
            body: JSON.stringify({ signal, userId, sessionId })
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
      setShowBanner(true) // Keep showing banner to retry
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Destroy peer connection
      if (peerRef.current) {
        try {
          peerRef.current.destroy()
        } catch (e) {
          // Ignore errors during cleanup
        }
        peerRef.current = null
      }
      
      // Stop all media tracks
      stopAllTracks()
      
      // Deactivate WebSocket connection
      if (stompRef.current) {
        try {
          stompRef.current.deactivate()
        } catch (e) {
          // Ignore
        }
        stompRef.current = null
      }
    }
  }, [])

  // WebSocket connection setup
  useEffect(() => {
    // Don't setup WebSocket if no sessionId or userId
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
            }
          } catch (err) {
            console.error('Failed to process WebRTC answer:', err)
          }
        })
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame)
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected for camera stream')
      }
    })
    
    stomp.activate()
    stompRef.current = stomp

    // Show banner after 5 seconds (after warning message)
    const bannerTimeout = setTimeout(() => {
      if (!cameraStarted) {
        setShowBanner(true)
      }
    }, 5000)

    return () => {
      clearTimeout(bannerTimeout)
      if (stompRef.current) {
        try {
          stompRef.current.deactivate()
        } catch (e) {
          // Ignore
        }
        stompRef.current = null
      }
    }
  }, [sessionId, userId, cameraStarted])

  // If camera is already started, don't show anything
  if (cameraStarted) return null
  
  // If error occurred but still showing banner
  if (!showBanner && !error) return null

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      background: 'linear-gradient(135deg, #0D1B2A, #0f2044)',
      border: error ? '1px solid #EF4444' : '1px solid #2563eb',
      borderRadius: '14px',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: error ? '0 8px 32px rgba(239,68,68,0.3)' : '0 8px 32px rgba(37,99,235,0.3)',
      minWidth: '400px',
      animation: 'fadeUp 0.3s ease forwards',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: error ? 'rgba(239,68,68,0.15)' : 'rgba(37,99,235,0.15)',
        border: error ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(37,99,235,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '20px'
      }}>
        {error ? '⚠️' : '📷'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '700', 
          color: error ? '#EF4444' : 'white', 
          marginBottom: '3px' 
        }}>
          {error ? 'Camera Error' : 'Camera Access Required'}
        </div>
        <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
          {error 
            ? 'Unable to access camera. Please check permissions and refresh.' 
            : 'This interview requires camera access for identity verification.'}
        </div>
      </div>
      <button
        onClick={startStream}
        style={{
          padding: '9px 20px', borderRadius: '8px',
          background: error 
            ? 'linear-gradient(135deg, #EF4444, #DC2626)' 
            : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          color: 'white', border: 'none', fontWeight: '700',
          fontSize: '13px', cursor: 'pointer', flexShrink: 0,
          fontFamily: 'var(--font-body)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        {error ? 'Try Again' : 'Allow Camera'}
      </button>
      {!error && (
        <button
          onClick={() => setShowBanner(false)}
          style={{
            background: 'transparent', border: 'none',
            color: '#64748B', cursor: 'pointer', fontSize: '18px',
            padding: '0 4px', flexShrink: 0,
          }}
          aria-label="Close"
        >
          ×
        </button>
      )}
      
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

// PropTypes for type safety
CameraStream.propTypes = {
  sessionId: PropTypes.number,
  userId: PropTypes.number,
}