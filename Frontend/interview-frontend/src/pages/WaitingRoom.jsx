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
      <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '48px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            inset: `${i * -20}px`,
            borderRadius: '50%',
            border: '1px solid #2563EB',
            opacity: 0.15 - i * 0.04,
            animation: `pulse-glow ${2 + i * 0.5}s ease infinite`,
          }} />
        ))}

        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563EB20, #06B6D420)',
          border: '1px solid #2563EB40',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid transparent',
            borderTopColor: '#2563EB',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
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
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--cyan)',
            animation: 'pulse-glow 1.5s ease infinite',
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
