import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

export default function WaitingRoom() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const stompClient = useRef(null)

  // Block back button — push a dummy state so back button stays on this page
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body)',
      padding: '24px',
    }}>

      {/* Animated rings */}
{/* Premium dual-ring spinner */}
<div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '48px' }}>
  {/* Outer breathing ring */}
  <div style={{
    position: 'absolute', inset: '-16px',
    borderRadius: '50%',
    border: '1px solid rgba(37,99,235,0.12)',
    animation: 'breathe 3s ease-in-out infinite',
  }} />
  {/* Middle static ring */}
  <div style={{
    position: 'absolute', inset: '-6px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.04)',
  }} />
  {/* Spinning ring */}
  <div style={{
    position: 'absolute', inset: 0,
    borderRadius: '50%',
    border: '1.5px solid rgba(255,255,255,0.05)',
    borderTopColor: '#2563EB',
    borderRightColor: 'rgba(6,182,212,0.4)',
    animation: 'spin 1.8s linear infinite',
  }} />
  {/* Center glow dot */}
  <div style={{
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '10px', height: '10px',
    borderRadius: '50%',
    background: '#2563EB',
    boxShadow: '0 0 16px #2563EB, 0 0 32px rgba(37,99,235,0.4)',
    animation: 'pulse-dot 1.5s ease-in-out infinite',
  }} />
</div>

      <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease forwards' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--cyan)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}>
          Stand by
        </p>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '40px',
          fontWeight: '800',
          marginBottom: '16px',
          lineHeight: 1.2,
        }}>
          Your interview will<br />begin shortly
        </h1>

        <p style={{
          color: 'var(--text-dim)',
          fontSize: '15px',
          maxWidth: '360px',
          margin: '0 auto 40px',
        }}>
          Your recruiter is preparing your session. You will be redirected automatically when it starts.
        </p>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '999px',
          marginBottom: '40px',
        }}>
<div style={{
  width: '7px', height: '7px',
  borderRadius: '50%',
  background: '#06B6D4',
  boxShadow: '0 0 8px #06B6D4',
  animation: 'pulse-dot 1.5s ease-in-out infinite',
}} />

          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            color: 'var(--text-dim)',
          }}>
            Connected as {user?.fullName}
          </span>
        </div>

        <div>
          <button
            className="btn-ghost"
            onClick={logout}
            style={{ fontSize: '14px' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
