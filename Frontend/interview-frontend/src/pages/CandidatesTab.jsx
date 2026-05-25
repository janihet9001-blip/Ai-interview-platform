import { useMemo, useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

function getToken() {
  return sessionStorage.getItem('token')
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  })
  if (res.status === 204) return null
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

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

const getAiRemark = (sessionId) => {
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
  } catch { return null }
}

export default function CandidatesTab({ candidates, sessions = [], loading = false }) {
  const [openId, setOpenId] = useState(null)
  // Map of sessionId -> { recruiterScore, remark, status } — sourced from DB
  const [dbRemarks, setDbRemarks] = useState({})
  const [editingRemark, setEditingRemark] = useState(null)
  const [remarkDraft, setRemarkDraft] = useState('')
  const [scoreDraft, setScoreDraft] = useState('')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [savingId, setSavingId] = useState(null)

  // Load all recruiter remarks from DB on mount
  useEffect(() => {
    apiFetch('/recruiter/remarks/all')
      .then((data) => {
        if (!data) return
        const map = {}
        data.forEach((r) => {
          map[r.sessionId] = {
            recruiterScore: r.recruiterScore ?? null,
            remark: r.remark ?? '',
            status: r.status ?? 'PENDING',
          }
        })
        setDbRemarks(map)
      })
      .catch(console.error)
  }, [])

  const saveRemark = async (sessionId, text, score) => {
    const parsed = score !== '' ? parseInt(score) : null
    const scoreToSave = !isNaN(parsed) && parsed != null && parsed >= 0 && parsed <= 100 ? parsed : null

    setSavingId(sessionId)
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
      setDbRemarks((prev) => ({
        ...prev,
        [sessionId]: {
          recruiterScore: saved.recruiterScore ?? null,
          remark: saved.remark ?? '',
          status: saved.status ?? 'PENDING',
        },
      }))
    } catch (e) {
      console.error('Failed to save remark:', e)
      alert('Failed to save. Please try again.')
    } finally {
      setSavingId(null)
    }
    setEditingRemark(null)
    setScoreDraft('')
  }

  const rows = useMemo(() => sessions.map(s => {
const candidate = candidates.find(c => c.id === (s.userId || s.user?.id))
const name = candidate?.fullName || s.userName || s.user?.fullName || s.user?.email || `User #${s.userId || s.user?.id}`
    const aiScorePct = s.totalQuestions > 0
      ? Math.round((s.totalScore / (s.totalQuestions * 10)) * 100)
      : null
    const aiRemark = getAiRemark(s.id)
    return { session: s, name, aiScorePct, aiRemark }
  }), [sessions, candidates])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
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

      {/* Search + Filter */}
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
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: '10px', top: '50%',
              transform: 'translateY(-50%)', background: 'none',
              border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '13px',
            }}>✕</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', 'SELECTED', 'ON HOLD', 'NOT SELECTED', 'PENDING'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{
              padding: '6px 14px', borderRadius: '20px', fontSize: '11px',
              fontFamily: 'var(--font-mono)', fontWeight: '600', cursor: 'pointer',
              border: `1px solid ${filterStatus === s ? '#2563EB' : 'var(--border)'}`,
              background: filterStatus === s ? '#2563EB20' : 'var(--surface2)',
              color: filterStatus === s ? '#60A5FA' : 'var(--text-dim)',
              transition: 'all 0.15s',
            }}>
              {s} <span style={{ opacity: 0.6 }}>({statusCounts[s] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1.2fr 200px 130px 60px',
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
          {filtered.map(({ session, name, aiScorePct, aiRemark }) => {
            const isOpen = openId === session.id
            const dbRemark = dbRemarks[session.id] || {}
            const recruiterRemark = dbRemark.remark || ''
            const recruiterScore = dbRemark.recruiterScore ?? null
            // Status based on recruiter score ONLY
            const status = statusInfo(recruiterScore)
            const isSaving = savingId === session.id

            return (
              <div key={session.id} style={{
                border: `1px solid ${isOpen ? '#2563EB60' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                background: isOpen ? '#2563EB08' : 'var(--surface)',
                overflow: 'hidden', transition: 'border-color 0.15s, background 0.15s',
              }}>

                {/* Collapsed row */}
                <div
                  onClick={() => setOpenId(isOpen ? null : session.id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 200px 130px 60px',
                    gap: '12px', padding: '16px 20px',
                    alignItems: 'center', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.parentElement.style.background = 'var(--surface2)' }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.parentElement.style.background = 'var(--surface)' }}
                >
                  {/* Candidate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '13px', color: 'white',
                    }}>{initials(name)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px', fontWeight: '600', color: 'var(--text)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{name}</div>
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
                  }}>{session.jobRole?.replace(/_/g, ' ') || '—'}</div>

                  {/* AI Score + Recruiter Score side by side */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    gap: '4px', alignItems: 'center',
                  }}>
                    {/* AI Score */}
                    <div style={{
                      textAlign: 'center',
                      padding: '6px 4px',
                      borderRadius: '8px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                    }}>
                      {aiScorePct !== null ? (
                        <>
                          <div style={{
                            fontSize: '18px', fontWeight: '800',
                            fontFamily: 'var(--font-display)',
                            color: pctColor(aiScorePct),
                          }}>{aiScorePct}%</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {session.totalScore}/{session.totalQuestions * 10}
                          </div>
                        </>
                      ) : (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>—</span>
                      )}
                    </div>

                    {/* Recruiter Score */}
                    <div style={{
                      textAlign: 'center',
                      padding: '6px 4px',
                      borderRadius: '8px',
                      background: recruiterScore != null ? `${pctColor(recruiterScore)}10` : 'var(--surface2)',
                      border: `1px solid ${recruiterScore != null ? `${pctColor(recruiterScore)}40` : 'var(--border)'}`,
                    }}>
                      {recruiterScore != null ? (
                        <>
                          <div style={{
                            fontSize: '18px', fontWeight: '800',
                            fontFamily: 'var(--font-display)',
                            color: pctColor(recruiterScore),
                          }}>{recruiterScore}%</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            recruiter
                          </div>
                        </>
                      ) : (
                        <span style={{
                          fontSize: '11px', color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)', display: 'block',
                          padding: '4px 0',
                        }}>+ score</span>
                      )}
                    </div>
                  </div>

                  {/* Status — recruiter score only */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block', padding: '4px 10px', borderRadius: '20px',
                      fontSize: '10px', fontWeight: '700', fontFamily: 'var(--font-mono)',
                      background: status.bg, color: status.color,
                      border: `1px solid ${status.border}`, letterSpacing: '0.05em',
                    }}>{status.label}</span>
                  </div>

                  {/* Chevron */}
                  <div style={{
                    textAlign: 'center', color: 'var(--text-dim)', fontSize: '14px',
                    transition: 'transform 0.2s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                  }}>▾</div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div style={{
                    borderTop: '1px solid var(--border)', padding: '20px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
                    animation: 'fadeIn 0.15s ease',
                  }}>
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
                        }}>AI Remark</span>
                      </div>
                      <p style={{
                        fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: '1.7',
                        fontStyle: aiRemark ? 'normal' : 'italic',
                      }}>
                        {aiRemark || 'Full Groq analysis available after candidate completes via Finish button.'}
                      </p>
                    </div>

                    {/* Recruiter Remark + Score */}
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
                          }}>Your Remark</span>
                        </div>
                        {editingRemark !== session.id && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              setEditingRemark(session.id)
                              setRemarkDraft(recruiterRemark)
                              setScoreDraft(recruiterScore != null ? String(recruiterScore) : '')
                            }}
                            style={{
                              padding: '3px 10px', borderRadius: '6px', fontSize: '11px',
                              fontFamily: 'var(--font-mono)', cursor: 'pointer',
                              background: '#2563EB20', border: '1px solid #2563EB60',
                              color: '#60A5FA', fontWeight: '600',
                            }}
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
                            style={{
                              width: '100%', padding: '10px', borderRadius: '8px',
                              border: '1px solid #2563EB60', background: 'var(--surface)',
                              color: 'var(--text)', fontSize: '13px',
                              fontFamily: 'var(--font-body)', outline: 'none',
                              resize: 'vertical', boxSizing: 'border-box', lineHeight: '1.6',
                            }}
                          />
                          {/* Score input */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{
                              fontSize: '11px', fontFamily: 'var(--font-mono)',
                              color: 'var(--text-dim)', whiteSpace: 'nowrap', flexShrink: 0,
                            }}>Your Score</label>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={scoreDraft}
                                onChange={e => {
                                  const v = e.target.value
                                  if (v === '' || (Number(v) >= 0 && Number(v) <= 100))
                                    setScoreDraft(v)
                                }}
                                placeholder="0–100"
                                style={{
                                  width: '100%', padding: '7px 30px 7px 10px',
                                  borderRadius: '8px', border: '1px solid #2563EB60',
                                  background: 'var(--surface)', color: 'var(--text)',
                                  fontSize: '13px', fontFamily: 'var(--font-mono)',
                                  outline: 'none', boxSizing: 'border-box',
                                }}
                                onClick={e => e.stopPropagation()}
                              />
                              <span style={{
                                position: 'absolute', right: '8px', top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '11px', color: 'var(--text-dim)',
                                fontFamily: 'var(--font-mono)', pointerEvents: 'none',
                              }}>%</span>
                            </div>
                            {scoreDraft !== '' && (
                              <span style={{
                                fontSize: '16px', fontWeight: '800',
                                fontFamily: 'var(--font-display)',
                                color: pctColor(Number(scoreDraft)),
                                minWidth: '44px', textAlign: 'center', flexShrink: 0,
                              }}>{scoreDraft}%</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={e => { e.stopPropagation(); setEditingRemark(null); setScoreDraft('') }}
                              style={{ padding: '5px 14px', borderRadius: '6px', fontSize: '12px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                            >Cancel</button>
                            <button
                              disabled={isSaving}
                              onClick={e => { e.stopPropagation(); saveRemark(session.id, remarkDraft, scoreDraft) }}
                              style={{ padding: '5px 14px', borderRadius: '6px', fontSize: '12px', background: isSaving ? 'var(--surface3)' : '#2563EB', border: 'none', color: 'white', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: '600', fontFamily: 'var(--font-body)' }}
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
                              <span style={{
                                fontSize: '20px', fontWeight: '800',
                                fontFamily: 'var(--font-display)',
                                color: pctColor(recruiterScore),
                              }}>{recruiterScore}%</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                your score
                              </span>
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
    </div>
  )
}