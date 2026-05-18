import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import ResumeScreeningTab from './ResumeScreeningTab'

const JOB_ROLES = [
  'JAVA_DEVELOPER',
  'PYTHON_DEVELOPER',
  'REACT_DEVELOPER',
]

const pctColor = (pct) =>
  pct >= 70 ? '#10B981' : pct >= 45 ? '#F59E0B' : '#EF4444'

export default function RecruiterDashboard() {
  const [sessionSearch, setSessionSearch] = useState('')
const [allCompletedSessions, setAllCompletedSessions] = useState([])
  const { user, logout } = useAuth()

  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [selectedRole, setSelectedRole] = useState('JAVA_DEVELOPER')

  const [completedSessions, setCompletedSessions] = useState([])
  const [analysisQuestions, setAnalysisQuestions] = useState({})
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [reportSessionId, setReportSessionId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  const [activeSessionId, setActiveSessionId] = useState(null)
  const [liveFeed, setLiveFeed] = useState({})
  const [hoveredCandidate, setHoveredCandidate] = useState(null)
  const [recruiterQuestion, setRecruiterQuestion] = useState('')
  const [isPaused, setIsPaused] = useState(false)
  const [isStopped, setIsStopped] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [activeTab, setActiveTab] = useState(() => {
  // Always start on live tab — never restore from storage
  sessionStorage.removeItem('activeTab')
  return 'live'
})
  const [proctoringAlerts, setProctoringAlerts] = useState([])

  const [rsCandidate, setRsCandidate] = useState(null)
  const [rsResumeFile, setRsResumeFile] = useState(null)
  const [rsResumeText, setRsResumeText] = useState('')
  const [rsMessages, setRsMessages] = useState([])
  const [rsGenerated, setRsGenerated] = useState(false)
  const rsConversationRef = useRef([])

  const stompClient = useRef(null)
  const pollingStoppedRef = useRef(false)

useEffect(() => {
  api.get('/users/all')
    .then((res) => {
      const filtered = res.data.filter((u) => u.role === 'USER')
      setCandidates(filtered)
      setLoading(false)

      // ✅ Restore selected candidate from sessionStorage
      const saved = sessionStorage.getItem('recruiter_selected_candidate')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const found = filtered.find(c => c.id === parsed.id)
          if (found) setSelectedCandidate(found)
        } catch {}
      }
    })
    .catch(() => setLoading(false))
}, [])

  useEffect(() => {
    fetchCompletedSessions()
  }, [])

  const fetchCompletedSessions = () => {
    if (pollingStoppedRef.current) return
    api.get('/interview/all-sessions')
      .then((res) => {
const completed = (res.data || [])
  .filter(s => s.status === 'COMPLETED')
  .sort((a, b) => b.id - a.id)
setAllCompletedSessions(completed)
setCompletedSessions(completed.slice(0, 10))
      })
      .catch((err) => {
        if (err?.response?.status === 403) {
          pollingStoppedRef.current = true
        }
        console.error('Failed to fetch sessions:', err)
      })
  }

  const loadAnalysisForSession = async (sessionId) => {
    if (!sessionId) return

    if (analysisQuestions[sessionId]) {
      setReportSessionId(sessionId)
      return
    }

    setAnalysisLoading(true)
    setReportSessionId(sessionId)

    const stored = localStorage.getItem(`interview_analysis_${sessionId}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const allParsed = parsed
          .filter(q => q.userAnswer && q.userAnswer.trim() !== '')
          .map(q => ({
            ...q,
            isRecruiterQuestion: Number(q.questionNumber) === 999
          }))
        setAnalysisQuestions(prev => ({ ...prev, [sessionId]: allParsed }))
        setAnalysisLoading(false)
        return
      } catch {
        // fall through to backend
      }
    }

    try {
      const res = await api.get(`/interview/${sessionId}/questions`)
      const allParsed = (res.data || [])
        .filter(q => q.userAnswer && q.userAnswer.trim() !== '')
        .map((q) => ({
          questionNumber: q.questionNumber,
          questionText: q.questiontext || q.questionText || 'Question unavailable',
          userAnswer: q.userAnswer,
          score: q.score,
          aiFeedback: q.aiFeedback || null,
          confidence: null,
          authenticity: null,
          accuracy: null,
          suspicious: false,
          reason: 'Full analysis only available when interview was completed via Finish button.',
          isRecruiterQuestion: Number(q.questionNumber) === 999,
        }))
      setAnalysisQuestions(prev => ({ ...prev, [sessionId]: allParsed }))
    } catch (err) {
      if (err?.response?.status === 403) {
        pollingStoppedRef.current = true
      }
      setAnalysisQuestions(prev => ({ ...prev, [sessionId]: [] }))
    } finally {
      setAnalysisLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'reports' && completedSessions.length > 0) {
      const latest = completedSessions[0]
      if (!reportSessionId) {
        loadAnalysisForSession(latest.id)
      }
    }
  }, [activeTab, completedSessions])

  useEffect(() => {
    if (!activeSessionId) return
    setWsConnected(false)

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 2000,
      onConnect: () => {
        setWsConnected(true)

        client.subscribe(`/topic/typing/${activeSessionId}`, (msg) => {
          const data = JSON.parse(msg.body)
          const key = data.questionNumber === 'R' ? 'R' : data.questionNumber
          setLiveFeed((prev) => ({
            ...prev,
            [key]: {
              ...(prev[key] || {}),
              questionText: data.questionText,
              currentAnswer: data.currentAnswer,
              status: data.status,
            },
          }))
        })

        client.subscribe(`/topic/feedback/${activeSessionId}`, (msg) => {
          const feedback = JSON.parse(msg.body)
          if (feedback.questionId == null) return
          setLiveFeed(prev => {
            const updated = { ...prev }
            Object.keys(updated).forEach(key => {
              if (
                updated[key].status === 'SUBMITTED' &&
                updated[key].score == null &&
                key !== 'R' &&
                String(key) === String(feedback.questionsAnswered)
              ) {
                updated[key] = { ...updated[key], score: feedback.score }
              }
            })
            return updated
          })
        })

        client.subscribe(`/topic/proctoring`, (msg) => {
          const event = JSON.parse(msg.body)
          if (String(event.sessionId) === String(activeSessionId)) {
            setProctoringAlerts((prev) => [event, ...prev].slice(0, 50))
          }
        })
      },
      onDisconnect: () => setWsConnected(false),
      onStompError: () => setWsConnected(false),
    })

    client.activate()
    stompClient.current = client
    return () => { client.deactivate(); setWsConnected(false) }
  }, [activeSessionId])

  const handleStart = () => {
    if (!selectedCandidate) {
      setMessage('Select a candidate first')
      setMessageType('error')
      return
    }
    setStarting(true)
    setMessage('')
    setLiveFeed({})
    setProctoringAlerts([])
    setIsPaused(false)
    setIsStopped(false)
    setWsConnected(false)

    api.post('/interview/start', {
      candidateId: selectedCandidate.id,
      jobRole: selectedRole,
    })
      .then((res) => {
        setMessage(`Interview started for ${selectedCandidate.fullName} — Session #${res.data.id}`)
        setMessageType('success')
        setActiveSessionId(res.data.id)
        setStarting(false)
      })
      .catch(() => {
        setMessage('Failed to start interview.')
        setMessageType('error')
        setStarting(false)
      })
  }

  const handlePauseResume = () => {
    if (!stompClient.current?.connected || !activeSessionId || isStopped) return
    const action = isPaused ? 'RESUME' : 'PAUSE'
    stompClient.current.publish({
      destination: '/app/pause',
      body: JSON.stringify({ sessionId: activeSessionId, action }),
    })
    setIsPaused(!isPaused)
  }

  const handleStop = () => {
    if (!stompClient.current?.connected || !activeSessionId) return
    if (!window.confirm('Are you sure you want to end this interview?')) return

    stompClient.current.publish({
      destination: '/app/pause',
      body: JSON.stringify({ sessionId: activeSessionId, action: 'STOP' }),
    })
    setIsStopped(true)
    setIsPaused(true)

    setTimeout(() => {
      const endedSessionId = activeSessionId
      setActiveSessionId(null)
      setLiveFeed({})
      setProctoringAlerts([])
      setIsPaused(false)
      setIsStopped(false)
      setWsConnected(false)
      setMessage('Interview ended. Report available in Analysis Reports tab.')
      setMessageType('success')

      pollingStoppedRef.current = false
      api.get('/interview/all-sessions')
        .then((res) => {
          const completed = (res.data || [])
            .filter(s => s.status === 'COMPLETED')
            .sort((a, b) => b.id - a.id)
          setCompletedSessions(completed)
          setAnalysisQuestions(prev => {
            const updated = { ...prev }
            delete updated[endedSessionId]
            return updated
          })
          setReportSessionId(null)
        })
        .catch(console.error)
    }, 2000)
  }

  const handleRecruiterQuestion = () => {
    if (!recruiterQuestion.trim() || !activeSessionId) return
    if (!stompClient.current?.connected) {
      alert('WebSocket not connected yet.')
      return
    }
    setLiveFeed((prev) => ({
      ...prev,
      R: { questionText: recruiterQuestion, currentAnswer: '', status: 'TYPING' },
    }))
    stompClient.current.publish({
      destination: '/app/recruiter-question',
      body: JSON.stringify({ sessionId: activeSessionId, question: recruiterQuestion }),
    })
    setRecruiterQuestion('')
  }

  const getEventIcon = (t) => ({
    PASTE_DETECTED: '📋',
    RIGHT_CLICK: '🖱️',
    KEYBOARD_SHORTCUT: '⌨️',
    ALT_TAB_DETECTED: '🪟',
    WINDOW_BLUR: '👁️',
  }[t] || '⚠️')

  const formatEventType = (t) => ({
    PASTE_DETECTED: 'Paste Detected!',
    RIGHT_CLICK: 'Right Click Attempted',
    KEYBOARD_SHORTCUT: 'Keyboard Shortcut Blocked',
    ALT_TAB_DETECTED: 'Alt+Tab Attempted',
    WINDOW_BLUR: 'Window Switch Detected',
  }[t] || t)

  const getAlertDescription = (e) => {
    if (e.pastedText) return `Pasted: "${e.pastedText.substring(0, 100)}${e.pastedText.length > 100 ? '...' : ''}"`
    if (e.shortcutKey) return `Shortcut: ${e.shortcutKey} - ${e.details || 'Attempted blocked action'}`
    return e.details || 'Proctoring violation detected'
  }

  const renderLiveAnalysis = (data) => {
    const score = data.score
    const scorePct = score != null ? Math.round((score / 10) * 100) : null
    const scoreColor = scorePct != null ? pctColor(scorePct) : 'var(--text-dim)'
    return (
      <div style={{
        marginTop: '12px', padding: '12px 14px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderLeft: '3px solid #8B5CF6', borderRadius: '8px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Response Analysis
          </span>
          {score != null && (
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: '4px', background: `${scoreColor}20`, color: scoreColor, fontWeight: '700' }}>
              Score {score}/10
            </span>
          )}
        </div>
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '11px', color: '#A78BFA', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
          📊 Full analysis available in Reports tab after interview ends
        </div>
      </div>
    )
  }

  const renderReportsTab = () => {
    if (completedSessions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
          No completed interviews yet.
        </div>
      )
    }

    const currentSession = reportSessionId
      ? completedSessions.find(s => s.id === reportSessionId)
      : completedSessions[0]

    if (!currentSession) return null

    // ALL questions — AI and recruiter together, no distinction
    const allQ = analysisQuestions[currentSession.id] || []

    // Only AI questions used for score calculation
    const aiQ = allQ.filter(q => !q.isRecruiterQuestion)

    const candidate = candidates.find(c => c.id === currentSession.user?.id)
    const candidateName = candidate?.fullName || currentSession.user?.fullName || currentSession.user?.email || 'Unknown'

    const hasGroqAnalysis = aiQ.some(q => q.confidence != null)

    const avgOf = (key) => {
      const withData = aiQ.filter(q => q[key] != null)
      if (withData.length === 0) return null
      return Math.round(withData.reduce((s, q) => s + q[key], 0) / withData.length)
    }

    const avgConfidence = avgOf('confidence')
    const avgAuthenticity = avgOf('authenticity')
    const avgAccuracy = avgOf('accuracy')
    const suspiciousCount = aiQ.filter(q => q.suspicious).length
    const totalScore = aiQ.reduce((s, q) => s + (q.score || 0), 0)
    const maxScore = aiQ.length * 10
    const scorePct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Search by candidate name */}
{completedSessions.length > 0 && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

    {/* Search input */}
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Search by candidate name or session ID..."
        value={sessionSearch}
        onChange={e => setSessionSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 14px 10px 36px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          background: 'var(--surface2)',
          color: 'var(--text)',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#2563EB'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
      {/* Search icon */}
      <span style={{
        position: 'absolute', left: '11px', top: '50%',
        transform: 'translateY(-50%)',
        fontSize: '14px', color: 'var(--text-dim)', pointerEvents: 'none',
      }}>🔍</span>
      {/* Clear button */}
      {sessionSearch && (
        <button
          onClick={() => setSessionSearch('')}
          style={{
            position: 'absolute', right: '10px', top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none',
            color: 'var(--text-dim)', cursor: 'pointer',
            fontSize: '14px', padding: '0',
          }}
        >✕</button>
      )}
    </div>

    {/* Filtered results */}
    {sessionSearch.trim() !== '' && (
      <div style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        maxHeight: '220px',
        overflowY: 'auto',
      }}>
        {(() => {
          const q = sessionSearch.toLowerCase().trim()
          const filtered = allCompletedSessions.filter(s => {
            const c = candidates.find(x => x.id === s.user?.id)
            const name = (c?.fullName || s.user?.fullName || s.user?.email || '').toLowerCase()
            return name.includes(q) || String(s.id).includes(q)
          })
          if (filtered.length === 0) return (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
              No sessions found for "{sessionSearch}"
            </div>
          )
          return filtered.map((s, idx) => {
            const c = candidates.find(x => x.id === s.user?.id)
            const cName = c?.fullName || s.user?.fullName || s.user?.email || `User #${s.user?.id}`
            const isSelected = s.id === currentSession?.id
            return (
              <div
                key={s.id}
                onClick={() => { loadAnalysisForSession(s.id); setSessionSearch('') }}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isSelected ? '#2563EB10' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--surface3)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '10px', fontFamily: 'var(--font-mono)',
                    background: isSelected ? '#2563EB30' : 'var(--surface)',
                    color: isSelected ? '#60A5FA' : 'var(--text-dim)',
                    padding: '2px 7px', borderRadius: '5px',
                  }}>#{s.id}</span>
                  <span style={{ fontSize: '13px', color: isSelected ? '#60A5FA' : 'var(--text)', fontWeight: isSelected ? '600' : '400' }}>
                    {cName}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {s.jobRole?.replace(/_/g, ' ')}
                  </span>
                  <span style={{
                    fontSize: '10px', fontFamily: 'var(--font-mono)',
                    color: s.totalScore > 0 ? '#10B981' : 'var(--text-dim)',
                  }}>
                    {s.totalQuestions > 0 ? `${Math.round((s.totalScore / (s.totalQuestions * 10)) * 100)}%` : '—'}
                  </span>
                </div>
              </div>
            )
          })
        })()}
      </div>
    )}

    {/* Current session label */}
    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
      Showing session #{currentSession?.id} —{' '}
      <span style={{ color: 'var(--text-dim)' }}>
        search above to find any session from all {allCompletedSessions.length} completed interviews
      </span>
    </div>

  </div>
)}

        {/* Header */}
        <div>
          <p style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
            Most recent interview
          </p>
          <h2 style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: '4px 0' }}>
            {candidateName}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', margin: 0 }}>
            {currentSession.jobRole?.replace(/_/g, ' ')} • Session #{currentSession.id} • {allQ.length} total questions
          </p>
        </div>

        {analysisLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            Loading analysis...
          </div>
        ) : allQ.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No answered questions found for this session.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '8px', textTransform: 'uppercase' }}>Questions</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#60A5FA' }}>{allQ.length}</div>
              </div>
              <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '8px', textTransform: 'uppercase' }}>Score</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: pctColor(scorePct) }}>{scorePct}%</div>
              </div>
              {hasGroqAnalysis && (
                <>
                  <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '8px', textTransform: 'uppercase' }}>Confidence</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: pctColor(avgConfidence) }}>{avgConfidence ?? '—'}%</div>
                  </div>
                  <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '8px', textTransform: 'uppercase' }}>Authenticity</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: pctColor(avgAuthenticity) }}>{avgAuthenticity ?? '—'}%</div>
                  </div>
                  <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '8px', textTransform: 'uppercase' }}>Accuracy</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: pctColor(avgAccuracy) }}>{avgAccuracy ?? '—'}%</div>
                  </div>
                  <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '8px', textTransform: 'uppercase' }}>Suspicious</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: suspiciousCount > 0 ? '#EF4444' : '#10B981' }}>{suspiciousCount}</div>
                  </div>
                </>
              )}
            </div>

            {/* All questions — AI and recruiter mixed, no distinction shown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {allQ.map((q, idx) => (
                <div key={idx} className="card" style={{
                  padding: '20px',
                  borderLeft: q.suspicious ? '4px solid #EF4444' : '4px solid #10B981',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'var(--surface2)', padding: '3px 10px', borderRadius: '6px' }}>
                      Q{idx + 1}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {q.suspicious && (
                        <span style={{ fontSize: '11px', color: '#EF4444', fontFamily: 'var(--font-mono)', padding: '3px 8px', background: '#EF444415', borderRadius: '6px' }}>
                          ⚠️ Suspicious
                        </span>
                      )}
                      {q.score != null && (
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: pctColor(q.score * 10), background: `${pctColor(q.score * 10)}15`, padding: '3px 10px', borderRadius: '6px' }}>
                          Score {q.score}/10
                        </span>
                      )}
                    </div>
                  </div>

                  <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.6', marginBottom: '12px', paddingLeft: '10px', borderLeft: '3px solid #2563EB' }}>
                    {q.questionText}
                  </p>

                  <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Candidate Answer
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {q.userAnswer}
                    </p>
                  </div>

                  {q.aiFeedback && (
                    <div style={{ background: '#1e293b', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '10px', color: '#818cf8', fontFamily: 'var(--font-mono)', marginBottom: '6px', textTransform: 'uppercase' }}>
                        AI Feedback
                      </p>
                      <p style={{ fontSize: '13px', color: '#cbd5e1', margin: 0, lineHeight: '1.6' }}>
                        {q.aiFeedback}
                      </p>
                    </div>
                  )}

                  {hasGroqAnalysis && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                      {[
                        { label: 'Confidence', value: q.confidence },
                        { label: 'Authenticity', value: q.authenticity },
                        { label: 'Accuracy', value: q.accuracy },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', width: '90px' }}>{label}</span>
                          <div style={{ flex: 1, height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${value || 0}%`, background: pctColor(value), borderRadius: '3px', transition: 'width 0.3s ease' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: pctColor(value), width: '36px', textAlign: 'right' }}>
                            {value ?? 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {q.reason && (
                    <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '11px', color: '#A78BFA', fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>
                      💬 {q.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'var(--font-body)' }}>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px', height: '64px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #2563EB, #06B6D4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '13px', color: 'white' }}>AI</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '17px' }}>InterviewAI</span>
          <span className="badge badge-orange" style={{ marginLeft: '8px' }}>Recruiter</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>{user?.fullName}</span>
          <button className="btn-ghost" onClick={logout} style={{ padding: '8px 18px', fontSize: '14px' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 32px' }}>

        <div style={{ marginBottom: '32px', animation: 'fadeUp 0.4s ease forwards' }}>
          <p style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--orange)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>Recruiter Portal</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: '800' }}>Interview Control Center</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
          {[
            { id: 'live', label: 'Live Interview' },
            { id: 'reports', label: 'Analysis Reports' },
            { id: 'resume', label: 'Resume Screening' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 20px', background: 'transparent', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #2563EB' : '2px solid transparent',
                color: activeTab === tab.id ? '#60A5FA' : '#334155',
                fontSize: '14px', fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: 'pointer', marginBottom: '-1px',
                fontFamily: activeTab === tab.id ? 'var(--font-display)' : 'var(--font-body)',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* LIVE INTERVIEW TAB */}
        {activeTab === 'live' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

<div className="card" style={{ padding: '24px' }}>
  <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
    01 — Select Candidate
  </p>
  {loading ? (
    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Loading candidates...</p>
  ) : (
    <div style={{ position: 'relative' }}>
      <select
        value={selectedCandidate?.id || ''}
        onChange={(e) => {
          const found = candidates.find(c => String(c.id) === e.target.value)
          setSelectedCandidate(found || null)
          if (found) {
            sessionStorage.setItem('recruiter_selected_candidate', JSON.stringify(found))
          } else {
            sessionStorage.removeItem('recruiter_selected_candidate')
          }
        }}
        style={{
          width: '100%',
          padding: '12px 40px 12px 14px',
          borderRadius: 'var(--radius)',
          border: `1px solid ${selectedCandidate ? '#2563EB60' : 'var(--border)'}`,
          background: 'var(--surface2)',
          color: selectedCandidate ? 'var(--text)' : 'var(--text-dim)',
          fontSize: '14px',
          fontFamily: 'var(--font-body)',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        <option value="">— Select a candidate —</option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id}>
            {c.fullName} ({c.email})
          </option>
        ))}
      </select>
      {/* Arrow icon */}
      <div style={{
        position: 'absolute', right: '12px', top: '50%',
        transform: 'translateY(-50%)', pointerEvents: 'none',
        color: 'var(--text-dim)',
      }}>
        ▾
      </div>
    </div>
  )}
