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


function RecentAnalysisReport({ completedSessions, candidates }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  const pctColor = (pct) =>
    pct >= 70 ? '#10B981' : pct >= 45 ? '#F59E0B' : '#EF4444'

  useEffect(() => {
    if (completedSessions.length === 0) { setLoading(false); return }
    const latest = completedSessions[completedSessions.length - 1]
    const stored = localStorage.getItem(`interview_analysis_${latest.id}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      setQuestions(parsed.filter(q => q.userAnswer && q.userAnswer.trim() !== ''))
      setLoading(false)
      return
    }
    // fallback — fetch from backend
    api.get(`/interview/${latest.id}/questions`)
      .then(res => {
        const answered = (res.data || [])
          .filter(q => q.userAnswer && q.userAnswer.trim() !== '')
          .map(q => ({
            questionNumber: q.questionNumber,
            questionText: q.questiontext || q.questionText || 'Question unavailable',
            userAnswer: q.userAnswer,
            score: q.score,
            confidence: null,
          }))
        setQuestions(answered)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [completedSessions])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
      Loading...
    </div>
  )

  if (completedSessions.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
      No completed interviews yet.
    </div>
  )

  const latest = completedSessions[completedSessions.length - 1]
  const candidate = candidates.find(c => c.id === latest.user?.id)
  const avgConf = questions.filter(q => q.confidence).length > 0
    ? Math.round(questions.reduce((s, q) => s + (q.confidence || 0), 0) / questions.filter(q => q.confidence).length)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <p style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>Most recent interview</p>
          <h2 style={{ fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
            {candidate?.fullName || 'Unknown Candidate'}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
            {latest.jobRole?.replace(/_/g, ' ')} • {questions.length} answered
            {avgConf !== null && <span style={{ color: pctColor(avgConf), marginLeft: '12px' }}>Avg Confidence: {avgConf}%</span>}
          </p>
        </div>
      </div>

      {/* Questions */}
      {questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>No answered questions found.</div>
      ) : (
        questions.map((q, idx) => (
          <div key={idx} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', background: 'var(--surface2)', padding: '3px 10px', borderRadius: '6px' }}>
                Q{q.questionNumber}
              </span>
              {q.score != null && (
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: pctColor(q.score * 10), background: `${pctColor(q.score * 10)}15`, padding: '3px 10px', borderRadius: '6px' }}>
                  Score {q.score}/10
                </span>
              )}
            </div>

            {/* Question text */}
            <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: '1.6', marginBottom: '12px', paddingLeft: '10px', borderLeft: '3px solid #8B5CF6' }}>
              {q.questionText}
            </p>

            {/* Candidate answer */}
            <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
              <p style={{ fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '6px', textTransform: 'uppercase' }}>Candidate Answer</p>
              <p style={{ fontSize: '13px', color: 'var(--text)', margin: 0, lineHeight: '1.6' }}>{q.userAnswer}</p>
            </div>

            {/* Confidence bar */}
            {q.confidence != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', width: '80px' }}>Confidence</span>
                <div style={{ flex: 1, height: '6px', background: 'var(--surface2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${q.confidence}%`, background: pctColor(q.confidence), borderRadius: '3px', transition: 'width 0.3s ease' }} />
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: pctColor(q.confidence), width: '36px', textAlign: 'right' }}>{q.confidence}%</span>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

export default function RecruiterDashboard() {
  const { user, logout } = useAuth()

  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [selectedRole, setSelectedRole] = useState('JAVA_DEVELOPER')
  const [completedSessions, setCompletedSessions] = useState([])
  const [analysisReport, setAnalysisReport] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)

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

  const [activeTab, setActiveTab] = useState('live')

  const [rsCandidate, setRsCandidate] = useState(null)
  const [rsResumeFile, setRsResumeFile] = useState(null)
  const [rsResumeText, setRsResumeText] = useState('')
  const [rsMessages, setRsMessages] = useState([])
  const [rsGenerated, setRsGenerated] = useState(false)
  const rsConversationRef = useRef([])

  const [proctoringAlerts, setProctoringAlerts] = useState([])

  const stompClient = useRef(null)

  // Fetch candidates and completed sessions
  useEffect(() => {
    api.get('/users/all')
      .then((res) => {
        setCandidates(res.data.filter((u) => u.role === 'USER'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
    
    // Fetch completed sessions for report viewing
const fetchCompletedSessions = () => {
  api.get('/interview/all-sessions')
    .then((res) => {
      const completed = res.data.filter(s => s.status === 'COMPLETED')
      setCompletedSessions(completed)
    })
    .catch(console.error)
}

fetchCompletedSessions()
const refreshInterval = setInterval(fetchCompletedSessions, 10000)
return () => clearInterval(refreshInterval)
  }, [])

  // WebSocket for live feed
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

          setLiveFeed((prev) => {
            const existing = prev[key] || {}
            return {
              ...prev,
              [key]: {
                ...existing,
                questionText: data.questionText,
                currentAnswer: data.currentAnswer,
                status: data.status,
              },
            }
          })
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
      onStompError: (frame) => {
        console.error('Broker error:', frame)
        setWsConnected(false)
      },
    })

    client.activate()
    stompClient.current = client

    return () => {
      client.deactivate()
      setWsConnected(false)
    }
  }, [activeSessionId])

  // Load analysis report for a completed session
