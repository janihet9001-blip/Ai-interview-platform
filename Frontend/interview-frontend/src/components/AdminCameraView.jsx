import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import SimplePeer from 'simple-peer'
import PropTypes from 'prop-types'

export default function AdminCameraView({ userId }) {
  const videoRef = useRef(null)
  const peerRef = useRef(null)
  const stompRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // disconnected, connecting, connected, error
  const [error, setError] = useState(null)

  // Cleanup function
  const cleanup = () => {
    // Destroy peer connection
    if (peerRef.current) {
      try {
        peerRef.current.destroy()
      } catch (e) {
        // Ignore errors during cleanup
      }
      peerRef.current = null
    }

    // Stop any media tracks in video element
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => {
        try {
          track.stop()
        } catch (e) {
          // Ignore
        }
      })
      videoRef.current.srcObject = null
    }

    // Deactivate WebSocket
    if (stompRef.current) {
      try {
        if (stompRef.current.connected) {
          stompRef.current.deactivate()
        }
      } catch (e) {
        // Ignore
      }
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
            
            // Clean up existing peer if any
            if (peerRef.current) {
              try {
                peerRef.current.destroy()
              } catch (e) {
                // Ignore
              }
              peerRef.current = null
            }

            const peer = new SimplePeer({ 
              initiator: false, 
              trickle: false 
            })
            
            peer.on('signal', (answerSignal) => {
              if (stomp.connected) {
                stomp.publish({
                  destination: '/app/webrtc/answer',
                  body: JSON.stringify({ signal: answerSignal, userId })
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
              if (videoRef.current) {
                videoRef.current.srcObject = null
              }
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
      onDisconnect: () => {
        setConnectionStatus('disconnected')
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event)
        setError('Network connection error')
        setConnectionStatus('error')
      }
    })
    
    stomp.activate()
    stompRef.current = stomp

    // Cleanup on unmount
    return cleanup
  }, [userId])

  // Show different UI based on connection status
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10B981' // green
      case 'connecting': return '#F59E0B' // yellow
      case 'error': return '#EF4444' // red
      default: return '#64748B' // gray
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live'
      case 'connecting': return 'Connecting...'
      case 'error': return 'Connection Error'
      default: return 'Disconnected'
    }
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '6px' 
      }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '12px', margin: 0 }}>
          Live Camera
        </p>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px' 
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            animation: connectionStatus === 'connecting' ? 'pulse 1.5s ease-in-out infinite' : 'none'
          }} />
          <span style={{ 
            fontSize: '10px', 
            color: getStatusColor(),
            fontFamily: 'var(--font-mono)'
          }}>
            {getStatusText()}
          </span>
        </div>
      </div>
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ 
          width: '280px', 
          borderRadius: '10px', 
          border: connectionStatus === 'error' 
            ? '1px solid #EF4444' 
            : connectionStatus === 'connected'
              ? '1px solid #10B981'
              : '1px solid #1E2D45',
          background: '#0D1117',
          aspectRatio: '4/3',
          objectFit: 'cover'
        }}
      />
      
      {connectionStatus === 'error' && error && (
        <p style={{ 
          fontSize: '10px', 
          color: '#EF4444', 
          marginTop: '6px',
          fontFamily: 'var(--font-mono)'
        }}>
          {error}
        </p>
      )}
      
      {connectionStatus === 'connecting' && (
        <p style={{ 
          fontSize: '10px', 
          color: 'var(--text-dim)', 
          marginTop: '6px',
          fontFamily: 'var(--font-mono)'
        }}>
          Waiting for candidate to enable camera...
        </p>
      )}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

// PropTypes for type safety
AdminCameraView.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
}