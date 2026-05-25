import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import SimplePeer from 'simple-peer'

export default function CameraStream({ sessionId, userId }) {
  const peerRef = useRef(null)
  const stompRef = useRef(null)
  const [showBanner, setShowBanner] = useState(false)
  const [cameraStarted, setCameraStarted] = useState(false)

  const startStream = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
      setCameraStarted(true)
      setShowBanner(false)
      const peer = new SimplePeer({ initiator: true, trickle: false, stream })
      peer.on('signal', (signal) => {
        stompRef.current?.publish({
          destination: '/app/webrtc/offer',
          body: JSON.stringify({ signal, userId, sessionId })
        })
      })
      peerRef.current = peer
    }).catch(() => {
      alert('Camera access denied. Please allow camera in browser settings.')
    })
  }

  useEffect(() => {
    const stomp = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
      onConnect: () => {
        stomp.subscribe(`/topic/webrtc/answer/${userId}`, (msg) => {
          const { signal } = JSON.parse(msg.body)
          peerRef.current?.signal(signal)
        })
      }
    })
    stomp.activate()
    stompRef.current = stomp

    // Show banner after warning message has appeared (warning at 1800ms, banner at 5000ms)
    setTimeout(() => setShowBanner(true), 500)

    return () => {
      peerRef.current?.destroy()
      stompRef.current?.deactivate()
    }
  }, [sessionId, userId])

  if (!showBanner || cameraStarted) return null

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      background: 'linear-gradient(135deg, #0D1B2A, #0f2044)',
      border: '1px solid #2563eb',
      borderRadius: '14px',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
      minWidth: '400px',
      animation: 'fadeUp 0.3s ease forwards',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        background: 'rgba(37,99,235,0.15)',
        border: '1px solid rgba(37,99,235,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: '20px'
      }}>📷</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginBottom: '3px' }}>
          Camera Access Required
        </div>
        <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: '1.5' }}>
          This interview requires camera access for identity verification.
        </div>
      </div>
      <button
        onClick={startStream}
        style={{
          padding: '9px 20px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          color: 'white', border: 'none', fontWeight: '700',
          fontSize: '13px', cursor: 'pointer', flexShrink: 0,
          fontFamily: 'var(--font-body)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Allow Camera
      </button>
      <button
        onClick={() => setShowBanner(false)}
        style={{
          background: 'transparent', border: 'none',
          color: '#64748B', cursor: 'pointer', fontSize: '18px',
          padding: '0 4px', flexShrink: 0,
        }}
      >×</button>
    </div>
  )
}