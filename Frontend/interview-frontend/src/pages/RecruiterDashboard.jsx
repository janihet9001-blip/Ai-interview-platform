import AdminCameraView from '../components/AdminCameraView'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'
import ResumeScreeningTab from './ResumeScreeningTab'
import CandidatesTab from './CandidatesTab'
import PropTypes from 'prop-types'
import { useTheme } from '../context/ThemeContext'
import './RecruiterDashboard.css'

const JOB_ROLES = ['JAVA_DEVELOPER', 'PYTHON_DEVELOPER', 'REACT_DEVELOPER']

export default function RecruiterDashboard() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const pctColor = (pct) =>
    pct >= 70
      ? (theme === 'light' ? '#059669' : '#E5E7EB')
      : pct >= 45
        ? (theme === 'light' ? '#1E40AF' : '#D1D5DB')
        : (theme === 'light' ? '#DC2626' : '#9CA3AF')

  const [violationCount, setViolationCount] = useState(0)
  const [showEndPopup, setShowEndPopup] = useState(false)
  const [latestViolation, setLatestViolation] = useState(null)
  const [sessionSearch, setSessionSearch] = useState('')
  const [allCompletedSessions, setAllCompletedSessions] = useState([])
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
  const [recruiterQuestion, setRecruiterQuestion] = useState('')
  const [isPaused, setIsPaused] = useState(false)
  const [isStopped, setIsStopped] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [activeTab, setActiveTab] = useState('live')
  const [proctoringAlerts, setProctoringAlerts] = useState([])
  const [rsCandidate, setRsCandidate] = useState(null)
  const [rsResumeFile, setRsResumeFile] = useState(null)
  const [rsResumeText, setRsResumeText] = useState('')
  const [rsMessages, setRsMessages] = useState([])
  const [rsGenerated, setRsGenerated] = useState(false)
  const rsConversationRef = useRef([])
  const stompClient = useRef(null)
  const pollingStoppedRef = useRef(false)
  const mountedTabs = useRef(new Set(['live']))
  const intervalRef = useRef(null)

  const parseSession = (s) => ({
    id: s.id, jobRole: s.jobRole, totalScore: s.totalScore,
    totalQuestions: s.totalQuestions, status: s.status,
    startedAt: s.startedAt, completedAt: s.completedAt,
    userName: s.userName, userId: s.userId, actualQuestions: s.actualQuestions,
  })

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (stompClient.current) { try { stompClient.current.deactivate() } catch (e) {} stompClient.current = null }
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        const [usersRes, sessionsRes] = await Promise.all([api.get('/users/all'), api.get('/interview/all-sessions')])
        if (cancelled) return
        const filtered = (usersRes.data || []).filter(u => u.role === 'USER')
        setCandidates(filtered)
        const saved = sessionStorage.getItem('recruiter_selected_candidate')
        if (saved) { try { const parsed = JSON.parse(saved); const found = filtered.find(c => c.id === parsed.id); if (found) setSelectedCandidate(found) } catch {} }
        const completed = (sessionsRes.data || []).map(parseSession).filter(s => s.status === 'COMPLETED').sort((a, b) => b.id - a.id)
        setAllCompletedSessions(completed); setCompletedSessions(completed.slice(0, 10))
      } catch (err) { if (err?.response?.status === 403) pollingStoppedRef.current = true; console.error('Failed to load data:', err) }
      finally { if (!cancelled) setLoading(false) }
    }
    loadAll()
    return () => { cancelled = true }
  }, [])

  const fetchCompletedSessions = useCallback(() => {
    if (pollingStoppedRef.current) return
    api.get('/interview/all-sessions').then(res => {
      const completed = (res.data || []).map(parseSession).filter(s => s.status === 'COMPLETED').sort((a, b) => b.id - a.id)
      setAllCompletedSessions(completed); setCompletedSessions(completed.slice(0, 10))
    }).catch(err => { if (err?.response?.status === 403) pollingStoppedRef.current = true; console.error('Failed to fetch sessions:', err) })
  }, [])

  const loadAnalysisForSession = useCallback(async (sessionId) => {
    if (!sessionId) return
    if (analysisQuestions[sessionId]) { setReportSessionId(sessionId); return }
    setAnalysisLoading(true); setReportSessionId(sessionId)
    try {
      const res = await api.get(`/interview/${sessionId}/questions`)
      const allParsed = (res.data || []).filter(q => Number(q.questionNumber) === 999 || (q.userAnswer && q.userAnswer.trim() !== '')).map(q => ({
        questionNumber: q.questionNumber, questionText: q.questiontext || q.questionText || 'Question unavailable',
        userAnswer: q.userAnswer, score: q.score, aiFeedback: q.aiFeedback || null,
        confidence: null, authenticity: null, accuracy: null, suspicious: false,
        reason: 'Full analysis only available when interview was completed via Finish button.',
        isRecruiterQuestion: Number(q.questionNumber) === 999,
      }))
      setAnalysisQuestions(prev => ({ ...prev, [sessionId]: allParsed }))
    } catch (err) { if (err?.response?.status === 403) pollingStoppedRef.current = true; console.error('Failed to load analysis:', err); setAnalysisQuestions(prev => ({ ...prev, [sessionId]: [] })) }
    finally { setAnalysisLoading(false) }
  }, [analysisQuestions])

  const reportAutoLoadedRef = useRef(false)
  useEffect(() => {
    if (activeTab === 'reports' && completedSessions.length > 0 && !reportSessionId && !reportAutoLoadedRef.current) { reportAutoLoadedRef.current = true; loadAnalysisForSession(completedSessions[0].id) }
  }, [activeTab, completedSessions, reportSessionId, loadAnalysisForSession])
  useEffect(() => { reportAutoLoadedRef.current = false }, [completedSessions])

  useEffect(() => {
    if (!activeSessionId) return
    setWsConnected(false); let isSubscribed = true
    const client = new Client({
      webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL), reconnectDelay: 2000, heartbeatIncoming: 4000, heartbeatOutgoing: 4000,
      onConnect: () => {
        if (!isSubscribed) return; setWsConnected(true)
        client.subscribe(`/topic/typing/${activeSessionId}`, (msg) => { try { const data = JSON.parse(msg.body); const key = data.questionNumber === 'R' ? 'R' : data.questionNumber; setLiveFeed(prev => ({ ...prev, [key]: { ...(prev[key] || {}), questionText: data.questionText, currentAnswer: data.currentAnswer, status: data.status } })) } catch (err) { console.error('Failed to parse typing message:', err) } })
        client.subscribe(`/topic/feedback/${activeSessionId}`, (msg) => { try { const feedback = JSON.parse(msg.body); if (feedback.questionId == null) return; setLiveFeed(prev => { const updated = { ...prev }; Object.keys(updated).forEach(key => { if (updated[key].status === 'SUBMITTED' && updated[key].score == null && key !== 'R' && String(key) === String(feedback.questionsAnswered)) { updated[key] = { ...updated[key], score: feedback.score } } }); return updated }) } catch (err) { console.error('Failed to parse feedback message:', err) } })
        client.subscribe(`/topic/proctoring`, (msg) => { try { const event = JSON.parse(msg.body); if (String(event.sessionId) === String(activeSessionId)) { setProctoringAlerts(prev => [event, ...prev].slice(0, 50)); setViolationCount(prev => { const newCount = prev + 1; if (newCount === 1) stompClient.current?.publish({ destination: '/app/warning', body: JSON.stringify({ sessionId: activeSessionId, action: 'WARN' }) }); if (newCount >= 2) { setLatestViolation(event); setShowEndPopup(true) }; return newCount }) } } catch (err) { console.error('Failed to parse proctoring message:', err) } })
      },
      onDisconnect: () => { if (isSubscribed) setWsConnected(false) },
      onStompError: (frame) => { console.error('STOMP error:', frame); setWsConnected(false) },
      onWebSocketError: (event) => { console.error('WebSocket error:', event); setWsConnected(false) }
    })
    client.activate(); stompClient.current = client
    return () => { isSubscribed = false; if (stompClient.current) { try { stompClient.current.deactivate() } catch (e) {} stompClient.current = null }; setWsConnected(false) }
  }, [activeSessionId])

