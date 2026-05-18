import { useState, useEffect } from 'react'
import api from '../services/api'

const pctColor = (pct) =>
  pct >= 70 ? '#10B981' : pct >= 45 ? '#F59E0B' : '#EF4444'

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

export default function CandidatesTab({ candidates }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [questions, setQuestions] = useState([])
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [recruiterRemarks, setRecruiterRemarks] = useState({})
  const [editingRemark, setEditingRemark] = useState(null)
  const [remarkDraft, setRemarkDraft] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    api.get('/interview/all-sessions')
      .then((res) => {
        const completed = (res.data || [])
          .filter(s => s.status === 'COMPLETED')
          .sort((a, b) => b.id - a.id)
        setSessions(completed)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const saved = localStorage.getItem('recruiter_remarks')
    if (saved) {
      try { setRecruiterRemarks(JSON.parse(saved)) } catch {}
    }
  }, [])

  const saveRemark = (sessionId, text) => {
    const updated = { ...recruiterRemarks, [sessionId]: text }
    setRecruiterRemarks(updated)
    localStorage.setItem('recruiter_remarks', JSON.stringify(updated))
    setEditingRemark(null)
  }

  const openSession = async (session) => {
    if (selected?.id === session.id) {
      setSelected(null)
      setQuestions([])
      return
    }
    setSelected(session)
    setQuestionsLoading(true)
    setQuestions([])
    try {
      const stored = localStorage.getItem(`interview_analysis_${session.id}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setQuestions(parsed.filter(q => q.userAnswer && q.userAnswer.trim() !== ''))
        setQuestionsLoading(false)
        return
      }
      const res = await api.get(`/interview/${session.id}/questions`)
      setQuestions(
        (res.data || [])
          .filter(q => q.userAnswer && q.userAnswer.trim() !== '')
          .map(q => ({
            ...q,
            questionText: q.questiontext || q.questionText || 'Question unavailable',
          }))
      )
    } catch {
      setQuestions([])
    } finally {
      setQuestionsLoading(false)
    }
  }

  // Build one row per completed session
  const rows = sessions.map(s => {
    const candidate = candidates.find(c => c.id === s.user?.id)
    const name = candidate?.fullName || s.user?.fullName || s.user?.email || `User #${s.user?.id}`
    const scorePct = s.totalQuestions > 0
      ? Math.round((s.totalScore / (s.totalQuestions * 10)) * 100)
      : null
    const status = statusInfo(scorePct)

    // Build AI remark from localStorage analysis
    const aiRemark = (() => {
      const stored = localStorage.getItem(`interview_analysis_${s.id}`)
      if (!stored) return null
      try {
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
      } catch { return null }
    })()

    return { session: s, name, scorePct, status, aiRemark }
  })

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch =
      r.name.toLowerCase().includes(q) ||
      String(r.session.id).includes(q) ||
      (r.session.jobRole || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'ALL' || r.status.label === filterStatus
    return matchSearch && matchStatus
  })

  const statusCounts = {
    ALL: rows.length,
    SELECTED: rows.filter(r => r.status.label === 'SELECTED').length,
    'ON HOLD': rows.filter(r => r.status.label === 'ON HOLD').length,
    'NOT SELECTED': rows.filter(r => r.status.label === 'NOT SELECTED').length,
    PENDING: rows.filter(r => r.status.label === 'PENDING').length,
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
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

      {/* ─── Search + Filter ─── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '13px',
            color: 'var(--text-dim)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search by name, role or session ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 34px 10px 34px',
              borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              background: 'var(--surface2)', color: 'var(--text)',
              fontSize: '13px', fontFamily: 'var(--font-mono)', outline: 'none',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#2563EB'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: '10px', top: '50%',
                transform: 'translateY(-50%)', background: 'none',
                border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '13px',
              }}
            >✕</button>
          )}
        </div>

        {/* Status pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'SELECTED', 'ON HOLD', 'NOT SELECTED', 'PENDING'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '11px',
                fontFamily: 'var(--font-mono)', fontWeight: '600', cursor: 'pointer',
                border: `1px solid ${filterStatus === s ? '#2563EB' : 'var(--border)'}`,
                background: filterStatus === s ? '#2563EB20' : 'var(--surface2)',
                color: filterStatus === s ? '#60A5FA' : 'var(--text-dim)',
                transition: 'all 0.15s',
              }}
            >
              {s} <span style={{ opacity: 0.6 }}>({statusCounts[s]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Table Header ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.2fr 90px 120px 60px',
        gap: '12px', padding: '8px 20px',
        fontSize: '10px', fontFamily: 'var(--font-mono)',
        color: 'var(--text-dim)', letterSpacing: '0.08em',
        textTransform: 'uppercase', borderBottom: '1px solid var(--border)',
      }}>
        <span>Candidate</span>
        <span>Role</span>
        <span style={{ textAlign: 'center' }}>Score</span>
        <span style={{ textAlign: 'center' }}>Status</span>
        <span />
      </div>

      {/* ─── Rows ─── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
          No candidates match your filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(({ session, name, scorePct, status, aiRemark }) => {
            const isOpen = selected?.id === session.id
            const recruiterRemark = recruiterRemarks[session.id] || ''

            return (
              <div
                key={session.id}
                style={{
                  border: `1px solid ${isOpen ? '#2563EB60' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  background: isOpen ? '#2563EB08' : 'var(--surface)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
              >
                {/* ── Collapsed row ── */}
                <div
                  onClick={() => openSession(session)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 90px 120px 60px',
                    gap: '12px', padding: '16px 20px',
                    alignItems: 'center', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.parentElement.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.parentElement.style.background = 'var(--surface)' }}
                >
                  {/* Avatar + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '13px', color: 'white',
                    }}>
                      {initials(name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px', fontWeight: '600', color: 'var(--text)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                        Session #{session.id}
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{
                    fontSize: '12px', fontFamily: 'var(--font-mono)',
                    color: 'var(--text-dim)', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {session.jobRole?.replace(/_/g, ' ') || '—'}
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'center' }}>
                    {scorePct !== null ? (
                      <>
                        <div style={{
                          fontSize: '20px', fontWeight: '800',
                          fontFamily: 'var(--font-display)', color: pctColor(scorePct),
                        }}>
                          {scorePct}%
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {session.totalScore}/{session.totalQuestions * 10}
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>—</span>
                    )}
                  </div>

                  {/* Status badge */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 10px',
                      borderRadius: '20px', fontSize: '10px',
                      fontWeight: '700', fontFamily: 'var(--font-mono)',
                      background: status.bg, color: status.color,
                      border: `1px solid ${status.border}`,
                      letterSpacing: '0.05em',
                    }}>
                      {status.label}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div style={{
                    textAlign: 'center', color: 'var(--text-dim)', fontSize: '14px',
                    transition: 'transform 0.25s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                  }}>
                    ▾
                  </div>
                </div>

                {/* ── Expanded detail panel ── */}
                {isOpen && (
                  <div style={{
                    borderTop: '1px solid var(--border)',
                    padding: '24px',
                    display: 'flex', flexDirection: 'column', gap: '20px',
                    animation: 'fadeIn 0.2s ease',
                  }}>

                    {/* ── Remarks row ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                      {/* AI Remark */}
                      <div style={{
                        padding: '16px', borderRadius: 'var(--radius)',
                        background: '#1e293b', border: '1px solid #334155',
                        borderLeft: '3px solid #8B5CF6',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '15px' }}>🤖</span>
                          <span style={{
                            fontSize: '10px', fontFamily: 'var(--font-mono)',
                            color: '#A78BFA', letterSpacing: '0.08em',
                            textTransform: 'uppercase', fontWeight: '600',
                          }}>
                            AI Remark
                          </span>
                        </div>
                        <p style={{
                          fontSize: '13px', color: '#CBD5E1',
                          margin: 0, lineHeight: '1.7',
                          fontStyle: aiRemark ? 'normal' : 'italic',
                        }}>
                          {aiRemark || 'Full Groq analysis is available when the candidate finishes via the Finish button.'}
                        </p>
                      </div>

                      {/* Recruiter Remark */}
                      <div style={{
                        padding: '16px', borderRadius: 'var(--radius)',
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        borderLeft: '3px solid #2563EB',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px' }}>✍️</span>
                            <span style={{
                              fontSize: '10px', fontFamily: 'var(--font-mono)',
                              color: '#60A5FA', letterSpacing: '0.08em',
                              textTransform: 'uppercase', fontWeight: '600',
                            }}>
                              Your Remark
                            </span>
                          </div>
                          {editingRemark !== session.id && (
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                setEditingRemark(session.id)
                                setRemarkDraft(recruiterRemark)
                              }}
                              style={{
                                padding: '3px 10px', borderRadius: '6px', fontSize: '11px',
                                fontFamily: 'var(--font-mono)', cursor: 'pointer',
                                background: '#2563EB20', border: '1px solid #2563EB60',
                                color: '#60A5FA', fontWeight: '600',
                              }}
                            >
                              {recruiterRemark ? 'Edit' : '+ Add'}
                            </button>
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
                              style={{
                                width: '100%', padding: '10px', borderRadius: '8px',
                                border: '1px solid #2563EB60', background: 'var(--surface)',
                                color: 'var(--text)', fontSize: '13px',
                                fontFamily: 'var(--font-body)', outline: 'none',
                                resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.6',
                              }}
                            />
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={e => { e.stopPropagation(); setEditingRemark(null) }}
                                style={{
                                  padding: '5px 14px', borderRadius: '6px', fontSize: '12px',
                                  background: 'transparent', border: '1px solid var(--border)',
                                  color: 'var(--text-dim)', cursor: 'pointer',
                                  fontFamily: 'var(--font-body)',
                                }}
                              >Cancel</button>
                              <button
                                onClick={e => { e.stopPropagation(); saveRemark(session.id, remarkDraft) }}
                                style={{
                                  padding: '5px 14px', borderRadius: '6px', fontSize: '12px',
                                  background: '#2563EB', border: 'none',
                                  color: 'white', cursor: 'pointer',
                                  fontWeight: '600', fontFamily: 'var(--font-body)',
                                }}
                              >Save</button>
                            </div>
                          </div>
                        ) : (
                          <p style={{
                            fontSize: '13px',
                            color: recruiterRemark ? 'var(--text)' : 'var(--text-muted)',
                            margin: 0, lineHeight: '1.7',
                            fontStyle: recruiterRemark ? 'normal' : 'italic',
                          }}>
                            {recruiterRemark || 'No remark added yet. Click "+ Add" to write one.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ── Questions list ── */}
                    <div>
                      <p style={{
                        fontSize: '11px', fontFamily: 'var(--font-mono)',
                        color: 'var(--text-dim)', letterSpacing: '0.08em',
                        textTransform: 'uppercase', marginBottom: '12px',
                      }}>
                        Interview Questions & Answers
                      </p>

                      {questionsLoading ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                          Loading questions...
                        </div>
                      ) : questions.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
                          No answered questions found.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
                          {questions.map((q, idx) => {
                            const isRecruiter = Number(q.questionNumber) === 999
                            return (
                              <div
                                key={idx}
                                style={{
                                  padding: '16px', borderRadius: 'var(--radius)',
                                  background: 'var(--surface2)',
                                  border: `1px solid ${isRecruiter ? '#F9731640' : 'var(--border)'}`,
                                  borderLeft: `3px solid ${isRecruiter ? '#F97316' : '#2563EB'}`,
                                }}
                              >
                                {/* Q header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                  <span style={{
                                    fontSize: '10px', fontFamily: 'var(--font-mono)',
                                    padding: '2px 8px', borderRadius: '5px',
                                    background: isRecruiter ? '#F9731620' : 'var(--surface)',
                                    color: isRecruiter ? '#F97316' : 'var(--text-dim)',
                                  }}>
                                    {isRecruiter ? 'RECRUITER Q' : `Q${idx + 1}`}
                                  </span>
                                  {q.score != null && (
                                    <span style={{
                                      fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700',
                                      color: pctColor(q.score * 10),
                                      background: `${pctColor(q.score * 10)}15`,
                                      padding: '3px 10px', borderRadius: '6px',
                                    }}>
                                      {q.score}/10
                                    </span>
                                  )}
                                </div>

                                {/* Question text */}
                                <p style={{
                                  fontSize: '13px', color: 'var(--text)', lineHeight: '1.6',
                                  marginBottom: '10px', paddingLeft: '10px',
                                  borderLeft: `2px solid ${isRecruiter ? '#F97316' : '#2563EB'}`,
                                }}>
                                  {q.questionText}
                                </p>

                                {/* Answer */}
                                {q.userAnswer && (
                                  <div style={{ background: 'var(--surface)', borderRadius: '8px', padding: '10px 14px', marginBottom: '8px' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '4px', textTransform: 'uppercase' }}>Answer</p>
                                    <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{q.userAnswer}</p>
                                  </div>
                                )}

                                {/* AI Feedback */}
                                {q.aiFeedback && (
                                  <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px 14px' }}>
                                    <p style={{ fontSize: '10px', color: '#818cf8', fontFamily: 'var(--font-mono)', marginBottom: '4px', textTransform: 'uppercase' }}>AI Feedback</p>
                                    <p style={{ fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: '1.6' }}>{q.aiFeedback}</p>
                                  </div>
                                )}
                              </div>
                            )
                          })}
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
  )
}
