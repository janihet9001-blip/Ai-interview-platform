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

const pctColor = (pct) =>
  pct >= 70 ? '#E5E7EB' : pct >= 45 ? '#D1D5DB' : '#9CA3AF'

const statusInfo = (scorePct) => {
  if (scorePct === null || scorePct === undefined)
    return { label: 'PENDING', color: '#64748B', bg: '#64748B15', border: '#64748B40' }
  if (scorePct >= 75)
    return { label: 'SELECTED', color: '#10B981', bg: '#10B98115', border: '#10B98140' }
  if (scorePct >= 45)
    return { label: 'ON HOLD', color: '#F59E0B', bg: '#F59E0B15', border: '#F59E0B40' }
  return { label: 'NOT SELECTED', color: '#EF4444', bg: '#EF444415', border: '#EF444440' }
}

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('')

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

  // Load recruiter remarks from DB
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

  // Fetch questions for each session — get real scores + single best feedback
  useEffect(() => {
    if (!sessions.length) return

    sessions.forEach(s => {
      if (fetchedSessions.current.has(s.id)) return
      fetchedSessions.current.add(s.id)

      apiFetch(`/interview/${s.id}/questions`)
        .then(data => {
          if (!data || !data.length) return

          // Exclude recruiter questions
          const realQs = data.filter(q => Number(q.questionNumber) !== 999)
          const answeredQs = realQs.filter(q => q.userAnswer && q.userAnswer.trim() !== '')

          if (!realQs.length) return

          // Calculate real score
          const totalScore = answeredQs.reduce((a, q) => a + (q.score || 0), 0)
          const maxScore = answeredQs.length * 10
          const pct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null

          setSessionScores(prev => ({
            ...prev,
            [s.id]: {
              pct,
              totalScore,
              answeredCount: answeredQs.length,
              totalCount: realQs.length,
            }
          }))

          // Build AI remark — ONLY one paragraph from the best answer
          const feedbackQs = answeredQs
            .filter(q => q.aiFeedback && q.aiFeedback.trim() !== '')
            .sort((a, b) => (b.score || 0) - (a.score || 0))

          if (feedbackQs.length > 0) {
            // Take only the single best feedback
            const bestFeedback = feedbackQs[0].aiFeedback

            const summary = pct != null
              ? `Overall ${pct}% — ${answeredQs.length}/${realQs.length} questions answered.`
              : `${answeredQs.length}/${realQs.length} questions answered.`

            setSessionRemarks(prev => ({
              ...prev,
              [s.id]: `${summary}\n\n${bestFeedback}`
            }))
          } else {
            // No feedback available — just show summary
            const summary = pct != null
              ? `Overall ${pct}% — ${answeredQs.length}/${realQs.length} questions answered.`
              : `${answeredQs.length}/${realQs.length} questions answered.`
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
        body: JSON.stringify({
          sessionId,
          recruiterScore: scoreToSave,
          remark: text || null,
          status: statusInfo(scoreToSave).label,
        }),
      })

      setDbRemarks(prev => ({
        ...prev,
        [sessionId]: {
          recruiterScore: saved.recruiterScore ?? null,
          remark: saved.remark ?? '',
          status: saved.status ?? 'PENDING',
        },
      }))
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
    let aiScorePct = null
    let scoreDisplay = null

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
      const status = statusInfo(recScore)
      const matchSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        String(r.session.id).includes(q) ||
        (r.session.jobRole || '').toLowerCase().includes(q)
      const matchStatus = filterStatus === 'ALL' || status.label === filterStatus
      return matchSearch && matchStatus
    })
  }, [rows, search, filterStatus, dbRemarks])

  const statusCounts = useMemo(() => {
    const count = { ALL: rows.length, SELECTED: 0, 'ON HOLD': 0, 'NOT SELECTED': 0, PENDING: 0 }
    rows.forEach(r => {
      const recScore = dbRemarks[r.session.id]?.recruiterScore ?? null
      const label = statusInfo(recScore).label
      count[label] = (count[label] || 0) + 1
    })
    return count
  }, [rows, dbRemarks])

  const toggleExpand = useCallback((sessionId) => {
    setOpenId(prev => prev === sessionId ? null : sessionId)
  }, [])

  const startEditing = useCallback((sessionId, currentRemark, currentScore) => {
    setEditingRemark(sessionId)
    setRemarkDraft(currentRemark)
    setScoreDraft(currentScore != null ? String(currentScore) : '')
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingRemark(null)
    setScoreDraft('')
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
      <div style={{
        width: '32px', height: '32px', border: '2px solid var(--border)',
        borderTopColor: '#E5E7EB', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
      }} />
      Loading candidates...
    </div>
  )

  if (sessions.length === 0) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>👥</div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>No completed interviews yet.</p>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
        Candidates will appear here after interviews are finished.
      </p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Error */}
      {error && (
        <div className="card-gray" style={{
          padding: '12px 16px',
          fontSize: '13px', color: '#F87171',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
      )}

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-dim)', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, role or session ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-gray"
            style={{
              width: '100%', padding: '10px 34px 10px 34px',
              borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              background: 'rgba(15,18,26,0.9)',
              color: 'var(--text)',
              fontSize: '13px', fontFamily: 'var(--font-mono)', outline: 'none',
              boxSizing: 'border-box', transition: 'all 0.3s ease',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(255,255,255,0.35)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.04)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '13px' }}>✕</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'SELECTED', 'ON HOLD', 'NOT SELECTED', 'PENDING'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className="filter-btn" style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '11px',
              fontFamily: 'var(--font-mono)', fontWeight: '600', cursor: 'pointer',
              border: `1px solid ${filterStatus === s ? 'rgba(255,255,255,0.35)' : 'var(--border)'}`,
              background: filterStatus === s ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
              color: filterStatus === s ? '#FFFFFF' : 'var(--text-dim)',
              transition: 'all 0.3s ease',
            }}>
              {s} <span style={{ opacity: 0.6 }}>({statusCounts[s] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '2fr 1.2fr 200px 130px 60px',
        gap: '12px', padding: '8px 20px',
        fontSize: '10px', fontFamily: 'var(--font-mono)',
        color: 'var(--text-dim)', letterSpacing: '0.08em',
        textTransform: 'uppercase', borderBottom: '1px solid var(--border)',
      }}>
        <span>Candidate</span>
        <span>Role</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', textAlign: 'center' }}>
          <span>AI Score</span>
          <span>Your Score</span>
        </div>
        <span style={{ textAlign: 'center' }}>Status</span>
        <span />
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          No candidates match your filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(({ session, name, aiScorePct, scoreDisplay, aiRemark }) => {
            const isOpen = openId === session.id
            const dbRemark = dbRemarks[session.id] || {}
            const recruiterRemark = dbRemark.remark || ''
            const recruiterScore = dbRemark.recruiterScore ?? null
            const status = statusInfo(recruiterScore)
            const isSaving = savingId === session.id

            return (
              <div 
                key={session.id} 
                className={`candidate-row ${isOpen ? 'open' : ''}`}
                style={{
                  border: `1px solid ${isOpen ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  background: isOpen ? 'rgba(255,255,255,0.03)' : 'var(--surface)',
                  overflow: 'hidden', transition: 'all 0.3s ease',
                }}
              >

                {/* Row */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(session.id) } }}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1.2fr 200px 130px 60px',
                    gap: '12px', padding: '16px 20px',
                    alignItems: 'center', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.parentElement.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.parentElement.style.background = 'var(--surface)' }}
                >
                  {/* Candidate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #E5E7EB, #9CA3AF)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '13px', color: '#0A0C12',
                    }}>{initials(name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>Session #{session.id}</div>
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.jobRole?.replace(/_/g, ' ') || '—'}
                  </div>

                  {/* Scores */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'center' }}>

                    {/* AI Score */}
                    <div style={{
                      textAlign: 'center', padding: '6px 4px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                    }}>
                      {aiScorePct !== null ? (
                        <>
                          <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-display)', color: pctColor(aiScorePct) }}>
                            {aiScorePct}%
                          </div>
                          {scoreDisplay && (
                            <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                              {scoreDisplay}
                            </div>
                          )}
                        </>
                      ) : scoreDisplay ? (
                        <>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)', fontFamily: 'var(--font-display)' }}>{scoreDisplay}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>score</div>
                        </>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>—</span>
                      )}
                    </div>

                    {/* Recruiter Score */}
                    <div style={{
                      textAlign: 'center', padding: '6px 4px', borderRadius: '8px',
                      background: recruiterScore != null ? `${pctColor(recruiterScore)}10` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${recruiterScore != null ? `${pctColor(recruiterScore)}40` : 'var(--border)'}`,
                    }}>
                      {recruiterScore != null ? (
                        <>
                          <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-display)', color: pctColor(recruiterScore) }}>
                            {recruiterScore}%
                          </div>
                          <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>recruiter</div>
                        </>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'block', padding: '4px 0' }}>+ score</span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 10px', borderRadius: '20px',
                      fontSize: '10px', fontWeight: '700', fontFamily: 'var(--font-mono)',
                      background: status.bg, color: status.color,
                      border: `1px solid ${status.border}`, letterSpacing: '0.05em',
                    }}>{status.label}</span>
                  </div>

                  {/* Chevron */}
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '14px', transition: 'transform 0.3s ease', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{
                    borderTop: '1px solid var(--border)', padding: '20px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
                    animation: 'fadeIn 0.3s ease',
                  }}>

                    {/* AI Remark — single paragraph */}
                    <div className="card-gray" style={{
                      padding: '16px', borderRadius: 'var(--radius)',
                      background: 'linear-gradient(145deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: '3px solid #A78BFA',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '15px' }}>🤖</span>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#A78BFA', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: '600' }}>AI Remark</span>
                      </div>
                      {aiRemark ? (
                        (() => {
                          const lines = aiRemark.split('\n\n')
                          const summary = lines[0]
                          const feedback = lines[1] || null
                          return (
                            <>
                              <p style={{ fontSize: '11px', color: '#94A3B8', margin: '0 0 10px', fontFamily: 'var(--font-mono)' }}>
                                {summary}
                              </p>
                              {feedback && (
                                <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: '1.7' }}>
                                  {feedback}
                                </p>
                              )}
                            </>
                          )
                        })()
                      ) : (
                        <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: '1.7', fontStyle: 'italic' }}>
                          No AI analysis available for this session.
                        </p>
                      )}
                    </div>

                    {/* Recruiter Remark */}
                    <div className="card-gray" style={{
                      padding: '16px', borderRadius: 'var(--radius)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      borderLeft: '3px solid #E5E7EB',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '15px' }}>✍️</span>
                          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#E5E7EB', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: '600' }}>Your Remark</span>
                        </div>
                        {editingRemark !== session.id && (
                          <button
                            onClick={() => startEditing(session.id, recruiterRemark, recruiterScore)}
                            className="edit-btn"
                            style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#E5E7EB', fontWeight: '600', transition: 'all 0.3s ease' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                          >{recruiterRemark || recruiterScore != null ? 'Edit' : '+ Add'}</button>
                        )}
                      </div>

                      {editingRemark === session.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <textarea
                            autoFocus
                            value={remarkDraft}
                            onChange={e => setRemarkDraft(e.target.value)}
                            placeholder="Write your remark about this candidate..."
                            rows={3}
                            className="input-gray"
                            style={{
                              width: '100%', padding: '10px', borderRadius: '8px',
                              border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(15,18,26,0.9)',
                              color: 'var(--text)', fontSize: '13px',
                              fontFamily: 'var(--font-body)', outline: 'none',
                              resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.6',
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              Your Score
                            </label>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={scoreDraft}
                                onChange={e => {
                                  const v = e.target.value
                                  if (v === '' || (Number(v) >= 0 && Number(v) <= 100)) setScoreDraft(v)
                                }}
                                placeholder="0–100"
                                className="input-gray"
                                style={{
                                  width: '100%', padding: '7px 30px 7px 10px',
                                  borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                                  background: 'rgba(15,18,26,0.9)', color: 'var(--text)',
                                  fontSize: '13px', fontFamily: 'var(--font-mono)',
                                  outline: 'none', boxSizing: 'border-box',
                                }}
                              />
                              <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>%</span>
                            </div>
                            {scoreDraft !== '' && (
                              <span style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'var(--font-display)', color: pctColor(Number(scoreDraft)), minWidth: '44px', textAlign: 'center', flexShrink: 0 }}>
                                {scoreDraft}%
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={cancelEditing}
                              className="btn-ghost-gray"
                              style={{ padding: '5px 14px', borderRadius: '6px', fontSize: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.3s ease' }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#FFFFFF' }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)' }}
                            >Cancel</button>
                            <button
                              disabled={isSaving}
                              onClick={() => saveRemark(session.id, remarkDraft, scoreDraft)}
                              className="btn-primary-gray"
                              style={{ padding: '5px 14px', borderRadius: '6px', fontSize: '12px', background: isSaving ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))', border: isSaving ? '1px solid var(--border)' : '1px solid rgba(255,255,255,0.2)', color: 'white', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: '600', fontFamily: 'var(--font-body)', transition: 'all 0.3s ease', opacity: isSaving ? 0.6 : 1 }}
                            >{isSaving ? 'Saving…' : 'Save'}</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {recruiterScore != null && (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '6px 10px', borderRadius: '8px',
                              background: `${pctColor(recruiterScore)}12`,
                              border: `1px solid ${pctColor(recruiterScore)}30`,
                              width: 'fit-content',
                            }}>
                              <span style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-display)', color: pctColor(recruiterScore) }}>{recruiterScore}%</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>your score</span>
                            </div>
                          )}
                          <p style={{
                            fontSize: '13px',
                            color: recruiterRemark ? 'var(--text)' : 'var(--text-muted)',
                            margin: 0, lineHeight: '1.7',
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        
        /* Card styles with mouse-following glow */
        .card-gray {
          background: linear-gradient(145deg, var(--bg-surface) 0%, rgba(15,18,26,0.95) 100%);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          isolation: isolate;
        }
        
        .card-gray::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle 200px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 70%);
          opacity: 0;
          transition: opacity 0.25s ease;
          pointer-events: none;
          border-radius: inherit;
        }
        
        .card-gray:hover {
          border-color: rgba(255,255,255,0.15);
        }
        
        .card-gray:hover::before {
          opacity: 1;
        }
        
        /* Input styles */
        .input-gray {
          transition: all 0.3s ease;
        }
        
        .input-gray:focus {
          border-color: rgba(255,255,255,0.35);
          box-shadow: 0 0 0 3px rgba(255,255,255,0.04);
          background: rgba(25,30,42,0.95);
        }
        
        /* Candidate row hover effect */
        .candidate-row {
          transition: all 0.3s ease;
        }
        
        .candidate-row:hover {
          border-color: rgba(255,255,255,0.12);
        }
      `}</style>
    </div>
  )
}