</div>

              <div className="card" style={{ padding: '24px' }}>
                <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>02 — Job Role</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {JOB_ROLES.map((r) => (
                    <button key={r} onClick={() => setSelectedRole(r)} style={{
                      padding: '12px 16px', borderRadius: 'var(--radius)',
                      border: `1px solid ${selectedRole === r ? '#2563EB60' : 'var(--border)'}`,
                      background: selectedRole === r ? '#2563EB10' : 'var(--surface2)',
                      color: selectedRole === r ? '#60A5FA' : 'var(--text-dim)',
                      fontWeight: selectedRole === r ? '600' : '400',
                      fontSize: '14px', textAlign: 'left',
                      transition: 'all 0.2s ease', cursor: 'pointer',
                    }}>
                      {r.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card" style={{ padding: '24px' }}>
                <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>03 — Launch</p>
                {selectedCandidate && (
                  <div style={{ padding: '12px 16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '13px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {selectedCandidate.fullName} / {selectedRole.replace(/_/g, ' ')}
                  </div>
                )}
                <button
                  className="btn-primary"
                  onClick={handleStart}
                  disabled={starting || Boolean(activeSessionId)}
                  style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                >
                  {starting ? 'Starting...' : activeSessionId ? 'Interview Running' : 'Launch Interview'}
                </button>
                {message && (
                  <p style={{ marginTop: '12px', fontSize: '13px', color: messageType === 'success' ? '#34D399' : '#F87171', fontFamily: 'var(--font-mono)' }}>
                    {message}
                  </p>
                )}
              </div>

              {proctoringAlerts.length > 0 && (
                <div className="card" style={{ padding: '24px', background: '#1a0a0a', borderColor: '#7F1D1D' }}>
                  <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#EF4444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    🚨 Security Alerts ({proctoringAlerts.length})
                  </p>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {proctoringAlerts.map((alert, idx) => (
                      <div key={idx} style={{
                        padding: '12px', background: '#1f0a0a',
                        border: '1px solid #7F1D1D', borderRadius: '8px',
                        borderLeft: `4px solid ${alert.eventType === 'PASTE_DETECTED' ? '#EF4444' : alert.eventType === 'ALT_TAB_DETECTED' ? '#F97316' : '#EC4899'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '600', fontSize: '13px', color: '#EF4444' }}>
                            {getEventIcon(alert.eventType)} {formatEventType(alert.eventType)}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#FCA5A5', margin: '4px 0' }}>
                          {getAlertDescription(alert)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Live feed */}
            <div className="card" style={{ padding: '24px', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live Feed</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {activeSessionId && (
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: wsConnected ? '#10B981' : '#F97316', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: wsConnected ? '#10B981' : '#F97316', animation: wsConnected ? 'pulse-glow 2s infinite' : 'blink 1s infinite' }} />
                      {wsConnected ? 'WS Ready' : 'Connecting...'}
                    </span>
                  )}
                  {activeSessionId && (
                    <>
                      <button
                        onClick={handlePauseResume}
                        disabled={isStopped || !wsConnected}
                        style={{
                          padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                          cursor: (isStopped || !wsConnected) ? 'not-allowed' : 'pointer',
                          border: isPaused ? '1px solid #10B98160' : '1px solid #F9731660',
                          background: isPaused ? '#10B98115' : '#F9731615',
                          color: isPaused ? '#10B981' : '#F97316',
                          transition: 'all 0.2s ease', fontFamily: 'var(--font-mono)',
                          opacity: (isStopped || !wsConnected) ? 0.4 : 1,
                        }}
                      >
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                      {!isStopped ? (
                        <button onClick={handleStop} style={{
                          padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600',
                          cursor: 'pointer', border: '1px solid #EF444460',
                          background: '#EF444415', color: '#EF4444',
                          transition: 'all 0.2s ease', fontFamily: 'var(--font-mono)',
                        }}>
                          End Interview
                        </button>
                      ) : (
                        <span style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid #EF444460', background: '#EF444415', color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
                          Stopped
                        </span>
                      )}
                      <span className="badge badge-green" style={{ animation: 'pulse-glow 2s infinite' }}>
                        Live #{activeSessionId}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {isStopped && activeSessionId && (
                <div style={{ padding: '10px 16px', background: '#EF444415', border: '1px solid #EF444440', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#EF4444', fontWeight: '600', margin: 0 }}>Interview Stopped</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', margin: 0 }}>Full analysis report available in Reports tab.</p>
                </div>
              )}

              {activeSessionId && !wsConnected && !isStopped && (
                <div style={{ padding: '10px 16px', background: '#2563EB10', border: '1px solid #2563EB40', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '12px', color: '#60A5FA', fontFamily: 'var(--font-mono)', margin: 0 }}>Connecting to WebSocket...</p>
                </div>
              )}

              <div style={{ flex: 1 }}>
                {!activeSessionId ? (
                  <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', opacity: 0.4 }}>
                      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" color="#64748B">
                        <rect x="2" y="3" width="20" height="14" rx="2"/>
                        <path d="M8 21h8M12 17v4"/>
                      </svg>
                      <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>No active session</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Select a candidate to begin</span>
                    </div>
                  </div>
                ) : Object.keys(liveFeed).length === 0 ? (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{wsConnected ? 'Waiting for candidate...' : 'Setting up live feed...'}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                    {Object.entries(liveFeed)
                      .sort(([a], [b]) => {
                        const an = isNaN(Number(a)) ? 9999 : Number(a)
                        const bn = isNaN(Number(b)) ? 9999 : Number(b)
                        return an - bn
                      })
                      .map(([qNum, data]) => (
                        <div key={qNum} style={{
                          background: 'var(--surface2)',
                          border: `1px solid ${data.status === 'SUBMITTED' ? '#10B98140' : '#F9731640'}`,
                          borderRadius: 'var(--radius)', padding: '16px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
                              {qNum === 'R' ? 'Recruiter Q' : `Q${qNum}`}
                            </span>
                            <span className={`badge ${data.status === 'SUBMITTED' ? 'badge-green' : 'badge-orange'}`}>
                              {data.status === 'SUBMITTED' ? 'Submitted' : 'Typing'}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '10px' }}>{data.questionText}</p>
                          <div style={{
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: '8px', padding: '12px',
                            fontSize: '13px', fontFamily: 'var(--font-mono)',
                            color: 'var(--text)', minHeight: '40px',
                            whiteSpace: 'pre-wrap', lineHeight: '1.6',
                          }}>
                            {data.currentAnswer || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            {data.status === 'TYPING' && (
                              <span style={{ display: 'inline-block', width: '2px', height: '14px', background: 'var(--cyan)', marginLeft: '2px', animation: 'blink 1s infinite', verticalAlign: 'middle' }} />
                            )}
                          </div>
                          {data.status === 'SUBMITTED' && renderLiveAnalysis(data)}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {activeSessionId && !isStopped && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {isPaused && (
                    <p style={{ fontSize: '12px', color: '#F97316', fontFamily: 'var(--font-mono)', margin: 0 }}>
                      Paused — candidate is waiting. Ask your question below.
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      value={recruiterQuestion}
                      onChange={(e) => setRecruiterQuestion(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRecruiterQuestion() }}
                      placeholder={isPaused ? 'Ask your question now...' : 'Pause first, then ask a question...'}
                      disabled={!isPaused}
                      style={{
                        flex: 1, padding: '12px 14px', borderRadius: 'var(--radius)',
                        border: `1px solid ${isPaused ? '#F9731660' : 'var(--border)'}`,
                        background: 'var(--surface2)', color: 'var(--text)',
                        fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none',
                        opacity: isPaused ? 1 : 0.5,
                      }}
                    />
                    <button
                      onClick={handleRecruiterQuestion}
                      disabled={!recruiterQuestion.trim() || !isPaused}
                      className="btn-primary"
                      style={{ padding: '12px 20px', fontSize: '14px', flexShrink: 0, opacity: !recruiterQuestion.trim() || !isPaused ? 0.5 : 1 }}
                    >
                      Ask
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && renderReportsTab()}

        {activeTab === 'resume' && (
          <ResumeScreeningTab
            candidates={candidates}
            selectedCandidate={rsCandidate}
            setSelectedCandidate={setRsCandidate}
            resumeFile={rsResumeFile}
            setResumeFile={setRsResumeFile}
            resumeText={rsResumeText}
            setResumeText={setRsResumeText}
            messages={rsMessages}
            setMessages={setRsMessages}
            generated={rsGenerated}
            setGenerated={setRsGenerated}
            conversationRef={rsConversationRef}
          />
        )}
      </div>

      <style>{`
        .badge-red { background: #EF444415; color: #EF4444; border: 1px solid #EF444460; border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: 600; font-family: monospace; }
      `}</style>
    </div>
  )
}