const handleStart = () => {
  if (!selectedCandidate) { setMessage('Select a candidate first'); setMessageType('error'); return }
  setStarting(true); setMessage(''); setLiveFeed({}); setProctoringAlerts([]);
  setIsPaused(false); setIsStopped(false); setWsConnected(false); setViolationCount(0)
  api.post('/interview/start', { candidateId: selectedCandidate.id, jobRole: selectedRole })
    .then(res => { setMessage(`Interview started for ${selectedCandidate.fullName} — Session #${res.data.id}`); setMessageType('success'); setActiveSessionId(res.data.id); setStarting(false) })
    .catch((err) => { console.error('Failed to start interview:', err); setMessage('Failed to start interview.'); setMessageType('error'); setStarting(false) })
}

  const handleEndForCheating = () => {
    if (!stompClient.current?.connected || !activeSessionId) return
    try { stompClient.current.publish({ destination: '/app/warning', body: JSON.stringify({ sessionId: activeSessionId, action: 'END_FOR_CHEATING' }) }); stompClient.current.publish({ destination: '/app/pause', body: JSON.stringify({ sessionId: activeSessionId, action: 'STOP' }) }); api.post(`/interview/${activeSessionId}/complete`).catch(() => {}) } catch (err) { console.error('Failed to end interview:', err) }
    setShowEndPopup(false); setViolationCount(0); setIsStopped(true); setIsPaused(true); setMessage('Interview terminated due to repeated violations.'); setMessageType('error')
    setTimeout(() => { setActiveSessionId(null); setLiveFeed({}); setProctoringAlerts([]); setIsPaused(false); setIsStopped(false); setWsConnected(false); setViolationCount(0); fetchCompletedSessions() }, 2000)
  }

  const handlePauseResume = () => {
    if (!stompClient.current?.connected || !activeSessionId || isStopped) return
    stompClient.current.publish({ destination: '/app/pause', body: JSON.stringify({ sessionId: activeSessionId, action: isPaused ? 'RESUME' : 'PAUSE' }) }); setIsPaused(!isPaused)
  }

  const handleStop = () => {
    if (!stompClient.current?.connected || !activeSessionId) return
    if (!window.confirm('Are you sure you want to end this interview?')) return
    try { stompClient.current.publish({ destination: '/app/pause', body: JSON.stringify({ sessionId: activeSessionId, action: 'STOP' }) }); api.post(`/interview/${activeSessionId}/complete`).catch(() => {}) } catch (err) { console.error('Failed to stop interview:', err) }
    setIsStopped(true); setIsPaused(true)
    setTimeout(() => { const endedSessionId = activeSessionId; setActiveSessionId(null); setLiveFeed({}); setProctoringAlerts([]); setIsPaused(false); setIsStopped(false); setWsConnected(false); setMessage('Interview ended. Report available in Analysis Reports tab.'); setMessageType('success'); pollingStoppedRef.current = false; fetchCompletedSessions(); localStorage.removeItem(`interview_analysis_${endedSessionId}`); setAnalysisQuestions(prev => { const u = { ...prev }; delete u[endedSessionId]; return u }); setReportSessionId(null); reportAutoLoadedRef.current = false }, 2000)
  }

  const handleRecruiterQuestion = () => {
    if (!recruiterQuestion.trim() || !activeSessionId) return
    if (!stompClient.current?.connected) { alert('WebSocket not connected yet.'); return }
    setLiveFeed(prev => ({ ...prev, R: { questionText: recruiterQuestion, currentAnswer: '', status: 'TYPING' } }))
    stompClient.current.publish({ destination: '/app/recruiter-question', body: JSON.stringify({ sessionId: activeSessionId, question: recruiterQuestion }) }); setRecruiterQuestion('')
  }

  const handleTabClick = (tabId) => { mountedTabs.current.add(tabId); setActiveTab(tabId) }
  const formatEventType = (t) => ({ PASTE_DETECTED: 'Paste Detected', RIGHT_CLICK: 'Right Click Attempted', KEYBOARD_SHORTCUT: 'Keyboard Shortcut Blocked', ALT_TAB_DETECTED: 'Alt+Tab Attempted', WINDOW_BLUR: 'Window Switch Detected' }[t] || t)
  const getAlertDescription = (e) => { if (e.pastedText) return `Pasted: "${e.pastedText.substring(0, 100)}${e.pastedText.length > 100 ? '...' : ''}"`; if (e.shortcutKey) return `Shortcut: ${e.shortcutKey} - ${e.details || 'Attempted blocked action'}`; return e.details || 'Proctoring violation detected' }

  const renderReportsTab = () => {
    const isLight = theme === 'light'
    const tx = isLight ? '#000000' : '#F3F4F6'
    const txDim = isLight ? '#1E293B' : '#D1D5DB'
    const txMuted = isLight ? '#374151' : '#9CA3AF'
    const txFaint = isLight ? '#4B5563' : '#6B7280'
    const bg2 = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)'
    const border1 = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.07)'
    const border2 = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)'
    const sessionListBg = isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.02)'
    const sessionListBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'
    const selectedBg = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'
    const selectedBorder = isLight ? '2px solid rgba(0,0,0,0.3)' : '2px solid rgba(255,255,255,0.4)'
    const hoverBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'
    const answerBg = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'
    const feedbackBg = isLight ? 'rgba(0,0,0,0.04)' : 'linear-gradient(135deg, rgba(229,231,235,0.07), rgba(229,231,235,0.02))'
    const feedbackBorder = isLight ? 'rgba(0,0,0,0.15)' : 'rgba(229,231,235,0.3)'
    const progressBg = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)'
    const reasonBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)'
    const inputBg = isLight ? '#FFFFFF' : 'rgba(15,18,26,0.9)'

    if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: txMuted, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>Loading...</div>
    if (completedSessions.length === 0) return <div style={{ textAlign: 'center', padding: '60px', color: txMuted }}>No completed interviews yet.</div>
    const currentSession = reportSessionId ? completedSessions.find(s => s.id === reportSessionId) || completedSessions[0] : completedSessions[0]
    if (!currentSession) return null
    const allQ = analysisQuestions[currentSession.id] || []
    const aiQ = allQ.filter(q => !q.isRecruiterQuestion)
    const candidate = candidates.find(c => c.id === currentSession.userId)
    const candidateName = candidate?.fullName || currentSession.userName || 'Unknown'
    const hasGroqAnalysis = aiQ.some(q => q.confidence != null)
    const avgOf = (key) => { const w = aiQ.filter(q => q[key] != null); if (!w.length) return null; return Math.round(w.reduce((s, q) => s + q[key], 0) / w.length) }
    const avgConfidence = avgOf('confidence'), avgAuthenticity = avgOf('authenticity')
    const suspiciousCount = aiQ.filter(q => q.suspicious).length
    const totalScore = aiQ.reduce((s, q) => s + (q.score || 0), 0), maxScore = aiQ.length * 10
    const scorePct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    return (
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input type="text" placeholder="Search sessions..." value={sessionSearch} onChange={e => setSessionSearch(e.target.value)}
              className="input-gray" style={{ width: '100%', boxSizing: 'border-box', fontSize: '12px', padding: '8px 12px 8px 32px', background: inputBg, color: tx }} />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: txFaint, pointerEvents: 'none' }}>/ /</span>
            {sessionSearch && <button onClick={() => setSessionSearch('')} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: txFaint, cursor: 'pointer', fontSize: '12px', padding: 0 }}>x</button>}
          </div>
          <div style={{ background: sessionListBg, border: `1px solid ${sessionListBorder}`, borderRadius: '10px', overflow: 'hidden', maxHeight: '600px', overflowY: 'auto' }}>
            {(() => {
              const q = sessionSearch.toLowerCase().trim()
              const list = q ? allCompletedSessions.filter(s => { const c = candidates.find(x => x.id === s.userId); const name = (c?.fullName || s.userName || '').toLowerCase(); return name.includes(q) || String(s.id).includes(q) }) : completedSessions
              if (!list.length) return <div style={{ padding: '20px', textAlign: 'center', color: txFaint, fontSize: '12px' }}>No sessions found</div>
              return list.map((s, idx) => {
                const c = candidates.find(x => x.id === s.userId); const cName = c?.fullName || s.userName || `User #${s.userId}`; const isSelected = s.id === currentSession?.id
                return (
                  <div key={s.id} onClick={() => { loadAnalysisForSession(s.id); setSessionSearch('') }}
                    style={{ padding: '10px 14px', borderBottom: idx < list.length - 1 ? `1px solid ${border2}` : 'none', background: isSelected ? selectedBg : 'transparent', cursor: 'pointer', transition: 'background 0.15s', borderLeft: isSelected ? selectedBorder : '2px solid transparent' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = hoverBg }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: isSelected ? '600' : '400', color: isSelected ? tx : txDim, margin: 0 }}>{cName}</p>
                        <p style={{ fontSize: '10px', color: txFaint, fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>#{s.id} · {s.jobRole?.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            })()}
          </div>
          <p style={{ fontSize: '10px', color: txFaint, fontFamily: 'var(--font-mono)', margin: 0 }}>{allCompletedSessions.length} total interviews</p>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: txFaint, margin: '0 0 4px' }}>Session #{currentSession.id} · {currentSession.jobRole?.replace(/_/g, ' ')}</p>
              <h2 style={{ fontSize: '22px', fontWeight: '700', fontFamily: 'var(--font-display)', margin: 0, color: tx, letterSpacing: '-0.02em' }}>{candidateName}</h2>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[{ label: 'Questions', val: allQ.length, raw: true }, { label: 'Score', val: scorePct, suffix: '%' }, ...(hasGroqAnalysis ? [{ label: 'Confidence', val: avgConfidence, suffix: '%' }, { label: 'Auth', val: avgAuthenticity, suffix: '%' }, { label: 'Suspicious', val: suspiciousCount, danger: suspiciousCount > 0, raw: true }] : [])].map(({ label, val, suffix, raw, danger }) => (
                <div key={label} style={{ textAlign: 'center', padding: '8px 14px', background: bg2, border: `1px solid ${border1}`, borderRadius: '8px', minWidth: '60px' }}>
                  <div style={{ fontSize: '9px', color: txFaint, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: danger ? '#F87171' : pctColor(raw ? 100 : val), fontFamily: 'var(--font-display)' }}>{raw ? val : (val != null ? `${val}${suffix || ''}` : '—')}</div>
                </div>
              ))}
            </div>
          </div>

          {analysisLoading
            ? <div style={{ textAlign: 'center', padding: '40px', color: txFaint, fontFamily: 'var(--font-mono)', fontSize: '13px' }}>Loading analysis...</div>
            : allQ.length === 0
              ? <div style={{ textAlign: 'center', padding: '40px', color: txFaint }}>No questions found for this session.</div>
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {allQ.map((q, idx) => (
                    <div key={idx} className="card-gray" style={{ padding: '18px', borderLeft: q.suspicious ? '3px solid #F87171' : q.isRecruiterQuestion ? '3px solid #D1D5DB' : `3px solid ${isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: q.isRecruiterQuestion ? (isLight ? '#374151' : '#D1D5DB') : txMuted, background: q.isRecruiterQuestion ? (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(209,213,219,0.1)') : bg2, padding: '2px 8px', borderRadius: '5px' }}>
                          {q.isRecruiterQuestion ? 'Recruiter Q' : `Q${idx + 1}`}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {q.suspicious && <span style={{ fontSize: '10px', color: '#F87171', fontFamily: 'var(--font-mono)', padding: '2px 8px', background: 'rgba(248,113,113,0.1)', borderRadius: '5px' }}>Suspicious</span>}
                          {q.score != null && <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: pctColor(q.score * 10) }}>Score {q.score}/10</span>}
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: txDim, lineHeight: '1.6', marginBottom: '10px', paddingLeft: '12px', borderLeft: `2px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}` }}>{q.questionText}</p>
                      <div style={{ background: answerBg, borderRadius: '6px', padding: '8px 12px', marginBottom: '10px' }}>
                        <p style={{ fontSize: '9px', color: txFaint, fontFamily: 'var(--font-mono)', marginBottom: '4px', textTransform: 'uppercase' }}>Answer</p>
                        <p style={{ fontSize: '12px', color: q.userAnswer?.trim() ? txDim : txFaint, margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap', fontStyle: q.userAnswer?.trim() ? 'normal' : 'italic' }}>{q.userAnswer?.trim() || '— No answer provided —'}</p>
                      </div>
                      {q.aiFeedback && (
                        <div style={{ background: feedbackBg, borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', borderLeft: `2px solid ${feedbackBorder}` }}>
                          <p style={{ fontSize: '9px', color: isLight ? '#374151' : '#E5E7EB', fontFamily: 'var(--font-mono)', marginBottom: '4px', textTransform: 'uppercase' }}>AI Feedback</p>
                          <p style={{ fontSize: '12px', color: txDim, margin: 0, lineHeight: '1.6' }}>{q.aiFeedback}</p>
                        </div>
                      )}
                      {hasGroqAnalysis && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                          {[{ label: 'Confidence', value: q.confidence }, { label: 'Authenticity', value: q.authenticity }, { label: 'Accuracy', value: q.accuracy }].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: txFaint, width: '90px' }}>{label}</span>
                              <div style={{ flex: 1, height: '5px', background: progressBg, borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${value || 0}%`, background: `linear-gradient(90deg, ${pctColor(value)}, ${isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)'})`, borderRadius: '3px', transition: 'width 0.6s ease' }} />
                              </div>
                              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', color: pctColor(value), width: '36px', textAlign: 'right' }}>{value ?? 0}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.reason && <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: `1px solid ${reasonBorder}`, fontSize: '11px', color: txMuted, fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>{q.reason}</div>}
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        :root, .dark {
          --bg-dark: #0A0C12;
          --bg-darker: #06080D;
          --bg-surface: #0F121A;
          --bg-surface-light: #151A24;
          --border: rgba(255,255,255,0.05);
          --border-light: rgba(255,255,255,0.08);
          --text: #E8EDF2;
          --text-dim: #8E9AA8;
          --text-muted: #4A5568;
          --font-mono: 'JetBrains Mono', monospace;
          --font-display: 'Inter', system-ui, sans-serif;
          --font-body: 'Inter', system-ui, sans-serif;
          --radius: 12px;
          --radius-sm: 8px;
          --radius-lg: 16px;
        }

        .light {
          --bg-dark: #F8FAFC;
          --bg-darker: #FFFFFF;
          --bg-surface: #FFFFFF;
          --bg-surface-light: #F1F5F9;
          --border: rgba(0,0,0,0.15);
          --border-light: rgba(0,0,0,0.2);
          --text: #000000;
          --text-dim: #0F172A;
          --text-muted: #1E293B;
          --font-mono: 'JetBrains Mono', monospace;
          --font-display: 'Inter', system-ui, sans-serif;
          --font-body: 'Inter', system-ui, sans-serif;
          --radius: 12px;
          --radius-sm: 8px;
          --radius-lg: 16px;
        }

        .light body, .light #root { background: #F8FAFC; color: #000000; }

        .light .scene-bg {
          background:
            radial-gradient(ellipse 60% 40% at 20% 10%, rgba(0,0,0,0.03) 0%, transparent 55%),
            radial-gradient(ellipse 50% 35% at 85% 80%, rgba(0,0,0,0.02) 0%, transparent 60%);
        }
        .light .top-nav { background: rgba(255,255,255,0.95); border-bottom: 1px solid rgba(0,0,0,0.1); }
        .light .card-gray { background: linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%); border-color: rgba(0,0,0,0.1); }
        .light .card-gray:hover { border-color: rgba(0,0,0,0.18); }
        .light .panel { background: linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%); border-color: rgba(0,0,0,0.1); }
        .light .panel:hover { border-color: rgba(0,0,0,0.18); }
        .light .panel-header { border-bottom: 1px solid rgba(0,0,0,0.08); }
        .light .panel-title { color: #334155; }
        .light .panel-step { background: rgba(0,0,0,0.06); color: #1E293B; }
        .light .tab-btn { color: #334155; }
        .light .tab-btn:hover { color: #000000; }
        .light .tab-btn.active { color: #000000; font-weight: 700; }
        .light .tab-btn::before, .light .tab-btn::after {
          background: linear-gradient(90deg, transparent, rgba(0,0,0,0.5), #000000, rgba(0,0,0,0.5), transparent);
        }
        .light .select-gray, .light .input-gray {
          background: #FFFFFF; border-color: rgba(0,0,0,0.12); color: #000000;
        }
        .light .select-gray:hover, .light .input-gray:hover { border-color: rgba(0,0,0,0.22); background: #F8FAFC; }
        .light .select-gray:focus, .light .input-gray:focus { border-color: rgba(0,0,0,0.35); background: #FFFFFF; box-shadow: 0 0 0 3px rgba(0,0,0,0.04); }
        .light .role-pill { background: #F1F5F9; border-color: rgba(0,0,0,0.12); color: #1E293B; }
        .light .role-pill:hover { background: rgba(0,0,0,0.06); color: #000000; border-color: rgba(0,0,0,0.25); }
        .light .role-pill.selected { background: rgba(0,0,0,0.1); border-color: rgba(0,0,0,0.3); color: #000000; }
        .light .btn-launch { background: rgba(0,0,0,0.07); border-color: rgba(0,0,0,0.15); color: #000000; }
        .light .btn-launch:hover:not(:disabled) { background: rgba(0,0,0,0.12); border-color: rgba(0,0,0,0.28); }
        .light .feed-item { background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.1); }
        .light .logo-text {
          background: linear-gradient(110deg, #000000 20%, #334155 50%, #000000 80%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .light .page-heading {
          background: linear-gradient(110deg, #000000 20%, #334155 50%, #000000 80%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .light .btn-ghost-gray { border-color: rgba(0,0,0,0.15); color: #1E293B; }
        .light .btn-ghost-gray:hover { border-color: rgba(0,0,0,0.3); color: #000000; background: rgba(0,0,0,0.05); }
        .light .badge-recruiter { background: rgba(0,0,0,0.05); color: #334155; border-color: rgba(0,0,0,0.12); }
        .light .selected-badge { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.1); }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, #root { background: linear-gradient(135deg, #0A0C12 0%, #06080D 100%); color: var(--text); font-family: var(--font-body); min-height: 100vh; }

        .scene-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none;
          background: radial-gradient(ellipse 60% 40% at 20% 10%, rgba(30,40,60,0.25) 0%, transparent 55%),
            radial-gradient(ellipse 50% 35% at 85% 80%, rgba(20,30,50,0.2) 0%, transparent 60%); }

        .card-gray {
          background: linear-gradient(145deg, var(--bg-surface) 0%, rgba(15,18,26,0.95) 100%);
          border: 1px solid var(--border); border-radius: var(--radius);
          position: relative; overflow: hidden; transition: all 0.3s ease; isolation: isolate;
        }
        .card-gray::before { content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle 200px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 70%);
          opacity: 0; transition: opacity 0.25s ease; pointer-events: none; border-radius: inherit; }
        .card-gray:hover { border-color: rgba(255,255,255,0.22); transform: translateY(-2px); }
        .card-gray:hover::before { opacity: 1; }

        .selected-badge { display: flex; align-items: center; gap: 8px; padding: 8px 12px;
          background: rgba(229,231,235,0.06); border: 1px solid rgba(229,231,235,0.12); border-radius: 30px; margin-top: 12px; }
        .selected-dot { width: 6px; height: 6px; background: #10B981; border-radius: 50%;
          box-shadow: 0 0 6px rgba(16,185,129,0.4); animation: pulse-glow 2s infinite; }

        .top-nav { display: flex; justify-content: space-between; align-items: center;
          padding: 0 36px; height: 64px; background: rgba(10,12,18,0.85);
          border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; backdrop-filter: blur(20px); }

        .tab-btn { padding: 10px 24px; background: transparent; border: none; color: #6B7280;
          font-size: 13px; font-weight: 500; letter-spacing: 0.02em; cursor: pointer;
          margin-bottom: -1px; font-family: var(--font-body); transition: color 0.2s ease; position: relative; }
        .tab-btn::before, .tab-btn::after { content: ''; position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), #FFFFFF, rgba(255,255,255,0.6), transparent);
          transform: scaleX(0); transition: transform 0.35s ease; }
        .tab-btn::before { top: 0; transform-origin: left; }
        .tab-btn::after { bottom: 0; transform-origin: right; }
        .tab-btn:hover::before, .tab-btn:hover::after { transform: scaleX(1); }
        .tab-btn:hover { color: #FFFFFF; }
        .tab-btn.active { color: #FFFFFF; font-weight: 700; }
        .tab-btn.active::before, .tab-btn.active::after { transform: scaleX(1); }

        .ctrl-btn { padding: 5px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
          cursor: pointer; font-family: var(--font-mono); transition: all 0.25s ease; }
        .ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .ctrl-btn-pause { border: 1px solid rgba(209,213,219,0.3); background: rgba(209,213,219,0.07); color: #D1D5DB; }
        .ctrl-btn-pause:hover:not(:disabled) { border-color: #D1D5DB; background: rgba(209,213,219,0.18); color: #FFFFFF; box-shadow: 0 0 12px rgba(209,213,219,0.15); }
        .ctrl-btn-resume { border: 1px solid rgba(229,231,235,0.3); background: rgba(229,231,235,0.07); color: #E5E7EB; }
        .ctrl-btn-resume:hover:not(:disabled) { border-color: #E5E7EB; background: rgba(229,231,235,0.18); color: #FFFFFF; }
        .ctrl-btn-stop { border: 1px solid rgba(248,113,113,0.35); background: rgba(248,113,113,0.09); color: #F87171; }
        .ctrl-btn-stop:hover:not(:disabled) { border-color: #F87171; background: rgba(248,113,113,0.2); color: #FFA3A3; box-shadow: 0 0 12px rgba(248,113,113,0.2); }

        .btn-primary-gray { background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04));
          color: #FFFFFF; border: 1px solid rgba(255,255,255,0.18); border-radius: 10px;
          font-weight: 600; cursor: pointer; font-family: var(--font-body); transition: all 0.3s ease;
          position: relative; overflow: hidden; }
        .btn-primary-gray:hover:not(:disabled) { background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.09)); border-color: rgba(255,255,255,0.4); transform: translateY(-2px); }
        .btn-primary-gray:disabled { opacity: 0.3; cursor: not-allowed; }

        .btn-ghost-gray { background: transparent; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; color: #9CA3AF; cursor: pointer; font-family: var(--font-body);
          font-size: 12px; transition: all 0.25s ease; }
        .btn-ghost-gray:hover { border-color: rgba(255,255,255,0.25); color: #E5E7EB; background: rgba(255,255,255,0.05); }

        .select-gray, .input-gray { border-radius: 10px; border: 1px solid var(--border);
          background: rgba(15,18,26,0.9); backdrop-filter: blur(8px); color: var(--text);
          font-size: 13px; font-family: var(--font-body); outline: none; transition: all 0.3s ease; }
        .select-gray { width: 100%; padding: 10px 36px 10px 14px; appearance: none; cursor: pointer; }
        .input-gray { flex: 1; padding: 10px 14px; }
        .select-gray:hover, .input-gray:hover { border-color: rgba(255,255,255,0.2); background: rgba(20,24,34,0.95); }
        .select-gray:focus, .input-gray:focus { border-color: rgba(255,255,255,0.38); box-shadow: 0 0 0 3px rgba(255,255,255,0.05); background: rgba(25,30,42,0.95); }

        .badge-gray { font-size: 9px; font-weight: 600; font-family: monospace; border-radius: 20px; padding: 2px 10px; letter-spacing: 0.06em; }
        .badge-live { background: rgba(229,231,235,0.1); color: #E5E7EB; border: 1px solid rgba(229,231,235,0.25); animation: pulse-glow 2s infinite; }
        .badge-recruiter { background: rgba(255,255,255,0.05); color: #9CA3AF; border: 1px solid rgba(255,255,255,0.08); }

        .logo-text { font-family: var(--font-display); font-weight: 800; font-size: 18px;
          background: linear-gradient(110deg, #FFFFFF 20%, #8E9AA8 45%, #FFFFFF 70%);
          background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer-premium 4s linear infinite; letter-spacing: -0.02em; }
        .page-heading { font-family: var(--font-display); font-size: 32px; font-weight: 800;
          background: linear-gradient(110deg, #FFFFFF 25%, #8E9AA8 50%, #FFFFFF 75%);
          background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          animation: shimmer-premium 5s linear infinite; letter-spacing: -0.03em; }

        .typing-dot { width: 5px; height: 5px; background: #9CA3AF; border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out; display: inline-block; }
        .typing-dot:nth-child(1) { animation-delay: 0s; }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        .live-layout { display: grid; grid-template-columns: 260px 1fr 290px; gap: 20px; align-items: flex-start; }
        .live-col { display: flex; flex-direction: column; gap: 14px; }

        .panel { background: linear-gradient(145deg, var(--bg-surface) 0%, rgba(15,18,26,0.95) 100%);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden;
          transition: border-color 0.2s, transform 0.2s; position: relative; isolation: isolate; }
        .panel::before { content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle 180px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, transparent 70%);
          opacity: 0; transition: opacity 0.25s ease; pointer-events: none; }
        .panel:hover { border-color: rgba(255,255,255,0.16); }
        .panel:hover::before { opacity: 1; }
        .panel-header { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 8px; }
        .panel-step { width: 20px; height: 20px; border-radius: 5px; background: rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-family: var(--font-mono); font-weight: 700; color: #9CA3AF; }
        .panel-title { font-size: 10px; font-family: var(--font-mono); color: #6B7280; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }
        .panel-body { padding: 12px 14px; }

        .role-pill { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.06); background: rgba(21,26,36,0.9);
          color: #9CA3AF; font-weight: 500; font-size: 12px; cursor: pointer; transition: all 0.25s ease;
          width: 100%; text-align: left; position: relative; overflow: hidden; }
        .role-pill::before { content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle 120px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 40%, transparent 70%);
          opacity: 0; transition: opacity 0.25s ease; pointer-events: none; }
        .role-pill:hover { border-color: rgba(255,255,255,0.3); color: #FFFFFF; background: rgba(255,255,255,0.07); transform: translateX(3px); }
        .role-pill:hover::before { opacity: 1; }
        .role-pill.selected { border-color: rgba(255,255,255,0.38); background: rgba(255,255,255,0.1); color: #FFFFFF; font-weight: 600; }
        .role-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.15); flex-shrink: 0; transition: all 0.25s; }
        .role-pill.selected .role-pill-dot { background: #10B981; box-shadow: 0 0 6px rgba(16,185,129,0.5); }

        .btn-launch { width: 100%; padding: 11px; border-radius: 9px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.25s ease; border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.08); color: #FFFFFF; font-family: var(--font-body); position: relative; overflow: hidden; }
        .btn-launch::before { content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle 140px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 40%, transparent 70%);
          opacity: 0; transition: opacity 0.25s ease; pointer-events: none; }
        .btn-launch:hover:not(:disabled) { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.38); transform: translateY(-1px); }
        .btn-launch:hover:not(:disabled)::before { opacity: 1; }
        .btn-launch:disabled { opacity: 0.3; cursor: not-allowed; }

        .feed-item { background: rgba(255,255,255,0.02); border: 1px solid rgba(229,231,235,0.08); border-radius: 10px; padding: 12px; transition: border-color 0.2s; }
        .feed-item.submitted { border-color: rgba(16,185,129,0.15); }

        .alert-item { padding: 7px 10px; background: rgba(248,113,113,0.04);
          border: 1px solid rgba(248,113,113,0.08); border-radius: 7px; border-left: 2px solid #F87171; }

        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }

        @keyframes typing { 0%,60%,100% { transform:translateY(0); opacity:.4; } 30% { transform:translateY(-5px); opacity:1; } }
        @keyframes pulse-glow { 0%,100% { opacity:.8; } 50% { opacity:1; box-shadow: 0 0 8px rgba(229,231,235,0.35); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(15px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer-premium { 0% { background-position:200% center; } 100% { background-position:-200% center; } }
        @keyframes pulse-dot { 0%,100% { opacity:.7; } 50% { opacity:1; } }
      `}</style>

      <div className="scene-bg" />

      <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>

        {/* Violation Popup */}
        {showEndPopup && (
          <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'80px', background:'rgba(0,0,0,0.95)', backdropFilter:'blur(12px)' }}>
            <div style={{ background:'linear-gradient(145deg,#151A24,#0A0C12)', border:'1px solid rgba(248,113,113,0.35)', borderRadius:'20px', padding:'28px 32px', maxWidth:'420px', width:'90%', boxShadow:'0 0 80px rgba(248,113,113,0.12)', position:'relative', animation:'fadeUp 0.3s ease' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#F87171 0%,#D1D5DB 60%,#E5E7EB 100%)', borderRadius:'20px 20px 0 0' }} />
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, color:'#F87171', fontWeight:'700' }}>!</div>
                <div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontSize:'16px', fontWeight:'800', color:'#F87171', margin:0 }}>Second Violation Detected</h3>
                  <p style={{ fontSize:'11px', color:'#6B7280', fontFamily:'var(--font-mono)', margin:'2px 0 0' }}>Session #{activeSessionId} — {selectedCandidate?.fullName || 'Candidate'}</p>
                </div>
              </div>
              {latestViolation && (
                <div style={{ background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.12)', borderRadius:'8px', padding:'8px 12px', marginBottom:'14px' }}>
                  <p style={{ fontSize:'10px', color:'#F87171', fontFamily:'var(--font-mono)', margin:0 }}>{formatEventType(latestViolation.eventType)}{latestViolation.pastedText && ` — "${latestViolation.pastedText.substring(0,50)}..."`}</p>
                </div>
              )}
              <p style={{ fontSize:'13px', color:'#D1D5DB', lineHeight:'1.6', marginBottom:'20px' }}>The candidate has committed a <strong style={{ color:'#F87171' }}>second violation</strong>. Do you want to <strong style={{ color:'#FFFFFF' }}>terminate this interview</strong>?</p>
              <div style={{ display:'flex', gap:'10px' }}>
                <button onClick={handleEndForCheating} className="ctrl-btn ctrl-btn-stop" style={{ flex:1, padding:'10px', borderRadius:'10px', fontSize:'13px', fontWeight:'700' }}>Yes, End</button>
                <button onClick={() => { setShowEndPopup(false); setViolationCount(1) }} className="btn-ghost-gray" style={{ flex:1, padding:'10px', borderRadius:'10px', fontSize:'13px', fontWeight:'600' }}>No, Continue</button>
              </div>
            </div>
          </div>
        )}

        {/* Navbar */}
        <nav className="top-nav">
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,#FFFFFF,#8E9AA8)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:'900', fontSize:'11px', color:'#0A0C12', boxShadow:'0 0 12px rgba(255,255,255,0.2)', flexShrink:0 }}>AI</div>
            <span className="logo-text">InterviewAI</span>
            <span className="badge-gray badge-recruiter" style={{ marginLeft:'4px' }}>Recruiter</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <span style={{ fontSize:'12px', color: theme === 'light' ? '#334155' : '#8E9AA8' }}>{user?.fullName}</span>
            <button onClick={toggleTheme} style={{
              width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer',
              background: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease', flexShrink: 0,
            }}
              onMouseEnter={e => e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}>
              {theme === 'dark' ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8EDF2" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <button className="btn-ghost-gray" onClick={logout} style={{ padding:'6px 16px', fontSize:'12px' }}>Sign out</button>
          </div>
        </nav>

        {/* Main Content */}
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 32px' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px', animation: 'fadeUp 0.4s ease forwards' }}>
            <p style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: theme === 'light' ? '#64748B' : 'rgba(220,222,230,0.5)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '8px' }}>Recruiter Portal</p>
            <h1 className="page-heading">Interview Control Center</h1>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:'2px', borderBottom:'1px solid var(--border)', marginBottom:'28px' }}>
            {[
              { id:'live', label:'Live Interview' },
              { id:'reports', label:'Analysis Reports' },
              { id:'resume', label:'Resume Screening' },
              { id:'candidates', label:'Candidates' },
            ].map(tab => (
              <button key={tab.id} className={`tab-btn${activeTab===tab.id?' active':''}`} onClick={() => handleTabClick(tab.id)}>{tab.label}</button>
            ))}
          </div>

          {/* LIVE TAB */}
          <div style={{ display: activeTab==='live' ? 'block' : 'none' }}>
            <div className="live-layout">
              {/* Col 1 */}
              <div className="live-col">
                <div className="panel" onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x',`${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--mouse-y',`${((e.clientY-r.top)/r.height)*100}%`) }}>
                  <div className="panel-header"><div className="panel-step">1</div><span className="panel-title">Select Candidate</span></div>
                  <div className="panel-body">
                    {loading ? <p style={{ color:'var(--text-dim)', fontSize:'13px' }}>Loading...</p> : (
                      <div style={{ position:'relative' }}>
                        <select className="select-gray" value={selectedCandidate?.id || ''} onChange={e => { const found=candidates.find(c=>String(c.id)===e.target.value); setSelectedCandidate(found||null); if(found) sessionStorage.setItem('recruiter_selected_candidate',JSON.stringify(found)); else sessionStorage.removeItem('recruiter_selected_candidate') }}>
                          <option value="">Select candidate</option>
                          {candidates.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                        </select>
                        <div style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none', color:'var(--text-dim)', fontSize:'10px' }}>▼</div>
                      </div>
                    )}
                    {selectedCandidate && (
                      <div className="selected-badge">
                        <div className="selected-dot" />
                        <span style={{ fontSize:'12px', fontWeight:'500', color:'var(--text)' }}>{selectedCandidate.fullName}</span>
                        <span style={{ fontSize:'10px', color:'var(--text-dim)', fontFamily:'var(--font-mono)', marginLeft:'auto' }}>ID: {selectedCandidate.id}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="panel" onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x',`${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--mouse-y',`${((e.clientY-r.top)/r.height)*100}%`) }}>
                  <div className="panel-header"><div className="panel-step">2</div><span className="panel-title">Job Role</span></div>
                  <div className="panel-body" style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {JOB_ROLES.map(r => (
                      <button key={r} className={`role-pill${selectedRole===r?' selected':''}`} onClick={() => setSelectedRole(r)}
                        onMouseMove={e => { const rect=e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x',`${((e.clientX-rect.left)/rect.width)*100}%`); e.currentTarget.style.setProperty('--mouse-y',`${((e.clientY-rect.top)/rect.height)*100}%`) }}>
                        <span className="role-pill-dot" />{r.replace(/_/g,' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="panel" onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x',`${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--mouse-y',`${((e.clientY-r.top)/r.height)*100}%`) }}>
                  <div className="panel-header"><div className="panel-step">3</div><span className="panel-title">Launch Session</span></div>
                  <div className="panel-body">
                    {selectedCandidate && (
                      <div style={{ padding:'8px 12px', background: theme==='light' ? 'rgba(0,0,0,0.04)' : 'rgba(229,231,235,0.04)', border: `1px solid ${theme==='light' ? 'rgba(0,0,0,0.1)' : 'rgba(229,231,235,0.1)'}`, borderRadius:'8px', marginBottom:'12px' }}>
                        <p style={{ fontSize:'12px', fontWeight:'500', color:'var(--text)', margin:0 }}>{selectedCandidate.fullName}</p>
                        <p style={{ fontSize:'10px', color:'var(--text-dim)', fontFamily:'var(--font-mono)', margin:'2px 0 0' }}>{selectedRole.replace(/_/g,' ')}</p>
                      </div>
                    )}
                    <button className="btn-launch" onClick={handleStart} disabled={starting||Boolean(activeSessionId)}
                      onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x',`${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--mouse-y',`${((e.clientY-r.top)/r.height)*100}%`) }}>
                      {starting ? 'Starting...' : activeSessionId ? 'Interview Active' : 'Launch Interview'}
                    </button>
                    {message && <p style={{ marginTop:'10px', fontSize:'11px', color:messageType==='success'?'#10B981':'#F87171', fontFamily:'var(--font-mono)', textAlign:'center' }}>{message}</p>}
                  </div>
                </div>

                {proctoringAlerts.length > 0 && (
                  <div className="panel" style={{ borderColor:'rgba(248,113,113,0.15)' }} onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x',`${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--mouse-y',`${((e.clientY-r.top)/r.height)*100}%`) }}>
                    <div className="panel-header">
                      <div className="panel-step" style={{ color:'#F87171', background:'rgba(248,113,113,0.1)' }}>!</div>
                      <span className="panel-title" style={{ color:'#F87171' }}>Security Alerts ({proctoringAlerts.length})</span>
                    </div>
                    <div className="panel-body" style={{ display:'flex', flexDirection:'column', gap:'5px', maxHeight:'180px', overflowY:'auto' }}>
                      {proctoringAlerts.slice(0,5).map((alert, idx) => (
                        <div key={idx} className="alert-item">
                          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}>
                            <span style={{ fontSize:'9px', fontWeight:'700', color:'#F87171', fontFamily:'var(--font-mono)' }}>{formatEventType(alert.eventType)}</span>
                            <span style={{ fontSize:'8px', color:'#4B5563', fontFamily:'var(--font-mono)' }}>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p style={{ fontSize:'9px', color:'#D1D5DB', margin:0 }}>{getAlertDescription(alert)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Col 2 — Live Feed */}
              <div className="live-col">
                <div className="panel" style={{ flex:1 }} onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x',`${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--mouse-y',`${((e.clientY-r.top)/r.height)*100}%`) }}>
                  <div className="panel-header" style={{ justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:activeSessionId&&wsConnected?'#10B981':'#4B5563', display:'inline-block', ...(activeSessionId&&wsConnected?{animation:'pulse-dot 2s infinite'}:{}) }} />
                      <span className="panel-title">Live Response Feed</span>
                    </div>
                    {activeSessionId && (
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ fontSize:'10px', fontFamily:'var(--font-mono)', color:wsConnected?'#E5E7EB':'#F59E0B', display:'flex', alignItems:'center', gap:'4px' }}>
                          <span style={{ display:'inline-block', width:'5px', height:'5px', borderRadius:'50%', background:wsConnected?'#10B981':'#F59E0B', animation:'pulse-dot 2s infinite' }} />
                          {wsConnected?'Live':'Connecting'}
                        </span>
                        <button onClick={handlePauseResume} disabled={isStopped||!wsConnected} className={`ctrl-btn ${isPaused?'ctrl-btn-resume':'ctrl-btn-pause'}`}>{isPaused?'Resume':'Pause'}</button>
                        {!isStopped ? <button onClick={handleStop} className="ctrl-btn ctrl-btn-stop">End</button>
                          : <span className="ctrl-btn ctrl-btn-stop" style={{ cursor:'default', opacity:0.6 }}>Ended</span>}
                        <span className="badge-gray badge-live">#{activeSessionId}</span>
                      </div>
                    )}
                  </div>
                  <div className="panel-body" style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                    {isStopped && activeSessionId && (
                      <div style={{ padding:'8px 12px', background:'rgba(248,113,113,0.06)', border:'1px solid rgba(248,113,113,0.12)', borderRadius:'8px', marginBottom:'12px' }}>
                        <p style={{ fontSize:'12px', color:'#F87171', fontWeight:'500', margin:0 }}>Interview Stopped</p>
                        <p style={{ fontSize:'10px', color:'#6B7280', fontFamily:'var(--font-mono)', margin:'2px 0 0' }}>Analysis available in Reports tab</p>
                      </div>
                    )}
                    {activeSessionId && !wsConnected && !isStopped && (
                      <div style={{ padding:'8px 12px', background:'rgba(229,231,235,0.04)', border:'1px solid rgba(229,231,235,0.1)', borderRadius:'8px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px' }}>
                        <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                        <span style={{ fontSize:'10px', color:'#D1D5DB', fontFamily:'var(--font-mono)' }}>Connecting...</span>
                      </div>
                    )}
                    <div style={{ minHeight:'280px' }}>
                      {!activeSessionId ? (
                        <div style={{ minHeight:'240px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center' }}>
                          <div style={{ width:'48px', height:'48px', background:'rgba(255,255,255,0.03)', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'12px' }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="1.2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                          </div>
                          <p style={{ color:'var(--text-dim)', fontSize:'13px', marginBottom:'4px' }}>No Active Session</p>
                          <p style={{ fontSize:'10px', color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>Select candidate &amp; launch</p>
                        </div>
                      ) : Object.keys(liveFeed).length === 0 ? (
                        <div style={{ minHeight:'240px', display:'flex', alignItems:'center', justifyContent:'center', gap:'4px' }}>
                          <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                          <span style={{ marginLeft:'6px', color:'var(--text-dim)', fontSize:'12px' }}>Waiting for response...</span>
                        </div>
                      ) : (
                        <div style={{ display:'flex', flexDirection:'column', gap:'12px', maxHeight:'480px', overflowY:'auto', paddingRight:'4px' }}>
                          {Object.entries(liveFeed).sort(([a],[b]) => { const an=isNaN(Number(a))?9999:Number(a); const bn=isNaN(Number(b))?9999:Number(b); return an-bn }).map(([qNum,data]) => (
                            <div key={qNum} className={`feed-item${data.status==='SUBMITTED'?' submitted':''}`}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                                <span style={{ fontFamily:'var(--font-mono)', fontSize:'9px', background:data.status==='SUBMITTED'?'rgba(16,185,129,0.12)':'rgba(229,231,235,0.06)', color:data.status==='SUBMITTED'?'#10B981':'#D1D5DB', padding:'2px 8px', borderRadius:'16px', fontWeight:'600' }}>
                                  {qNum==='R'?'Recruiter':`Q${qNum}`}
                                </span>
                                <span style={{ fontSize:'9px', fontFamily:'var(--font-mono)', color:data.status==='SUBMITTED'?'#10B981':'#6B7280' }}>{data.status}</span>
                              </div>
                              <p style={{ fontSize:'11px', color:'#D1D5DB', marginBottom:'8px', lineHeight:'1.5' }}>{data.questionText}</p>
                              <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid var(--border)', borderRadius:'8px', padding:'8px 10px', fontSize:'11px', fontFamily:'var(--font-mono)', color:'#D1D5DB', whiteSpace:'pre-wrap', lineHeight:'1.5' }}>
                                {data.currentAnswer || <span style={{ color:'#4B5563', fontStyle:'italic' }}>No answer yet</span>}
                                {data.status==='TYPING' && <span style={{ display:'inline-block', width:'2px', height:'10px', background:'#E5E7EB', marginLeft:'2px', animation:'blink 1s infinite', verticalAlign:'middle' }} />}
                              </div>
                              {data.status==='SUBMITTED' && (() => {
                                const score=data.score; const scorePct=score!=null?Math.round((score/10)*100):null; const scoreColor=scorePct!=null?pctColor(scorePct):'#6B7280'
                                return (
                                  <div style={{ marginTop:'12px', padding:'12px 14px', background:'linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))', border:'1px solid rgba(255,255,255,0.07)', borderLeft:`3px solid ${scoreColor}`, borderRadius:'8px' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                                      <span style={{ fontSize:'10px', fontFamily:'var(--font-mono)', color:'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>Response Analysis</span>
                                      {score!=null && <span style={{ fontSize:'10px', fontFamily:'var(--font-mono)', padding:'2px 8px', borderRadius:'4px', background:`${scoreColor}20`, color:scoreColor, fontWeight:'700' }}>Score {score}/10</span>}
                                    </div>
                                    <div style={{ marginTop:'8px', paddingTop:'8px', borderTop:'1px solid rgba(255,255,255,0.06)', fontSize:'11px', color:'#9CA3AF', fontFamily:'var(--font-mono)', fontStyle:'italic' }}>Full analysis available in Reports tab</div>
                                  </div>
                                )
                              })()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {activeSessionId && !isStopped && (
                      <div style={{ marginTop:'14px', borderTop:'1px solid var(--border)', paddingTop:'12px' }}>
                        <p style={{ fontSize:'10px', color:isPaused?'var(--text-dim)':'var(--text-muted)', fontFamily:'var(--font-mono)', marginBottom:'8px' }}>
                          {isPaused ? 'Paused — ask a question:' : 'Pause the interview to ask a question'}
                        </p>
                        <div style={{ display:'flex', gap:'10px' }}>
                          <input value={recruiterQuestion} onChange={e=>setRecruiterQuestion(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')handleRecruiterQuestion()}}
                            placeholder={isPaused?'Type your question...':'Pause first to ask a question'} disabled={!isPaused}
                            className="input-gray" style={{ borderColor:isPaused?'rgba(229,231,235,0.25)':'var(--border)', opacity:isPaused?1:0.5 }} />
                          <button className="btn-primary-gray" onClick={handleRecruiterQuestion} disabled={!recruiterQuestion.trim()||!isPaused}
                            style={{ padding:'0 20px', fontSize:'12px', flexShrink:0, opacity:(!recruiterQuestion.trim()||!isPaused)?0.4:1, whiteSpace:'nowrap' }}
                            onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--mouse-x',`${((e.clientX-r.left)/r.width)*100}%`);e.currentTarget.style.setProperty('--mouse-y',`${((e.clientY-r.top)/r.height)*100}%`)}}>
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Col 3 — Camera */}
              <div className="live-col">
                <AdminCameraView userId={selectedCandidate?.id} />
                {activeSessionId && (
                  <div className="panel" onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x',`${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--mouse-y',`${((e.clientY-r.top)/r.height)*100}%`) }}>
                    <div className="panel-header"><span className="panel-title">Session Stats</span></div>
                    <div className="panel-body" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                      {[
                        { label:'Questions', val: Object.keys(liveFeed).filter(k=>k!=='R').length },
                        { label:'Submitted', val: Object.values(liveFeed).filter(d=>d.status==='SUBMITTED').length },
                        { label:'Violations', val: violationCount, danger: violationCount > 0 },
                        { label:'Recruiter Qs', val: liveFeed['R'] ? 1 : 0 },
                      ].map(({label,val,danger}) => (
                        <div key={label} style={{ textAlign:'center', padding:'8px 6px', background: theme==='light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)', borderRadius:'7px' }}>
                          <div style={{ fontSize:'8px', color:'var(--text-muted)', fontFamily:'var(--font-mono)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'4px' }}>{label}</div>
                          <div style={{ fontSize:'18px', fontWeight:'800', color:danger?'#F87171':'var(--text)', fontFamily:'var(--font-display)' }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reports Tab */}
          <div style={{ display: activeTab==='reports'?'block':'none' }}>
            {mountedTabs.current.has('reports') && renderReportsTab()}
          </div>

          {/* Resume Tab */}
          <div style={{ display: activeTab==='resume'?'block':'none' }}>
            {mountedTabs.current.has('resume') && <ResumeScreeningTab candidates={candidates} selectedCandidate={rsCandidate} setSelectedCandidate={setRsCandidate} resumeFile={rsResumeFile} setResumeFile={setRsResumeFile} resumeText={rsResumeText} setResumeText={setRsResumeText} messages={rsMessages} setMessages={setRsMessages} generated={rsGenerated} setGenerated={setRsGenerated} conversationRef={rsConversationRef} />}
          </div>

          {/* Candidates Tab */}
          <div style={{ display: activeTab==='candidates'?'block':'none' }}>
            {mountedTabs.current.has('candidates') && <CandidatesTab candidates={candidates} sessions={allCompletedSessions} loading={loading} />}
          </div>

        </div>
      </div>
    </>
  )
}