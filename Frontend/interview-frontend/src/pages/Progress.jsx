import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const WEEKLY = [
  { day: 'Mon', score: 72 },
  { day: 'Tue', score: 80 },
  { day: 'Wed', score: 74 },
  { day: 'Thu', score: 91 },
  { day: 'Fri', score: 85 },
  { day: 'Sat', score: 88 },
  { day: 'Sun', score: 0 },
]

const ROLE_SCORES = [
  { role: 'Java Developer', score: 82, sessions: 3, accent: '#f97316' },
  { role: 'React Developer', score: 74, sessions: 2, accent: '#06b6d4' },
  { role: 'Python Developer', score: 91, sessions: 4, accent: '#22c55e' },
  { role: 'Full Stack Dev', score: 67, sessions: 1, accent: '#a78bfa' },
  { role: 'DevOps Engineer', score: 55, sessions: 1, accent: '#94a3b8' },
  { role: 'ML Engineer', score: 88, sessions: 2, accent: '#ec4899' },
]

const STRENGTHS = [
  { label: 'OOP & Design Patterns', score: 90 },
  { label: 'React Hooks & Lifecycle', score: 84 },
  { label: 'Database Design', score: 78 },
  { label: 'System Design', score: 65 },
  { label: 'Algorithms & DSA', score: 58 },
]

const maxScore = Math.max(...WEEKLY.map(d => d.score))
const chartH = 140

export default function Progress() {
  const avg = Math.round(ROLE_SCORES.reduce((a, r) => a + r.score, 0) / ROLE_SCORES.length)
  const totalSessions = ROLE_SCORES.reduce((a, r) => a + r.sessions, 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', animation: 'fadeIn 0.4s ease' }}>
      <Navbar />

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', animation: 'fadeUp 0.5s ease both' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>
            Progress & Analytics
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Track your improvement across all roles over time.</p>
        </div>

        {/* Top stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '1.5rem', animation: 'fadeUp 0.5s ease 0.05s both' }}>
          {[
            { label: 'Overall Avg', value: `${avg}%`, color: '#e8b45a' },
            { label: 'Total Sessions', value: totalSessions, color: '#06b6d4' },
            { label: 'Best Role', value: 'Python', color: '#22c55e' },
            { label: 'Day Streak', value: '6', color: '#f97316' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1.5rem' }}>

          {/* Weekly bar chart */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '1.5rem',
            animation: 'fadeUp 0.5s ease 0.1s both',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', marginBottom: '1.25rem' }}>This Week</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: `${chartH}px` }}>
              {WEEKLY.map(({ day, score }) => {
                const h = score === 0 ? 6 : Math.max(12, (score / maxScore) * chartH)
                const color = score >= 85 ? '#3ddc84' : score >= 65 ? '#e8b45a' : score === 0 ? 'var(--border)' : '#ff5f6d'
                return (
                  <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 600 }}>{score > 0 ? `${score}` : ''}</div>
                    <div style={{
                      width: '100%', height: `${h}px`,
                      background: color, borderRadius: '4px 4px 0 0',
                      transition: 'height 0.6s ease',
                      opacity: score === 0 ? 0.3 : 1,
                    }} />
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{day}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Strengths */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '1.5rem',
            animation: 'fadeUp 0.5s ease 0.15s both',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', marginBottom: '1.25rem' }}>Topic Strengths</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {STRENGTHS.map(({ label, score }) => {
                const color = score >= 85 ? '#3ddc84' : score >= 65 ? '#e8b45a' : '#ff5f6d'
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{score}%</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '3px', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Role breakdown */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '1.5rem',
          animation: 'fadeUp 0.5s ease 0.2s both',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', marginBottom: '1.25rem' }}>Score by Role</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ROLE_SCORES.map(({ role, score, sessions, accent }) => {
              const color = score >= 85 ? '#3ddc84' : score >= 65 ? '#e8b45a' : '#ff5f6d'
              return (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '140px', fontSize: '13px', color: 'var(--text-dim)', flexShrink: 0 }}>{role}</div>
                  <div style={{ flex: 1, height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: accent, borderRadius: '3px' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color, width: '40px', textAlign: 'right' }}>{score}%</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)', width: '60px' }}>{sessions} session{sessions > 1 ? 's' : ''}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}