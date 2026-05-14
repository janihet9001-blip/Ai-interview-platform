import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const current = location.pathname

  const links = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'History', path: '/history' },
    { label: 'Progress', path: '/progress' },
    { label: 'Profile', path: '/profile' },
  ]

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2.5rem', height: '64px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
        <Logo size={32} />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.01em' }}>InterviewAI</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {links.map(({ label, path }) => {
          const active = current === path
          return (
            <button key={label} onClick={() => navigate(path)} style={{
              padding: '7px 16px',
              background: active ? 'var(--surface2)' : 'transparent',
              border: active ? '1px solid var(--border)' : '1px solid transparent',
              borderRadius: 'var(--radius)',
              color: active ? 'var(--text)' : 'var(--text-dim)',
              fontSize: '13px', fontWeight: active ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface2)' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent' } }}
            >{label}</button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '6px 14px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}>
          <div style={{
            width: '28px', height: '28px',
            background: 'var(--accent)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#000', fontWeight: 800, fontSize: '12px',
            fontFamily: 'var(--font-display)',
          }}>
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{user?.fullName}</span>
        </div>
        <button onClick={logout} style={{
          padding: '8px 14px', background: 'transparent',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          color: 'var(--text-dim)', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(255,95,109,0.08)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(255,95,109,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
        >Logout</button>
      </div>
    </nav>
  )
}