const loadAnalysisReport = async (sessionId, candidateName) => {
    const stored = localStorage.getItem(`interview_analysis_${sessionId}`)
    if (stored) {
      const allAnalysis = JSON.parse(stored)
      const answeredAnalysis = allAnalysis.filter(a => a.userAnswer && a.userAnswer.trim() !== "")
      setAnalysisReport({ data: answeredAnalysis, candidateName: candidateName, sessionId: sessionId })
      setShowReportModal(true)
      return
    }

    // fallback — no localStorage data, fetch from backend
    try {
      const res = await api.get(`/interview/${sessionId}/questions`)
      const questions = res.data || []
      const answeredOnly = questions
        .filter(q => q.userAnswer && q.userAnswer.trim() !== "")
        .map(q => ({
          questionNumber: q.questionNumber,
          questionText: q.questiontext || q.questionText || "Question text unavailable",
          userAnswer: q.userAnswer,
          score: q.score,
          confidence: null,
          authenticity: null,
          accuracy: null,
          suspicious: false,
          reason: "Analysis not available — interview was completed before analysis feature was enabled."
        }))
      setAnalysisReport({ data: answeredOnly, candidateName: candidateName, sessionId: sessionId })
      setShowReportModal(true)
    } catch (err) {
      alert('Could not load session data. Please try again.')
    }
  }

  const getEventIcon = (t) => ({ PASTE_DETECTED:'📋', RIGHT_CLICK:'🖱️', KEYBOARD_SHORTCUT:'⌨️', ALT_TAB_DETECTED:'🪟', WINDOW_BLUR:'👁️' }[t] || '⚠️')
  const formatEventType = (t) => ({ PASTE_DETECTED:'Paste Detected!', RIGHT_CLICK:'Right Click Attempted', KEYBOARD_SHORTCUT:'Keyboard Shortcut Blocked', ALT_TAB_DETECTED:'Alt+Tab Attempted', WINDOW_BLUR:'Window Switch Detected' }[t] || t)
  const getAlertDescription = (e) => {
    if (e.pastedText) return `Pasted: "${e.pastedText.substring(0, 100)}${e.pastedText.length > 100 ? '...' : ''}"`
    if (e.shortcutKey) return `Shortcut: ${e.shortcutKey} - ${e.details || 'Attempted blocked action'}`
    return e.details || 'Proctoring violation detected'
  }

  const handleRecruiterQuestion = () => {
    if (!recruiterQuestion.trim() || !activeSessionId) return
    if (!stompClient.current?.connected) { alert('WebSocket not connected yet.'); return }
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

  const handlePauseResume = () => {
    if (!stompClient.current?.connected || !activeSessionId || isStopped) return
    const action = isPaused ? 'RESUME' : 'PAUSE'
    stompClient.current.publish({ destination: '/app/pause', body: JSON.stringify({ sessionId: activeSessionId, action }) })
    setIsPaused(!isPaused)
  }

  const handleStop = () => {
    if (!stompClient.current?.connected || !activeSessionId) return
    if (!window.confirm('Are you sure you want to end this interview?')) return
    stompClient.current.publish({ destination: '/app/pause', body: JSON.stringify({ sessionId: activeSessionId, action: 'STOP' }) })
    setIsStopped(true)
    setIsPaused(true)
    setTimeout(() => {
      setActiveSessionId(null); setLiveFeed({}); setProctoringAlerts([])
      setIsPaused(false); setIsStopped(false); setWsConnected(false)
      setMessage('Interview ended. Full analysis report will be available in the Reports tab.')
      setMessageType('success')
      // Refresh completed sessions list
      api.get('/interview/all-sessions').then((res) => {
        const completed = res.data.filter(s => s.status === 'COMPLETED')
        setCompletedSessions(completed)
      })
    }, 2000)
  }

  const handleStart = () => {
    if (!selectedCandidate) { setMessage('Select a candidate first'); setMessageType('error'); return }
    setStarting(true); setMessage(''); setLiveFeed({}); setProctoringAlerts([])
    setIsPaused(false); setIsStopped(false); setWsConnected(false)
    api.post('/interview/start', { candidateId: selectedCandidate.id, jobRole: selectedRole })
      .then((res) => {
        setMessage(`Interview started for ${selectedCandidate.fullName} — Session #${res.data.id}`)
        setMessageType('success'); setActiveSessionId(res.data.id); setStarting(false)
      })
      .catch(() => { setMessage('Failed to start interview.'); setMessageType('error'); setStarting(false) })
  }

  // Live feed render analysis (placeholder only)
  const renderLiveAnalysis = (data) => {
    const score = data.score
    const scorePct = score != null ? Math.round((score / 10) * 100) : null
    const scoreColor = scorePct != null ? pctColor(scorePct) : 'var(--text-dim)'

    return (
      <div style={{
        marginTop: '12px', padding: '12px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid #8B5CF6',
        borderRadius: '8px',
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
          📊 Full analysis (Confidence, Authenticity, Accuracy) will be available as a report after interview completes
        </div>
      </div>
    )
  }

  // Full analysis report render for modal
  const renderFullAnalysisReport = () => {
    if (!analysisReport || !analysisReport.data) return null

    const reportData = analysisReport.data
    const candidateName = analysisReport.candidateName

    const avgConfidence = reportData.length > 0 
      ? Math.round(reportData.filter(a => a.confidence).reduce((s, a) => s + a.confidence, 0) / reportData.filter(a => a.confidence).length)
      : 0
    const avgAuthenticity = reportData.length > 0
      ? Math.round(reportData.filter(a => a.authenticity).reduce((s, a) => s + a.authenticity, 0) / reportData.filter(a => a.authenticity).length)
      : 0
    const avgAccuracy = reportData.length > 0
      ? Math.round(reportData.filter(a => a.accuracy).reduce((s, a) => s + a.accuracy, 0) / reportData.filter(a => a.accuracy).length)
      : 0
    const suspiciousCount = reportData.filter(a => a.suspicious).length

    return (
      <div style={modalStyles.overlay}>
        <div style={modalStyles.modal}>
          <div style={modalStyles.header}>
            <div>
              <h2 style={modalStyles.title}>Interview Analysis Report</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>
                Candidate: {candidateName} • Session #{analysisReport.sessionId}
              </p>
            </div>
            <button onClick={() => setShowReportModal(false)} style={modalStyles.closeBtn}>✕</button>
          </div>

          {/* Summary Stats */}
          <div style={modalStyles.summaryGrid}>
            <div style={modalStyles.summaryCard}>
              <div style={modalStyles.summaryLabel}>Answered Questions</div>
              <div style={{ ...modalStyles.summaryValue, color: '#60A5FA' }}>{reportData.length}</div>
            </div>
            <div style={modalStyles.summaryCard}>
              <div style={modalStyles.summaryLabel}>Avg Confidence</div>
              <div style={{ ...modalStyles.summaryValue, color: pctColor(avgConfidence) }}>{avgConfidence}%</div>
            </div>
            <div style={modalStyles.summaryCard}>
              <div style={modalStyles.summaryLabel}>Avg Authenticity</div>
              <div style={{ ...modalStyles.summaryValue, color: pctColor(avgAuthenticity) }}>{avgAuthenticity}%</div>
            </div>
            <div style={modalStyles.summaryCard}>
              <div style={modalStyles.summaryLabel}>Avg Accuracy</div>
              <div style={{ ...modalStyles.summaryValue, color: pctColor(avgAccuracy) }}>{avgAccuracy}%</div>
            </div>
            <div style={modalStyles.summaryCard}>
              <div style={modalStyles.summaryLabel}>Suspicious Answers</div>
              <div style={{ ...modalStyles.summaryValue, color: suspiciousCount > 0 ? '#EF4444' : '#10B981' }}>{suspiciousCount}</div>
            </div>
          </div>

          {/* Per Question Analysis - Now with FULL question text */}
          <div style={modalStyles.questionsList}>
            <h3 style={modalStyles.sectionTitle}>Per Question Analysis ({reportData.length} answered)</h3>
            {reportData.map((q, idx) => (
              <div key={idx} style={{
                ...modalStyles.questionItem,
                borderLeft: q.suspicious ? '4px solid #EF4444' : '4px solid #10B981'
              }}>
                <div style={modalStyles.questionHeader}>
                  <span style={modalStyles.questionNum}>Question {q.questionNumber}</span>
                  {q.suspicious && <span style={modalStyles.suspiciousBadge}>⚠️ Suspicious</span>}
                  {q.score && (
                    <span style={{ ...modalStyles.scoreBadge, background: pctColor(q.score * 10) }}>
                      Score: {q.score}/10
                    </span>
                  )}
                </div>
                
                {/* FULL QUESTION TEXT - Now displayed */}
                <p style={modalStyles.questionTextFull}>
                  <span style={{ color: '#8B5CF6' }}>Q:</span> {q.questionText}
                </p>
                
                {/* CANDIDATE ANSWER */}
                {q.userAnswer && (
                  <div style={modalStyles.answerSection}>
                    <p style={modalStyles.answerLabel}>Candidate's Answer:</p>
                    <p style={modalStyles.answerTextFull}>"{q.userAnswer}"</p>
                  </div>
                )}
                
                {/* ANALYSIS BARS */}
                <div style={modalStyles.barsContainer}>
                  <div style={modalStyles.barItem}>
                    <span style={modalStyles.barLabel}>Confidence</span>
                    <div style={modalStyles.barTrack}>
                      <div style={{ ...modalStyles.barFill, width: `${q.confidence || 0}%`, background: pctColor(q.confidence) }} />
                    </div>
                    <span style={modalStyles.barValue}>{q.confidence || 0}%</span>
                  </div>
                  <div style={modalStyles.barItem}>
                    <span style={modalStyles.barLabel}>Authenticity</span>
                    <div style={modalStyles.barTrack}>
                      <div style={{ ...modalStyles.barFill, width: `${q.authenticity || 0}%`, background: pctColor(q.authenticity) }} />
                    </div>
                    <span style={modalStyles.barValue}>{q.authenticity || 0}%</span>
                  </div>
                  <div style={modalStyles.barItem}>
                    <span style={modalStyles.barLabel}>Accuracy</span>
                    <div style={modalStyles.barTrack}>
                      <div style={{ ...modalStyles.barFill, width: `${q.accuracy || 0}%`, background: pctColor(q.accuracy) }} />
                    </div>
                    <span style={modalStyles.barValue}>{q.accuracy || 0}%</span>
                  </div>
                </div>
                
                {/* AI REASON */}
                {q.reason && (
                  <div style={modalStyles.reasonText}>
                    💬 {q.reason}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {reportData.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
              No answered questions found for this session.
            </div>
          )}
        </div>
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

        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
          {[{ id: 'live', label: 'Live Interview' }, { id: 'reports', label: 'Analysis Reports' }, { id: 'resume', label: 'Resume Screening' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #2563EB' : '2px solid transparent', color: activeTab === tab.id ? '#60A5FA' : 'var(--text-dim)', fontSize: '14px', fontWeight: activeTab === tab.id ? 700 : 400, cursor: 'pointer', marginBottom: '-1px', fontFamily: activeTab === tab.id ? 'var(--font-display)' : 'var(--font-body)', transition: 'all 0.15s ease' }}>{tab.label}</button>
          ))}
        </div>

        {/* LIVE INTERVIEW TAB */}
        {activeTab === 'live' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>01 — Select Candidate</p>
                {loading ? <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Loading candidates...</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {candidates.map((c) => (
                      <div key={c.id} onClick={() => setSelectedCandidate(c)} onMouseEnter={() => setHoveredCandidate(c.id)} onMouseLeave={() => setHoveredCandidate(null)}
                        style={{ padding: '14px 16px', borderRadius: 'var(--radius)', border: `1px solid ${selectedCandidate?.id === c.id ? '#2563EB60' : hoveredCandidate === c.id ? 'var(--border-bright)' : 'var(--border)'}`, background: selectedCandidate?.id === c.id ? '#2563EB10' : 'var(--surface2)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s ease' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white' }}>{c.fullName?.charAt(0).toUpperCase()}</div>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '14px' }}>{c.fullName}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{c.email}</p>
                          </div>
                        </div>
                        {selectedCandidate?.id === c.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: '24px' }}>
                <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>02 — Job Role</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {JOB_ROLES.map((r) => (
                    <button key={r} onClick={() => setSelectedRole(r)} style={{ padding: '12px 16px', borderRadius: 'var(--radius)', border: `1px solid ${selectedRole === r ? '#2563EB60' : 'var(--border)'}`, background: selectedRole === r ? '#2563EB10' : 'var(--surface2)', color: selectedRole === r ? '#60A5FA' : 'var(--text-dim)', fontWeight: selectedRole === r ? '600' : '400', fontSize: '14px', textAlign: 'left', transition: 'all 0.2s ease', cursor: 'pointer' }}>
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
                <button className="btn-primary" onClick={handleStart} disabled={starting || Boolean(activeSessionId)} style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
                  {starting ? 'Starting...' : activeSessionId ? 'Interview Running' : 'Launch Interview'}
                </button>
                {message && <p style={{ marginTop: '12px', fontSize: '13px', color: messageType === 'success' ? '#34D399' : '#F87171', fontFamily: 'var(--font-mono)' }}>{message}</p>}
              </div>

              {proctoringAlerts.length > 0 && (
                <div className="card" style={{ padding: '24px', background: '#1a0a0a', borderColor: '#7F1D1D' }}>
                  <p style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#EF4444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>🚨 Security Alerts ({proctoringAlerts.length})</p>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {proctoringAlerts.map((alert, idx) => (
                      <div key={idx} style={{ padding: '12px', background: '#1f0a0a', border: '1px solid #7F1D1D', borderRadius: '8px', borderLeft: `4px solid ${alert.eventType === 'PASTE_DETECTED' ? '#EF4444' : alert.eventType === 'ALT_TAB_DETECTED' ? '#F97316' : '#EC4899'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: '600', fontSize: '13px', color: '#EF4444' }}>{getEventIcon(alert.eventType)} {formatEventType(alert.eventType)}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#FCA5A5', margin: '4px 0' }}>{getAlertDescription(alert)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
                      <button onClick={handlePauseResume} disabled={isStopped || !wsConnected}
                        style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: (isStopped || !wsConnected) ? 'not-allowed' : 'pointer', border: isPaused ? '1px solid #10B98160' : '1px solid #F9731660', background: isPaused ? '#10B98115' : '#F9731615', color: isPaused ? '#10B981' : '#F97316', transition: 'all 0.2s ease', fontFamily: 'var(--font-mono)', opacity: (isStopped || !wsConnected) ? 0.4 : 1 }}>
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                      {!isStopped ? (
                        <button onClick={handleStop} style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '1px solid #EF444460', background: '#EF444415', color: '#EF4444', transition: 'all 0.2s ease', fontFamily: 'var(--font-mono)' }}>End Interview</button>
                      ) : (
                        <span style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid #EF444460', background: '#EF444415', color: '#EF4444', fontFamily: 'var(--font-mono)' }}>Stopped</span>
                      )}
                      <span className="badge badge-green" style={{ animation: 'pulse-glow 2s infinite' }}>Live #{activeSessionId}</span>
                    </>
                  )}
                </div>
              </div>

              {isStopped && activeSessionId && (
                <div style={{ padding: '10px 16px', background: '#EF444415', border: '1px solid #EF444440', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#EF4444', fontWeight: '600', margin: 0 }}>Interview Stopped</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', margin: 0 }}>Full analysis report will be available in the Reports tab.</p>
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
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No active session</p>
                  </div>
                ) : Object.keys(liveFeed).length === 0 ? (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{wsConnected ? 'Waiting for candidate...' : 'Setting up live feed...'}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto' }}>
                    {Object.entries(liveFeed)
                      .sort(([a], [b]) => { const an = isNaN(Number(a)) ? 9999 : Number(a); const bn = isNaN(Number(b)) ? 9999 : Number(b); return an - bn })
                      .map(([qNum, data]) => (
                        <div key={qNum} style={{ background: 'var(--surface2)', border: `1px solid ${data.status === 'SUBMITTED' ? '#10B98140' : '#F9731640'}`, borderRadius: 'var(--radius)', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>{qNum === 'R' ? 'Recruiter Q' : `Q${qNum}`}</span>
                            <span className={`badge ${data.status === 'SUBMITTED' ? 'badge-green' : 'badge-orange'}`}>{data.status === 'SUBMITTED' ? 'Submitted' : 'Typing'}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '10px' }}>{data.questionText}</p>
                          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text)', minHeight: '40px', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {data.currentAnswer || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                            {data.status === 'TYPING' && <span style={{ display: 'inline-block', width: '2px', height: '14px', background: 'var(--cyan)', marginLeft: '2px', animation: 'blink 1s infinite', verticalAlign: 'middle' }} />}
                          </div>
                          {data.status === 'SUBMITTED' && renderLiveAnalysis(data)}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {activeSessionId && !isStopped && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {isPaused && <p style={{ fontSize: '12px', color: '#F97316', fontFamily: 'var(--font-mono)', margin: 0 }}>Paused — candidate is waiting. Ask your question below.</p>}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input value={recruiterQuestion} onChange={(e) => setRecruiterQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleRecruiterQuestion() }}
                      placeholder={isPaused ? 'Ask your question now...' : 'Pause first, then ask a question...'}
                      disabled={!isPaused}
                      style={{ flex: 1, padding: '12px 14px', borderRadius: 'var(--radius)', border: `1px solid ${isPaused ? '#F9731660' : 'var(--border)'}`, background: 'var(--surface2)', color: 'var(--text)', fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', opacity: isPaused ? 1 : 0.5 }} />
                    <button onClick={handleRecruiterQuestion} disabled={!recruiterQuestion.trim() || !isPaused} className="btn-primary" style={{ padding: '12px 20px', fontSize: '14px', flexShrink: 0, opacity: !recruiterQuestion.trim() || !isPaused ? 0.5 : 1 }}>Ask</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ANALYSIS REPORTS TAB */}
{activeTab === 'reports' && (
  <RecentAnalysisReport
    completedSessions={completedSessions}
    candidates={candidates}
  />
)}

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

      {showReportModal && renderFullAnalysisReport()}

      <style>{`
        .badge-red { background: #EF444415; color: #EF4444; border: 1px solid #EF444460; border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: 600; font-family: monospace; }
      `}</style>
    </div>
  )
}

const modalStyles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px',
  },
  modal: {
    background: '#0D1117', borderRadius: '20px', maxWidth: '900px', width: '100%',
    maxHeight: '85vh', overflowY: 'auto', border: '1px solid #1E2D45',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 24px', borderBottom: '1px solid #1E2D45',
    position: 'sticky', top: 0, background: '#0D1117', zIndex: 10,
  },
  title: { fontSize: '20px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: 0 },
  closeBtn: { background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '24px', cursor: 'pointer', padding: '4px 8px', borderRadius: '8px' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', padding: '24px' },
  summaryCard: { background: '#161D2E', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #1E2D45' },
  summaryLabel: { fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '8px', textTransform: 'uppercase' },
  summaryValue: { fontSize: '28px', fontWeight: '800' },
  questionsList: { padding: '0 24px 24px 24px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', marginBottom: '16px', fontFamily: 'var(--font-display)' },
  questionItem: { background: '#0F1623', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid #1E2D45' },
  questionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' },
  questionNum: { background: '#1E2D45', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)' },
  suspiciousBadge: { fontSize: '11px', color: '#EF4444', fontFamily: 'var(--font-mono)', padding: '4px 8px', background: '#EF444415', borderRadius: '6px' },
  scoreBadge: { padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', fontFamily: 'var(--font-mono)', color: 'white' },
  questionTextFull: {
    fontSize: '14px',
    color: 'var(--text)',
    marginBottom: '16px',
    lineHeight: 1.6,
    background: '#080C14',
    padding: '12px',
    borderRadius: '8px',
    borderLeft: '3px solid #8B5CF6',
  },
  answerSection: { background: '#080C14', borderRadius: '8px', padding: '12px', marginBottom: '16px' },
  answerLabel: { fontSize: '10px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '6px', textTransform: 'uppercase' },
  answerTextFull: { fontSize: '13px', color: '#CBD5E1', margin: 0, lineHeight: 1.6 },
  barsContainer: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' },
  barItem: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)' },
  barLabel: { width: '90px', fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' },
  barTrack: { flex: 1, height: '6px', background: '#1E2D45', borderRadius: '3px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s ease' },
  barValue: { width: '40px', fontSize: '11px', fontWeight: '600', textAlign: 'right', fontFamily: 'var(--font-mono)' },
  reasonText: { marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #1E2D45', fontSize: '11px', color: '#A78BFA', fontFamily: 'var(--font-mono)', fontStyle: 'italic' },
}