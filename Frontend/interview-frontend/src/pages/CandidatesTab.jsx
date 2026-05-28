import { useMemo, useEffect, useState, useCallback, useRef } from 'react'
import PropTypes from 'prop-types'

const API_URL = import.meta.env.VITE_API_URL

function getToken() {
  return sessionStorage.getItem('token')
}

async function apiFetch(path, options = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (res.status === 204) return null
    if (res.status === 401) {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('auth')
      window.location.href = '/login'
      throw new Error('Session expired.')
    }
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json()
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') throw new Error('Request timeout.')
    throw err
  }
}

const statusConfig = (scorePct) => {
  if (scorePct === null || scorePct === undefined)
    return { label: 'PENDING', color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.25)', dot: '#94A3B8' }
  if (scorePct >= 75)
    return { label: 'SELECTED', color: '#34D399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.30)', dot: '#34D399' }
  if (scorePct >= 45)
    return { label: 'ON HOLD', color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.30)', dot: '#FBBF24' }
  return { label: 'NOT SELECTED', color: '#F87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.30)', dot: '#F87171' }
}

const scoreColor = (pct) => {
  if (pct === null || pct === undefined) return 'var(--ct-text-muted)'
  if (pct >= 70) return '#34D399'
  if (pct >= 45) return '#FBBF24'
  return '#F87171'
}

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('')

const avatarColor = () => {
  return ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.55)']
}

const getAiRemarkFromStorage = (sessionId) => {
  try {
    const stored = localStorage.getItem(`interview_analysis_${sessionId}`)
    if (!stored) return null
    const qs = JSON.parse(stored).filter(
      q => !q.isRecruiterQuestion && q.reason && !q.reason.includes('only available')
    )
    if (!qs.length) return null
    const avg = (key) => {
      const vals = qs.filter(q => q[key] != null)
      if (!vals.length) return null
      return Math.round(vals.reduce((a, q) => a + q[key], 0) / vals.length)
    }
    const suspicious = qs.filter(q => q.suspicious).length
    const parts = []
    const ac = avg('accuracy'), cf = avg('confidence'), au = avg('authenticity')
    if (ac != null) parts.push(`${ac}% accuracy`)
    if (cf != null) parts.push(`${cf}% confidence`)
    if (au != null) parts.push(`${au}% authenticity`)
    if (suspicious > 0) parts.push(`${suspicious} suspicious response${suspicious > 1 ? 's' : ''}`)
    return parts.length ? parts.join(' · ') : null
  } catch {
    return null
  }
}

CandidatesTab.propTypes = {
  candidates: PropTypes.array.isRequired,
  sessions: PropTypes.array.isRequired,
  loading: PropTypes.bool,
}

