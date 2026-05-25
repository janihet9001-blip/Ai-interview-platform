import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import SimplePeer from 'simple-peer'

export default function CameraStream({ sessionId, userId }) {
  const videoRef = useRef(null)
  const peerRef = useRef(null)
  const stompRef = useRef(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  const startStream = () => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then((stream) => {
      setPermissionGranted(true)
      if (videoRef.current) videoRef.current.srcObject = stream
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

    return () => {
      peerRef.current?.destroy()
      stompRef.current?.deactivate()
    }
  }, [sessionId, userId])

  if (!permissionGranted) {
    return (
      <button onClick={startStream} style={{
        padding: '4px 12px', borderRadius: '6px',
        background: '#2563EB', color: 'white',
        border: 'none', fontSize: '12px', cursor: 'pointer',
        fontFamily: 'var(--font-mono)'
      }}>
        📷 Enable Camera
      </button>
    )
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      style={{ width: '160px', borderRadius: '8px', border: '1px solid #1E2D45' }}
    />
  )
}