import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const roles = [
  { key: 'JAVA_DEVELOPER', label: 'Java Developer', sub: 'Spring Boot · OOP · DSA', color: '#F97316' },
  { key: 'REACT_DEVELOPER', label: 'React Developer', sub: 'Hooks · Redux · Performance', color: '#06B6D4' },
  { key: 'PYTHON_DEVELOPER', label: 'Python Developer', sub: 'Django · Flask · ML', color: '#10B981' },
  { key: 'FULLSTACK_DEVELOPER', label: 'Full Stack Dev', sub: 'REST · MERN · Auth', color: '#8B5CF6' },
  { key: 'DEVOPS_ENGINEER', label: 'DevOps Engineer', sub: 'Docker · K8s · CI/CD', color: '#94A3B8' },
  { key: 'ML_ENGINEER', label: 'ML Engineer', sub: 'TensorFlow · PyTorch · DL', color: '#EC4899' },
]

const statusColor = { COMPLETED: 'badge-green', IN_PROGRESS: 'badge-blue', ABANDONED: 'badge-red' }
const statusLabel = { COMPLETED: 'Completed', IN_PROGRESS: 'In Progress', ABANDONED: 'Abandoned' }

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('start')
  const [hoveredRole, setHoveredRole] = useState(null)

  useEffect(() => {
    api.get('/interview/my-sessions')
      .then(res => { setSessions(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const totalSessions = sessions.length
  const completed = sessions.filter(s => s.status === 'COMPLETED')
  const avgScore = completed.length
    ? Math.round(completed.reduce((a, s) => a + (s.totalScore || 0), 0) / completed.length)
    : 0
  const bestScore = completed.length
    ? Math.max(...completed.map(s => s.totalScore || 0))
    : 0

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      {/* NAVBAR */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 32px', height: '64px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '13px', color: 'white',
          }}>AI</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '17px' }}>InterviewAI</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

          {/* Profile button */}
          <button
            onClick={() => navigate('/profile')}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '6px 14px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '999px',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: 'white',
            }}>
              {user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>{user?.fullName}</span>
          </button>

          <button
            className="btn-ghost"
            onClick={logout}
            style={{ padding: '8px 18px', fontSize: '14px' }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px', animation: 'fadeUp 0.4s ease forwards' }}>
          <p style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Candidate Portal
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '800', lineHeight: 1.2 }}>
            Welcome back, {user?.fullName?.split(' ')[0]}
          </h1>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px',
          marginBottom: '40px',
          animation: 'fadeUp 0.4s ease 0.1s both',
        }}>
          {[
            { label: 'Total Sessions', value: totalSessions, color: '#2563EB' },
            { label: 'Completed', value: completed.length, color: '#10B981' },
            { label: 'Avg Score', value: avgScore, color: '#06B6D4' },
            { label: 'Best Score', value: bestScore, color: '#F97316' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ padding: '24px' }}>
              <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '12px' }}>
                {stat.label}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '800', color: stat.color }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: '4px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '4px',
          width: 'fit-content',
          marginBottom: '32px',
        }}>
          {[['start', 'Start Interview'], ['history', 'Session History']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '8px 20px',
                borderRadius: '7px',
                border: 'none',
                background: tab === key ? 'var(--accent)' : 'transparent',
                color: tab === key ? 'white' : 'var(--text-dim)',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Start Interview Tab */}
        {tab === 'start' && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px',
            animation: 'fadeUp 0.3s ease forwards',
          }}>
            {roles.map(r => (
              <div
                key={r.key}
                className="card"
                onClick={() => navigate(`/interview/${r.key}`)}
                onMouseEnter={() => setHoveredRole(r.key)}
                onMouseLeave={() => setHoveredRole(null)}
                style={{
                  padding: '28px',
                  cursor: 'pointer',
                  borderColor: hoveredRole === r.key ? r.color + '60' : 'var(--border)',
                  boxShadow: hoveredRole === r.key ? `0 0 24px ${r.color}20` : 'none',
                  transform: hoveredRole === r.key ? 'translateY(-3px)' : 'none',
                  transition: 'all 0.25s ease',
                }}>
                <div style={{
                  width: '40px', height: '40px',
                  borderRadius: '10px',
                  background: r.color + '20',
                  border: `1px solid ${r.color}40`,
                  marginBottom: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: r.color }} />
                </div>
                <p style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>{r.label}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{r.sub}</p>
                <div style={{
                  marginTop: '20px',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: r.color,
                  opacity: hoveredRole === r.key ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                }}>
                  Start interview →
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div style={{ animation: 'fadeUp 0.3s ease forwards' }}>
            {loading ? (
              <p style={{ color: 'var(--text-dim)' }}>Loading sessions...</p>
            ) : sessions.length === 0 ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-dim)', marginBottom: '8px' }}>No sessions yet</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Start your first interview above</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {sessions.map(s => (
                  <div
                    key={s.id}
                    className="card"
                    style={{
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: s.status === 'COMPLETED' ? 'pointer' : 'default',
                    }}
                    onClick={() => s.status === 'COMPLETED' && navigate(`/results/${s.id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '40px', height: '40px',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)',
                      }}>
                        #{s.id}
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {s.jobRole?.replace(/_/g, ' ')}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(s.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span className={`badge ${statusColor[s.status]}`}>
                        {statusLabel[s.status]}
                      </span>
                      {s.status === 'COMPLETED' && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#10B981', fontSize: '16px' }}>
                          {s.totalScore}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}