export default function CandidatesTab({ candidates, sessions = [], loading = false }) {
  const [openId, setOpenId] = useState(null)
  const [dbRemarks, setDbRemarks] = useState({})
  const [sessionScores, setSessionScores] = useState({})
  const [sessionRemarks, setSessionRemarks] = useState({})
  const [editingRemark, setEditingRemark] = useState(null)
  const [remarkDraft, setRemarkDraft] = useState('')
  const [scoreDraft, setScoreDraft] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState(null)
  const fetchedSessions = useRef(new Set())

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const data = await apiFetch('/recruiter/remarks/all')
        if (!isMounted || !data) return
        const map = {}
        data.forEach(r => {
          map[r.sessionId] = {
            recruiterScore: r.recruiterScore ?? null,
            remark: r.remark ?? '',
            status: r.status ?? 'PENDING',
          }
        })
        setDbRemarks(map)
        setError(null)
      } catch (err) {
        console.error('Failed to load remarks:', err)
        if (isMounted) setError('Failed to load recruiter remarks. Please refresh.')
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    if (!sessions.length) return
    sessions.forEach(s => {
      if (fetchedSessions.current.has(s.id)) return
      fetchedSessions.current.add(s.id)
      apiFetch(`/interview/${s.id}/questions`)
        .then(data => {
          if (!data || !data.length) return
          const realQs = data.filter(q => Number(q.questionNumber) !== 999)
          const answeredQs = realQs.filter(q => q.userAnswer && q.userAnswer.trim() !== '')
          if (!realQs.length) return
          const totalScore = answeredQs.reduce((a, q) => a + (q.score || 0), 0)
          const maxScore = answeredQs.length * 10
          const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null
          setSessionScores(prev => ({ ...prev, [s.id]: { pct, totalScore, answeredCount: answeredQs.length, totalCount: realQs.length } }))
          const feedbackQs = answeredQs.filter(q => q.aiFeedback && q.aiFeedback.trim() !== '').sort((a, b) => (b.score || 0) - (a.score || 0))
          const summary = pct != null ? `Overall ${pct}% — ${answeredQs.length}/${realQs.length} questions answered.` : `${answeredQs.length}/${realQs.length} questions answered.`
          if (feedbackQs.length > 0) {
            setSessionRemarks(prev => ({ ...prev, [s.id]: `${summary}\n\n${feedbackQs[0].aiFeedback}` }))
          } else {
            setSessionRemarks(prev => ({ ...prev, [s.id]: summary }))
          }
        })
        .catch(() => {})
    })
  }, [sessions])

  const saveRemark = useCallback(async (sessionId, text, score) => {
    const parsed = score !== '' ? parseInt(score) : null
    const scoreToSave = (!isNaN(parsed) && parsed != null && parsed >= 0 && parsed <= 100) ? parsed : null
    setSavingId(sessionId)
    setError(null)
    try {
      const saved = await apiFetch('/recruiter/remark', {
        method: 'POST',
        body: JSON.stringify({ sessionId, recruiterScore: scoreToSave, remark: text || null, status: statusConfig(scoreToSave).label }),
      })
      setDbRemarks(prev => ({ ...prev, [sessionId]: { recruiterScore: saved.recruiterScore ?? null, remark: saved.remark ?? '', status: saved.status ?? 'PENDING' } }))
    } catch (e) {
      console.error('Failed to save remark:', e)
      setError(`Failed to save: ${e.message}`)
    } finally {
      setSavingId(null)
    }
    setEditingRemark(null)
    setScoreDraft('')
  }, [])

  const rows = useMemo(() => sessions.map(s => {
    const candidate = candidates.find(c => c.id === (s.userId || s.user?.id))
    const name = candidate?.fullName || s.userName || s.user?.fullName || s.user?.email || `User #${s.userId || s.user?.id}`
    const fetched = sessionScores[s.id]
    let aiScorePct = null, scoreDisplay = null
    if (fetched) {
      aiScorePct = fetched.pct
      scoreDisplay = `${fetched.totalScore}/${fetched.answeredCount * 10}`
    } else if (s.totalQuestions > 0) {
      aiScorePct = Math.round((s.totalScore / (s.totalQuestions * 10)) * 100)
      scoreDisplay = `${s.totalScore}/${s.totalQuestions * 10}`
    } else if (s.totalScore > 0) {
      scoreDisplay = `${s.totalScore} pts`
    }
    const aiRemark = sessionRemarks[s.id] || getAiRemarkFromStorage(s.id)
    return { session: s, name, aiScorePct, scoreDisplay, aiRemark }
  }), [sessions, candidates, sessionScores, sessionRemarks])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return rows.filter(r => {
      const recScore = dbRemarks[r.session.id]?.recruiterScore ?? null
      const status = statusConfig(recScore)
      const matchSearch = !q || r.name.toLowerCase().includes(q) || String(r.session.id).includes(q) || (r.session.jobRole || '').toLowerCase().includes(q)
      const matchStatus = filterStatus === 'ALL' || status.label === filterStatus
      return matchSearch && matchStatus
    })
  }, [rows, search, filterStatus, dbRemarks])

  const statusCounts = useMemo(() => {
    const count = { ALL: rows.length, SELECTED: 0, 'ON HOLD': 0, 'NOT SELECTED': 0, PENDING: 0 }
    rows.forEach(r => {
      const recScore = dbRemarks[r.session.id]?.recruiterScore ?? null
      const label = statusConfig(recScore).label
      count[label] = (count[label] || 0) + 1
    })
    return count
  }, [rows, dbRemarks])

  const toggleExpand = useCallback((sessionId) => setOpenId(prev => prev === sessionId ? null : sessionId), [])
  const startEditing = useCallback((sessionId, currentRemark, currentScore) => { setEditingRemark(sessionId); setRemarkDraft(currentRemark); setScoreDraft(currentScore != null ? String(currentScore) : '') }, [])
  const cancelEditing = useCallback(() => { setEditingRemark(null); setScoreDraft('') }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '16px' }}>
      <div className="ct-spinner" />
      <p style={{ color: 'var(--ct-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px', margin: 0 }}>Loading candidates...</p>
    </div>
  )

  if (sessions.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: '12px' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--ct-surface-2)', border: '1px solid var(--ct-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ct-text-muted)" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <p style={{ color: 'var(--ct-text-primary)', fontSize: '15px', fontWeight: '600', margin: 0 }}>No completed interviews yet</p>
      <p style={{ color: 'var(--ct-text-muted)', fontSize: '13px', margin: 0 }}>Candidates will appear here after interviews are finished.</p>
    </div>
  )

  const filterOptions = [
    { key: 'ALL', label: 'All' },
    { key: 'SELECTED', label: 'Selected', color: '#34D399' },
    { key: 'ON HOLD', label: 'On Hold', color: '#FBBF24' },
    { key: 'NOT SELECTED', label: 'Not Selected', color: '#F87171' },
    { key: 'PENDING', label: 'Pending', color: '#94A3B8' },
  ]

  return (
    <>
      <style>{`
        .ct-root {
          --ct-bg: var(--bg-dark, #0A0C12);
          --ct-surface-1: var(--bg-surface, #0F121A);
          --ct-surface-2: var(--bg-surface-light, #151A24);
          --ct-border: rgba(255,255,255,0.07);
          --ct-border-hover: rgba(255,255,255,0.15);
          --ct-text-primary: #F1F5F9;
          --ct-text-secondary: #94A3B8;
          --ct-text-muted: #475569;
          --ct-input-bg: rgba(15,18,26,0.9);
          --ct-avatar-bg: rgba(255,255,255,0.07);
          --ct-avatar-border: rgba(255,255,255,0.10);
          --ct-avatar-text: rgba(255,255,255,0.60);
        }
        .light .ct-root {
          --ct-surface-1: #FFFFFF;
          --ct-surface-2: #F8FAFC;
          --ct-border: rgba(0,0,0,0.08);
          --ct-border-hover: rgba(0,0,0,0.18);
          --ct-text-primary: #0F172A;
          --ct-text-secondary: #475569;
          --ct-text-muted: #94A3B8;
          --ct-input-bg: #FFFFFF;
          --ct-avatar-bg: rgba(0,0,0,0.06);
          --ct-avatar-border: rgba(0,0,0,0.10);
          --ct-avatar-text: rgba(0,0,0,0.45);
        }

        .ct-spinner {
          width: 28px; height: 28px;
          border: 2px solid var(--ct-border);
          border-top-color: #6366F1;
          border-radius: 50%;
          animation: ct-spin 0.7s linear infinite;
        }
        @keyframes ct-spin { to { transform: rotate(360deg); } }
        @keyframes ct-fadeSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Search input */
        .ct-search {
          width: 100%; box-sizing: border-box;
          padding: 10px 36px 10px 38px;
          border-radius: 10px;
          border: 1px solid var(--ct-border);
          background: var(--ct-input-bg);
          color: var(--ct-text-primary);
          font-size: 13px;
          font-family: var(--font-body, 'Inter', sans-serif);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ct-search:focus {
          border-color: var(--ct-border-hover);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .ct-search::placeholder { color: var(--ct-text-muted); }

        /* Filter pills */
        .ct-filter-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 600;
          font-family: var(--font-mono, monospace);
          cursor: pointer; transition: all 0.2s ease;
          border: 1px solid var(--ct-border);
          background: transparent;
          color: var(--ct-text-secondary);
          white-space: nowrap;
        }
        .ct-filter-pill:hover { border-color: var(--ct-border-hover); color: var(--ct-text-primary); background: var(--ct-surface-2); }
        .ct-filter-pill.active { color: var(--ct-text-primary); border-color: var(--ct-border-hover); background: var(--ct-surface-2); }

        /* Table header */
        .ct-thead {
          display: grid;
          grid-template-columns: 2fr 1.1fr 190px 120px 44px;
          gap: 12px; padding: 8px 20px;
          font-size: 10px; font-weight: 600;
          font-family: var(--font-mono, monospace);
          color: var(--ct-text-muted);
          letter-spacing: 0.1em; text-transform: uppercase;
          border-bottom: 1px solid var(--ct-border);
          margin-bottom: 4px;
        }

        /* Candidate row */
        .ct-row {
          background: var(--ct-surface-1);
          border: 1px solid var(--ct-border);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ct-row:hover { border-color: var(--ct-border-hover); }
        .ct-row.open {
          border-color: var(--ct-border-hover);
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
        }
        .light .ct-row.open { box-shadow: 0 4px 24px rgba(0,0,0,0.06); }

        .ct-row-grid {
          display: grid;
          grid-template-columns: 2fr 1.1fr 190px 120px 44px;
          gap: 12px; padding: 14px 20px;
          align-items: center; cursor: pointer;
          transition: background 0.15s;
        }
        .ct-row-grid:hover { background: var(--ct-surface-2); }

        /* Score pill */
        .ct-score-box {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 7px 8px; border-radius: 9px;
          border: 1px solid var(--ct-border);
          background: var(--ct-surface-2);
          min-height: 50px;
        }

        /* Status badge */
        .ct-status-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 11px; border-radius: 20px;
          font-size: 10px; font-weight: 700;
          font-family: var(--font-mono, monospace);
          letter-spacing: 0.05em; white-space: nowrap;
          border: 1px solid;
        }
        .ct-status-dot {
          width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
        }

        /* Expanded panel */
        .ct-expand {
          border-top: 1px solid var(--ct-border);
          padding: 20px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
          animation: ct-fadeSlide 0.2s ease;
        }

        /* Remark cards */
        .ct-remark-card {
          border-radius: 12px; padding: 16px;
          border: 1px solid var(--ct-border);
          background: var(--ct-surface-2);
          display: flex; flex-direction: column; gap: 10px;
        }
        .ct-remark-label {
          font-size: 10px; font-weight: 600;
          font-family: var(--font-mono, monospace);
          letter-spacing: 0.1em; text-transform: uppercase;
        }

        /* Edit textarea */
        .ct-textarea {
          width: 100%; box-sizing: border-box;
          padding: 10px 12px; border-radius: 8px;
          border: 1px solid var(--ct-border);
          background: var(--ct-input-bg);
          color: var(--ct-text-primary);
          font-size: 13px; font-family: var(--font-body, 'Inter', sans-serif);
          line-height: 1.6; resize: vertical; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ct-textarea:focus {
          border-color: var(--ct-border-hover);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .ct-textarea::placeholder { color: var(--ct-text-muted); }

        /* Score input */
        .ct-score-input {
          width: 100%; box-sizing: border-box;
          padding: 7px 28px 7px 10px;
          border-radius: 8px; border: 1px solid var(--ct-border);
          background: var(--ct-input-bg); color: var(--ct-text-primary);
          font-size: 13px; font-family: var(--font-mono, monospace);
          outline: none; transition: border-color 0.2s;
        }
        .ct-score-input:focus { border-color: var(--ct-border-hover); }
        .ct-score-input::placeholder { color: var(--ct-text-muted); }

        /* Buttons */
        .ct-btn {
          padding: 7px 16px; border-radius: 8px;
          font-size: 12px; font-weight: 600;
          font-family: var(--font-body, 'Inter', sans-serif);
          cursor: pointer; transition: all 0.2s ease; border: 1px solid;
        }
        .ct-btn-ghost {
          background: transparent;
          border-color: var(--ct-border);
          color: var(--ct-text-secondary);
        }
        .ct-btn-ghost:hover { border-color: var(--ct-border-hover); color: var(--ct-text-primary); background: var(--ct-surface-1); }
        .ct-btn-primary {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.4);
          color: #818CF8;
        }
        .ct-btn-primary:hover:not(:disabled) { background: rgba(99,102,241,0.25); border-color: rgba(99,102,241,0.6); color: #A5B4FC; }
        .ct-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .ct-btn-edit {
          padding: 4px 12px; border-radius: 6px;
          font-size: 11px; font-weight: 600;
          font-family: var(--font-mono, monospace);
          cursor: pointer; transition: all 0.2s;
          background: var(--ct-surface-1);
          border: 1px solid var(--ct-border);
          color: var(--ct-text-secondary);
        }
        .ct-btn-edit:hover { border-color: var(--ct-border-hover); color: var(--ct-text-primary); }

        /* Error banner */
        .ct-error {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);
          color: #F87171; font-size: 13px;
        }

        /* Scrollbar */
        .ct-root ::-webkit-scrollbar { width: 3px; }
        .ct-root ::-webkit-scrollbar-thumb { background: var(--ct-border-hover); border-radius: 4px; }

        /* Progress bar */
        .ct-progress-bar { height: 4px; border-radius: 2px; background: var(--ct-surface-2); overflow: hidden; }
        .ct-progress-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
      `}</style>

      <div className="ct-root" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Error */}
        {error && (
          <div className="ct-error">
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Top bar: search + filters */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ct-text-muted)" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text" className="ct-search"
              placeholder="Search by name, role or session ID..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ct-text-muted)', fontSize: '16px', display: 'flex', alignItems: 'center', padding: 0 }}>×</button>
            )}
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {filterOptions.map(({ key, label, color }) => {
              const isActive = filterStatus === key
              const count = statusCounts[key] || 0
              return (
                <button key={key} className={`ct-filter-pill${isActive ? ' active' : ''}`}
                  onClick={() => setFilterStatus(key)}
                  style={isActive && color ? { borderColor: `${color}50`, color, background: `${color}12` } : {}}>
                  {color && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isActive ? color : 'var(--ct-text-muted)', display: 'inline-block', flexShrink: 0 }} />}
                  {label}
                  <span style={{ opacity: 0.55, fontWeight: 400 }}>({count})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Table header */}
        <div className="ct-thead">
          <span>Candidate</span>
          <span>Role</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center' }}>
            <span>AI Score</span>
            <span>Your Score</span>
          </div>
          <span style={{ textAlign: 'center' }}>Status</span>
          <span />
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ct-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            No candidates match your filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(({ session, name, aiScorePct, scoreDisplay, aiRemark }) => {
              const isOpen = openId === session.id
              const dbRemark = dbRemarks[session.id] || {}
              const recruiterRemark = dbRemark.remark || ''
              const recruiterScore = dbRemark.recruiterScore ?? null
              const status = statusConfig(recruiterScore)
              const isSaving = savingId === session.id
              const roleLabel = session.jobRole?.replace(/_/g, ' ') || '—'

              return (
                <div key={session.id} className={`ct-row${isOpen ? ' open' : ''}`}>

                  {/* Row */}
                  <div className="ct-row-grid" onClick={() => toggleExpand(session.id)} role="button" tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(session.id) } }}>

                    {/* Candidate */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                        background: 'var(--ct-avatar-bg)',
                        border: '1px solid var(--ct-avatar-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '600', fontSize: '14px',
                        color: 'var(--ct-avatar-text)',
                        letterSpacing: '0.02em',
                        fontFamily: 'var(--font-display)',
                      }}>{initials(name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ct-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--ct-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>Session #{session.id}</div>
                      </div>
                    </div>

                    {/* Role */}
                    <div style={{ minWidth: 0 }}>
                      <span style={{
                        display: 'inline-block', fontSize: '11px', fontFamily: 'var(--font-mono)',
                        color: 'var(--ct-text-secondary)', background: 'var(--ct-surface-2)',
                        border: '1px solid var(--ct-border)', borderRadius: '6px',
                        padding: '3px 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                      }}>{roleLabel}</span>
                    </div>

                    {/* Scores */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>

                      {/* AI Score */}
                      <div className="ct-score-box">
                        {aiScorePct !== null ? (
                          <>
                            <span style={{ fontSize: '19px', fontWeight: '800', fontFamily: 'var(--font-display)', color: scoreColor(aiScorePct), lineHeight: 1 }}>{aiScorePct}%</span>
                            {scoreDisplay && <span style={{ fontSize: '9px', color: 'var(--ct-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>{scoreDisplay}</span>}
                          </>
                        ) : scoreDisplay ? (
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ct-text-secondary)' }}>{scoreDisplay}</span>
                        ) : (
                          <span style={{ fontSize: '18px', color: 'var(--ct-text-muted)' }}>—</span>
                        )}
                      </div>

                      {/* Recruiter Score */}
                      <div className="ct-score-box" style={recruiterScore != null ? { borderColor: `${scoreColor(recruiterScore)}40`, background: `${scoreColor(recruiterScore)}08` } : {}}>
                        {recruiterScore != null ? (
                          <>
                            <span style={{ fontSize: '19px', fontWeight: '800', fontFamily: 'var(--font-display)', color: scoreColor(recruiterScore), lineHeight: 1 }}>{recruiterScore}%</span>
                            <span style={{ fontSize: '9px', color: 'var(--ct-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px' }}>yours</span>
                          </>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--ct-text-muted)', fontFamily: 'var(--font-mono)' }}>+ score</span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <span className="ct-status-badge" style={{ color: status.color, background: status.bg, borderColor: status.border }}>
                        <span className="ct-status-dot" style={{ background: status.dot }} />
                        {status.label}
                      </span>
                    </div>

                    {/* Chevron */}
                    <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--ct-text-muted)', transition: 'transform 0.25s ease', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>

                  {/* Expanded */}
                  {isOpen && (
                    <div className="ct-expand">

                      {/* AI Remark */}
                      <div className="ct-remark-card" style={{ borderLeft: '3px solid rgba(139,92,246,0.5)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="4"/></svg>
                          </div>
                          <span className="ct-remark-label" style={{ color: '#8B5CF6' }}>AI Remark</span>
                        </div>
                        {aiRemark ? (
                          (() => {
                            const lines = aiRemark.split('\n\n')
                            const summary = lines[0]
                            const feedback = lines[1] || null
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '11px', color: 'var(--ct-text-muted)', margin: 0, fontFamily: 'var(--font-mono)' }}>{summary}</p>
                                {feedback && <p style={{ fontSize: '13px', color: 'var(--ct-text-secondary)', margin: 0, lineHeight: '1.65' }}>{feedback}</p>}
                              </div>
                            )
                          })()
                        ) : (
                          <p style={{ fontSize: '13px', color: 'var(--ct-text-muted)', margin: 0, fontStyle: 'italic' }}>No AI analysis available for this session.</p>
                        )}
                        {aiScorePct !== null && (
                          <div style={{ marginTop: '4px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ fontSize: '10px', color: 'var(--ct-text-muted)', fontFamily: 'var(--font-mono)' }}>AI Score</span>
                              <span style={{ fontSize: '10px', fontWeight: '700', color: scoreColor(aiScorePct), fontFamily: 'var(--font-mono)' }}>{aiScorePct}%</span>
                            </div>
                            <div className="ct-progress-bar">
                              <div className="ct-progress-fill" style={{ width: `${aiScorePct}%`, background: scoreColor(aiScorePct) }} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Recruiter Remark */}
                      <div className="ct-remark-card" style={{ borderLeft: '3px solid rgba(99,102,241,0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </div>
                            <span className="ct-remark-label" style={{ color: '#6366F1' }}>Your Remark</span>
                          </div>
                          {editingRemark !== session.id && (
                            <button className="ct-btn-edit" onClick={() => startEditing(session.id, recruiterRemark, recruiterScore)}>
                              {recruiterRemark || recruiterScore != null ? 'Edit' : '+ Add'}
                            </button>
                          )}
                        </div>

                        {editingRemark === session.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <textarea
                              autoFocus rows={3} value={remarkDraft}
                              onChange={e => setRemarkDraft(e.target.value)}
                              placeholder="Write your remark about this candidate..."
                              className="ct-textarea"
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--ct-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>Score (0–100)</label>
                              <div style={{ position: 'relative', flex: 1 }}>
                                <input type="number" min="0" max="100" value={scoreDraft} placeholder="e.g. 82"
                                  onChange={e => { const v = e.target.value; if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) setScoreDraft(v) }}
                                  className="ct-score-input"
                                />
                                <span style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--ct-text-muted)', pointerEvents: 'none' }}>%</span>
                              </div>
                              {scoreDraft !== '' && (
                                <span style={{ fontSize: '17px', fontWeight: '800', fontFamily: 'var(--font-display)', color: scoreColor(Number(scoreDraft)), minWidth: '44px', textAlign: 'center', flexShrink: 0 }}>{scoreDraft}%</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button className="ct-btn ct-btn-ghost" onClick={cancelEditing}>Cancel</button>
                              <button className="ct-btn ct-btn-primary" disabled={isSaving} onClick={() => saveRemark(session.id, remarkDraft, scoreDraft)}>
                                {isSaving ? 'Saving…' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {recruiterScore != null && (
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                  <span style={{ fontSize: '10px', color: 'var(--ct-text-muted)', fontFamily: 'var(--font-mono)' }}>Your Score</span>
                                  <span style={{ fontSize: '10px', fontWeight: '700', color: scoreColor(recruiterScore), fontFamily: 'var(--font-mono)' }}>{recruiterScore}%</span>
                                </div>
                                <div className="ct-progress-bar">
                                  <div className="ct-progress-fill" style={{ width: `${recruiterScore}%`, background: scoreColor(recruiterScore) }} />
                                </div>
                              </div>
                            )}
                            <p style={{
                              fontSize: '13px', margin: 0, lineHeight: '1.65',
                              color: recruiterRemark ? 'var(--ct-text-secondary)' : 'var(--ct-text-muted)',
                              fontStyle: recruiterRemark ? 'normal' : 'italic',
                            }}>
                              {recruiterRemark || 'No remark added yet. Click "+ Add" to write one.'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}