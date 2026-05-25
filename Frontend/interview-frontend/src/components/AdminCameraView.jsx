import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import SimplePeer from 'simple-peer'

export default function AdminCameraView({ userId }) {
  const videoRef = useRef(null)
  const peerRef = useRef(null)
  const stompRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    const stomp = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
      onConnect: () => {
        stomp.subscribe(`/topic/webrtc/offer/${userId}`, (msg) => {
          const { signal } = JSON.parse(msg.body)
          const peer = new SimplePeer({ initiator: false, trickle: false })
          peer.on('signal', (answerSignal) => {
            stomp.publish({
              destination: '/app/webrtc/answer',
              body: JSON.stringify({ signal: answerSignal, userId })
            })
          })
          peer.on('stream', (stream) => {
            if (videoRef.current) videoRef.current.srcObject = stream
          })
          peer.signal(signal)
          peerRef.current = peer
        })
      }
    })
    stomp.activate()
    stompRef.current = stomp

    return () => {
      peerRef.current?.destroy()
      stompRef.current?.deactivate()
    }
  }, [userId])

  return (
    <div style={{ marginTop: '12px' }}>
      <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginBottom: '6px' }}>Live Camera</p>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ width: '280px', borderRadius: '10px', border: '1px solid #1E2D45', background: '#0D1117' }}
      />
    </div>
  )
}