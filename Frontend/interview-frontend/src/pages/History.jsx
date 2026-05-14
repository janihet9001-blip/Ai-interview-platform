import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const SESSIONS = [
  { id: 1, role: 'java', label: 'Java Developer', score: 82, questions: 5, time: '08:34', date: 'Today, 12:30 PM', accent: '#f97316' },
  { id: 2, role: 'react', label: 'React Developer', score: 74, questions: 5, time: '11:02', date: 'Yesterday, 3:15 PM', accent: '#06b6d4' },
  { id: 3, role: 'python', label: 'Python Developer', score: 91, questions: 5, time: '07:48', date: 'May 3, 10:00 AM', accent: '#22c55e' },
  { id: 4, role: 'fullstack', label: 'Full Stack Dev', score: 67, questions: 5, time: '13:22', date: 'May 2, 5:45 PM', accent: '#a78bfa' },
  { id: 5, role: 'devops', label: 'DevOps Engineer', score: 55, questions: 5, time: '09:10', date: 'May 1, 9:00 AM', accent: '#94a3b8' },
  { id: 6, role: 'ml', label: 'ML Engineer', score: 88, questions: 5, time: '10:55', date: 'Apr 30, 2:20 PM', accent: '#ec4899' },
]

const ROLE_ICONS = {
  java: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  react: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  ),
  python: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 2 6 4 6 7v2h6v1H5C3 10 2 11 2 14s1 4 3 4h2v-3c0-2 1-3 5-3s5 1 5 3v3h2c2 0 3-1 3-4s-1-4-3-4h-6V9h6V7c0-3-2-5-6-5z"/>
    </svg>
  ),
  fullstack: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  devops: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  ),
  ml: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
}

function ScoreBar({ score, accent }) {
  const color = score >= 85 ? '#3ddc84' : score >= 65 ? '#e8b45a' : '#ff5f6d'
  return (
    <div style={{ width: '140px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Score</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{score}%</span>
      </div>
      <div style={{ height: '4px', background: 'var(--surface2)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '2px' }} />
      </div>
    </div>
  )
}

export default function History() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filters = ['all', 'java', 'react', 'python', 'fullstack', 'devops', 'ml']

  const filtered = SESSIONS.filter(s => {
    const matchesFilter = filter === 'all' || s.role === filter
    const matchesSearch = s.label.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const avg = Math.round(SESSIONS.reduce((a, s) => a + s.score, 0) / SESSIONS.length)
  const best = Math.max(...SESSIONS.map(s => s.score))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', animation: 'fadeIn 0.4s ease' }}>
      <Navbar />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', animation: 'fadeUp 0.5s ease both' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '6px' }}>
            Session History
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>All your past interview sessions in one place.</p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '2rem', animation: 'fadeUp 0.5s ease 0.05s both' }}>
          {[
            { label: 'Total Sessions', value: SESSIONS.length, color: '#e8b45a' },
            { label: 'Average Score', value: `${avg}%`, color: '#06b6d4' },
            { label: 'Best Score', value: `${best}%`, color: '#3ddc84' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '1.25rem', flexWrap: 'wrap', animation: 'fadeUp 0.5s ease 0.1s both' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search sessions..."
            style={{
              flex: 1, minWidth: '200px', padding: '9px 14px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', color: 'var(--text)',
              fontSize: '13px', outline: 'none', fontFamily: 'var(--font-body)',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,180,90,0.1)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
          />
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '8px 14px',
                background: filter === f ? 'var(--accent)' : 'var(--surface)',
                color: filter === f ? '#000' : 'var(--text-dim)',
                border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s ease',
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Session list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeUp 0.5s ease 0.15s both' }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '3rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', color: 'var(--text-dim)', fontSize: '14px',
            }}>No sessions found.</div>
          ) : filtered.map((session, i) => (
            <div
              key={session.id}
              onClick={() => navigate(`/results/${session.id}`)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '1.1rem 1.5rem',
                display: 'flex', alignItems: 'center', gap: '16px',
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)',
                animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
              }}
              onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${session.accent}`; e.currentTarget.style.transform = 'translateX(5px)'; e.currentTarget.style.boxShadow = `0 4px 20px ${session.accent}20` }}
              onMouseLeave={e => { e.currentTarget.style.border = '1px solid var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{
                width: '42px', height: '42px', flexShrink: 0,
                background: `${session.accent}15`, border: `1px solid ${session.accent}30`,
                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: session.accent,
              }}>
                {ROLE_ICONS[session.role]}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '3px' }}>{session.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{session.questions} questions · {session.time} · {session.date}</div>
              </div>

              <ScoreBar score={session.score} accent={session.accent} />

              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}