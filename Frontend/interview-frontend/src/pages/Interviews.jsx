import CameraStream from '../components/CameraStream'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import ProctoringHandler from '../components/ProctoringHandler'
import PropTypes from 'prop-types'

const roleLabels = {
  JAVA_DEVELOPER: 'Java Developer',
  REACT_DEVELOPER: 'React Developer',
  PYTHON_DEVELOPER: 'Python Developer',
  FULLSTACK_DEVELOPER: 'Full Stack Dev',
  DEVOPS_ENGINEER: 'DevOps Engineer',
  ML_ENGINEER: 'ML Engineer',
}

const roleColors = {
  JAVA_DEVELOPER: '#F97316',
  REACT_DEVELOPER: '#06B6D4',
  PYTHON_DEVELOPER: '#10B981',
  FULLSTACK_DEVELOPER: '#8B5CF6',
  DEVOPS_ENGINEER: '#94A3B8',
  ML_ENGINEER: '#EC4899',
}

function BotBubble({ text }) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', animation: 'fadeUp 0.3s ease forwards' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <div style={{ maxWidth: '78%', padding: '12px 16px', background: 'linear-gradient(145deg, #0F121A 0%, rgba(15,18,26,0.95) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 14px 14px 14px', fontSize: '14px', lineHeight: '1.7', color: '#D1D5DB', whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </div>
  )
}

function InterviewerBubble({ text }) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', animation: 'fadeUp 0.3s ease forwards' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(229,231,235,0.15), rgba(229,231,235,0.06))', border: '1px solid rgba(229,231,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E5E7EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <div style={{ maxWidth: '78%', padding: '12px 16px', background: 'linear-gradient(145deg, rgba(229,231,235,0.06), rgba(229,231,235,0.02))', border: '1px solid rgba(229,231,235,0.12)', borderRadius: '4px 14px 14px 14px', fontSize: '14px', lineHeight: '1.7', color: '#F3F4F6', whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '16px', animation: 'fadeUp 0.3s ease forwards' }}>
      <div style={{ maxWidth: '78%', padding: '12px 16px', background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04))', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px 4px 14px 14px', fontSize: '14px', lineHeight: '1.7', color: '#F3F4F6', whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#D1D5DB', fontFamily: 'var(--font-mono)', flexShrink: 0, alignSelf: 'flex-end' }}>U</div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.06))', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <div style={{ padding: '12px 18px', background: 'linear-gradient(145deg, #0F121A 0%, rgba(15,18,26,0.95) 100%)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 14px 14px 14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#9CA3AF', animation: `typing-dot 1.4s infinite ease-in-out ${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

BotBubble.propTypes = { text: PropTypes.string.isRequired }
InterviewerBubble.propTypes = { text: PropTypes.string.isRequired }
UserBubble.propTypes = { text: PropTypes.string.isRequired }

export default function Interviews() {
  const { role } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    window.history.replaceState(null, '', window.location.href)
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
      const confirmEnd = window.confirm('Going back will end your interview. Are you sure?')
      if (confirmEnd) {
        speechQueueRef.current = []
        isSpeakingRef.current = false
        window.speechSynthesis.cancel()
        if (stompClient.current) { try { stompClient.current.deactivate() } catch (e) {} }
        const resultId = sessionRef.current?.id
        if (resultId) navigate(`/results/${resultId}`, { replace: true })
        else navigate('/dashboard', { replace: true })
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

  const [proctoringEnabled, setProctoringEnabled] = useState(false)
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])
  const [seconds, setSeconds] = useState(0)
  const [listening, setListening] = useState(false)
  const [paused, setPaused] = useState(false)
  const [stopped, setStopped] = useState(false)
  const [recruiterQuestion, setRecruiterQuestion] = useState(null)
  const [allAnswers, setAllAnswers] = useState({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showTerminated, setShowTerminated] = useState(false)
  const [terminatedCountdown, setTerminatedCountdown] = useState(5)

  const recognitionRef = useRef(null)
  const pausedRef = useRef(false)
  const stoppedRef = useRef(false)
  const ignoreFeedbackRef = useRef(false)
  const recruiterQuestionRef = useRef(null)
  const recruiterQuestionIdRef = useRef(null)
  const stompClient = useRef(null)
  const sessionRef = useRef(null)
  const questionsRef = useRef([])
  const currentRef = useRef(0)
  const chatEndRef = useRef(null)
  const sessionStarted = useRef(false)
  const spokenRef = useRef(new Set())
  const speechQueueRef = useRef([])
  const isSpeakingRef = useRef(false)
  const [showCamera, setShowCamera] = useState(false)

  const accent = roleColors[role] || '#9CA3AF'
  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  useEffect(() => { sessionRef.current = session }, [session])
  useEffect(() => { questionsRef.current = questions }, [questions])
  useEffect(() => { currentRef.current = current }, [current])
  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { stoppedRef.current = stopped }, [stopped])
  useEffect(() => { recruiterQuestionRef.current = recruiterQuestion }, [recruiterQuestion])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, submitting])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) { try { recognitionRef.current.stop() } catch (e) {} recognitionRef.current = null }
      speechQueueRef.current = []
      isSpeakingRef.current = false
      window.speechSynthesis.cancel()
      if (stompClient.current) { try { stompClient.current.deactivate() } catch (e) {} }
    }
  }, [])

  useEffect(() => {
    if (!showTerminated) return
    setTerminatedCountdown(5)
    const interval = setInterval(() => {
      setTerminatedCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); stompClient.current?.deactivate(); navigate(`/results/${sessionRef.current?.id}`, { replace: true }); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showTerminated, navigate])

  const processSpeechQueue = () => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0) return
    isSpeakingRef.current = true
    const text = speechQueueRef.current.shift()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.92; utterance.pitch = 1; utterance.volume = 1
    utterance.onend = () => { isSpeakingRef.current = false; setTimeout(processSpeechQueue, 350) }
    utterance.onerror = () => { isSpeakingRef.current = false; setTimeout(processSpeechQueue, 350) }
    window.speechSynthesis.speak(utterance)
  }

  const botSay = (text) => {
    if (spokenRef.current.has(text)) return
    spokenRef.current.add(text)
    setMessages(prev => [...prev, { from: 'bot', text }])
    speechQueueRef.current.push(text)
    processSpeechQueue()
  }

  const interviewerSay = (text) => {
    setMessages(prev => [...prev, { from: 'interviewer', text }])
    speechQueueRef.current.push(text)
    processSpeechQueue()
  }

  const userSay = (text) => { setMessages(prev => [...prev, { from: 'user', text }]) }

  const analyzeAllAnswers = async (sessionId, questionsList) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY
    if (!apiKey) { console.error('Groq API key missing'); return [] }
    const results = []
    for (const q of questionsList) {
      if (!q.userAnswer || q.userAnswer.trim() === '') continue
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile', temperature: 0.2, max_tokens: 200,
            messages: [
              { role: 'system', content: `You are a senior technical interviewer evaluating a candidate's answer.\n\nScore the answer on THREE dimensions, each as an integer from 0 to 100:\n\n1. confidence (0-100): How clearly and assertively does the candidate communicate?\n2. authenticity (0-100): Does this read like a genuine human answer or copied/AI-generated?\n3. accuracy (0-100): How technically correct and complete is the answer for the question asked?\n\nSet suspicious=true if authenticity < 40 OR the answer is suspiciously perfect or AI-sounding.\n\nRespond ONLY with a raw JSON object:\n{"confidence": 72, "authenticity": 65, "accuracy": 80, "suspicious": false, "reason": "one sentence max"}` },
              { role: 'user', content: `Question: ${q.questiontext}\n\nAnswer: ${q.userAnswer}` }
            ]
          })
        })
        const data = await response.json()
        let parsed
        try { const text = data.choices[0].message.content; parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) }
        catch { parsed = { confidence: 50, authenticity: 50, accuracy: 50, suspicious: false, reason: 'Analysis completed' } }
        results.push({ questionNumber: q.questionNumber, questionText: q.questiontext, userAnswer: q.userAnswer, score: q.score, confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)), authenticity: Math.min(100, Math.max(0, Number(parsed.authenticity) || 50)), accuracy: Math.min(100, Math.max(0, Number(parsed.accuracy) || 50)), suspicious: Boolean(parsed.suspicious), reason: String(parsed.reason || 'Analysis completed') })
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch {
        results.push({ questionNumber: q.questionNumber, questionText: q.questiontext, userAnswer: q.userAnswer, score: q.score, confidence: 50, authenticity: 50, accuracy: 50, suspicious: false, reason: 'Analysis error' })
      }
    }
    localStorage.setItem(`interview_analysis_${sessionId}`, JSON.stringify(results))
    return results
  }

  const handleFinish = async () => {
    if (!sessionRef.current || isAnalyzing) return
    if (submitting) await new Promise(resolve => setTimeout(resolve, 3000))
    setStopped(true); stoppedRef.current = true; ignoreFeedbackRef.current = true; setIsAnalyzing(true)
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch (e) {} }
    speechQueueRef.current = []; isSpeakingRef.current = false; window.speechSynthesis.cancel()
    await new Promise(resolve => setTimeout(resolve, 500))
    botSay('Analyzing your answers... Please wait.')
    await new Promise(resolve => setTimeout(resolve, 3500))
    try {
      const res = await API.get(`/interview/${sessionRef.current.id}/questions`)
      const allQuestions = res.data || []
      const answeredQuestionsList = allQuestions.filter(q => q.userAnswer && q.userAnswer.trim() !== '' && q.questionNumber !== 999 && q.questionNumber !== '999')
      if (answeredQuestionsList.length === 0) {
        speechQueueRef.current = []; isSpeakingRef.current = false; window.speechSynthesis.cancel()
        await new Promise(resolve => setTimeout(resolve, 300))
        botSay('No answers to analyze. Redirecting...')
        await new Promise(resolve => setTimeout(resolve, 2500))
        navigate(`/results/${sessionRef.current.id}`, { replace: true })
        setIsAnalyzing(false); return
      }
      await analyzeAllAnswers(sessionRef.current.id, answeredQuestionsList)
      speechQueueRef.current = []; isSpeakingRef.current = false; window.speechSynthesis.cancel()
      await new Promise(resolve => setTimeout(resolve, 300))
      botSay('Analysis complete! Redirecting to your results...')
      await new Promise(resolve => setTimeout(resolve, 3000))
      navigate(`/results/${sessionRef.current.id}`, { replace: true })
    } catch {
      speechQueueRef.current = []; isSpeakingRef.current = false; window.speechSynthesis.cancel()
      await new Promise(resolve => setTimeout(resolve, 300))
      botSay('Redirecting to your results...')
      await new Promise(resolve => setTimeout(resolve, 2500))
      navigate(`/results/${sessionRef.current.id}`, { replace: true })
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const startSession = async () => {
      if (sessionStarted.current) return
      sessionStarted.current = true
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('sessionId')
        if (sessionId) {
          try {
            const sessionCheck = await API.get(`/interview/${sessionId}/status`)
            if (sessionCheck.data.status === 'COMPLETED' || sessionCheck.data.status === 'ABANDONED') { setLoading(false); navigate(`/results/${sessionId}`, { replace: true }); return }
          } catch (checkErr) { console.error('Session status check failed:', checkErr) }
        }
        let sessionData
        if (sessionId) { const res = await API.get(`/interview/${sessionId}/questions`); sessionData = { id: Number(sessionId), questions: res.data } }
        else { const res = await API.post('/interview/start', { jobRole: role }); sessionData = res.data }
        setSession(sessionData); setQuestions(sessionData.questions || []); setLoading(false)
        const label = roleLabels[role] || 'Technical'
        const getGreeting = () => { const h = new Date().getHours(); if (h >= 5 && h < 12) return 'Good morning'; if (h >= 12 && h < 17) return 'Good afternoon'; if (h >= 17 && h < 21) return 'Good evening'; return 'Working late' }
        const welcomeMsg = `${getGreeting()} — welcome to your ${label} interview. I'll be asking you a series of technical questions. Please answer them clearly and in your own words.`
        const warningMsg = `Important: Please close all other tabs and applications before we begin. Do not use AI tools, search engines, or any external help during this interview. All activity is being monitored.`
        setTimeout(() => botSay(welcomeMsg), 300)
        setTimeout(() => botSay(warningMsg), 2000)
        setShowCamera(true)
        setTimeout(() => botSay(sessionData.questions[0]?.questiontext || ''), 6000)
        setTimeout(() => setProctoringEnabled(true), 6000)
        const client = new Client({
          webSocketFactory: () => new SockJS(import.meta.env.VITE_WS_URL),
          reconnectDelay: 5000, heartbeatIncoming: 4000, heartbeatOutgoing: 4000,
          onConnect: () => {
            client.subscribe(`/topic/feedback/${sessionData.id}`, (message) => {
              const feedback = JSON.parse(message.body)
              if (stoppedRef.current || ignoreFeedbackRef.current) { setSubmitting(false); return }
              if (pausedRef.current) { setSubmitting(false); return }
              if (feedback.questionId) { setAllAnswers(prev => { const u = { ...prev }; const e = u[feedback.questionId] || {}; u[feedback.questionId] = { ...e, score: feedback.score, aiFeedback: feedback.feedback }; return u }) }
              if (feedback.sessionCompleted) { setTimeout(() => { botSay('Interview complete. You answered all questions. Analyzing your answers...'); handleFinish() }, 500) }
              else {
                const nextIndex = currentRef.current; const nextQ = questionsRef.current[nextIndex]
                if (nextQ) { setTimeout(() => { if (!pausedRef.current && !stoppedRef.current && !ignoreFeedbackRef.current) botSay(nextQ.questiontext) }, 2000) }
              }
              setSubmitting(false)
            })
            client.subscribe(`/topic/end/${sessionData.id}`, () => {
              ignoreFeedbackRef.current = true; pausedRef.current = true; stoppedRef.current = true; setPaused(true); setStopped(true)
              speechQueueRef.current = []; isSpeakingRef.current = false; window.speechSynthesis.cancel()
              botSay('The interviewer has ended the session. Analyzing your answers...')
              setTimeout(() => handleFinish(), 3000)
            })
            client.subscribe(`/topic/recruiter-question/${sessionData.id}`, (message) => {
              const data = JSON.parse(message.body); const question = data.question || ''; const questionId = data.questionId || null
              ignoreFeedbackRef.current = true; recruiterQuestionRef.current = question; recruiterQuestionIdRef.current = questionId; setRecruiterQuestion(question); pausedRef.current = true; setPaused(true); interviewerSay(question)
            })
            client.subscribe(`/topic/pause/${sessionData.id}`, (message) => {
              const data = JSON.parse(message.body)
              if (data.action === 'STOP') { ignoreFeedbackRef.current = true; pausedRef.current = true; stoppedRef.current = true; setPaused(true); setStopped(true); botSay('Your interview session has ended. Analyzing your answers...'); handleFinish(); return }
              if (data.action === 'PAUSE') { ignoreFeedbackRef.current = true; pausedRef.current = true; setPaused(true); return }
              if (data.action === 'RESUME' || data.action === 'CONTINUE') {
                recruiterQuestionRef.current = null; recruiterQuestionIdRef.current = null; setRecruiterQuestion(null)
                setTimeout(() => {
                  ignoreFeedbackRef.current = false; pausedRef.current = false; setPaused(false)
                  const nextQ = questionsRef.current[currentRef.current]
                  if (nextQ) { setTimeout(() => { if (!pausedRef.current && !stoppedRef.current) botSay(nextQ.questiontext) }, 2000) }
                }, 1500)
              }
            })
            client.subscribe(`/topic/warning/${sessionData.id}`, (msg) => {
              const data = JSON.parse(msg.body)
              if (data.action === 'WARN') { setShowWarning(true); speechQueueRef.current = []; isSpeakingRef.current = false; window.speechSynthesis.cancel(); setTimeout(() => setShowWarning(false), 10000) }
              if (data.action === 'END_FOR_CHEATING') { setShowWarning(false); setStopped(true); stoppedRef.current = true; ignoreFeedbackRef.current = true; speechQueueRef.current = []; isSpeakingRef.current = false; window.speechSynthesis.cancel(); setShowTerminated(true) }
            })
          },
          onStompError: () => { setError('Connection failed.'); setSubmitting(false) },
          onDisconnect: () => { console.log('Disconnected from WebSocket') }
        })
        client.activate(); stompClient.current = client
      } catch { setError('Failed to start interview.'); setLoading(false) }
    }
    startSession()
    return () => stompClient.current?.deactivate()
  }, [role, navigate])

  const sendTyping = (value) => {
    const s = sessionRef.current; const qs = questionsRef.current; const c = currentRef.current
    if (!stompClient.current?.connected || !s) return
    const isRecruiterQ = Boolean(recruiterQuestionRef.current)
    stompClient.current.publish({ destination: '/app/typing', body: JSON.stringify({ sessionId: s.id, questionId: isRecruiterQ ? null : qs[c]?.id, questionText: isRecruiterQ ? recruiterQuestionRef.current : qs[c]?.questiontext, questionNumber: isRecruiterQ ? 'R' : c + 1, currentAnswer: value, status: 'TYPING' }) })
  }

  const handleMic = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Speech Recognition not supported. Use Chrome or Edge.'); return }
    const recognition = new SpeechRecognition()
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'en-US'
    recognition.onstart = () => setListening(true)
    recognition.onresult = (event) => {
      let finalText = '', interimText = ''
      for (let i = 0; i < event.results.length; i++) { const r = event.results[i]; if (r.isFinal) finalText += r[0].transcript + ' '; else interimText += r[0].transcript }
      const transcript = finalText + interimText; setAnswer(transcript); sendTyping(transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition; recognition.start()
  }

  const handleSend = () => {
    if (!answer.trim() || !session || submitting || stopped) return
    const isRecruiterQ = Boolean(recruiterQuestionRef.current)
    const currentQuestion = questionsRef.current[currentRef.current]
    userSay(answer); setSubmitting(true)
    if (!isRecruiterQ && currentQuestion) { setAllAnswers(prev => ({ ...prev, [currentQuestion.id]: { questionNumber: current + 1, questiontext: currentQuestion.questiontext, userAnswer: answer, score: null, aiFeedback: null } })) }
    else if (isRecruiterQ && recruiterQuestionRef.current && recruiterQuestionIdRef.current) { setAllAnswers(prev => ({ ...prev, [recruiterQuestionIdRef.current]: { questionNumber: 'R', questiontext: recruiterQuestionRef.current, userAnswer: answer, score: null, aiFeedback: null } })) }
    if (stompClient.current?.connected) {
      stompClient.current.publish({ destination: '/app/typing', body: JSON.stringify({ sessionId: session.id, questionId: isRecruiterQ ? null : currentQuestion?.id, questionText: isRecruiterQ ? recruiterQuestionRef.current : currentQuestion?.questiontext, questionNumber: isRecruiterQ ? 'R' : current + 1, currentAnswer: answer, status: 'SUBMITTED' }) })
      if (!isRecruiterQ && currentQuestion && !pausedRef.current) { stompClient.current.publish({ destination: '/app/answer', body: JSON.stringify({ sessionId: session.id, questionId: currentQuestion.id, questionText: currentQuestion.questiontext, userAnswer: answer }) }); setCurrent(c => c + 1) }
      else if (isRecruiterQ && recruiterQuestionIdRef.current) { stompClient.current.publish({ destination: '/app/answer', body: JSON.stringify({ sessionId: session.id, questionId: recruiterQuestionIdRef.current, questionText: recruiterQuestionRef.current, userAnswer: answer }) }); recruiterQuestionIdRef.current = null }
    }
    if (isRecruiterQ) { recruiterQuestionRef.current = null; setRecruiterQuestion(null); recruiterQuestionIdRef.current = null; setSubmitting(false) }
    setAnswer('')
  }

  if (loading) {
    return (
      <>
        <style>{INTERVIEW_STYLES}</style>
        <div className="scene-bg" />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.5)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#6B7280', fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Initializing session...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <style>{INTERVIEW_STYLES}</style>
        <div className="scene-bg" />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ padding: '28px 32px', background: 'linear-gradient(145deg, #0F121A, rgba(15,18,26,0.95))', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '12px', textAlign: 'center', maxWidth: '360px' }}>
            <p style={{ fontSize: '13px', color: '#F87171', fontFamily: 'var(--font-mono)' }}>{error}</p>
          </div>
        </div>
      </>
    )
  }

  const isTextareaDisabled = submitting || stopped || isAnalyzing || (paused && !recruiterQuestionRef.current)

  return (
    <>
      <style>{INTERVIEW_STYLES}</style>

      <div className="scene-bg" />

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

        {/* TERMINATION OVERLAY */}
        {showTerminated && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(12px)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'linear-gradient(145deg, #151A24, #0A0C12)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '20px', padding: '28px 32px', maxWidth: '420px', width: '90%', boxShadow: '0 0 80px rgba(248,113,113,0.12)', position: 'relative', animation: 'fadeUp 0.3s ease', overflow: 'hidden', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #F87171 0%, #D1D5DB 60%, #E5E7EB 100%)', borderRadius: '20px 20px 0 0' }} />
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: '#F87171', margin: '0 0 10px', letterSpacing: '-0.01em' }}>Interview Terminated</h2>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#FCA5A5', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '8px', padding: '10px 14px', margin: '0 0 14px', lineHeight: '1.6' }}>Your interview has been ended due to a violation issue.</p>
              <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: '1.8', margin: '0 0 20px' }}>Multiple suspicious activities were detected and reported during your session. The recruiter has terminated this interview.</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: '800', color: '#F87171' }}>{terminatedCountdown}</div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B7280', letterSpacing: '0.05em' }}>Redirecting to results in {terminatedCountdown}s...</span>
              </div>
            </div>
          </div>
        )}

        {/* WARNING OVERLAY */}
        {showWarning && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ background: 'linear-gradient(145deg, #151A24, #0A0C12)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '20px', padding: '28px 32px', maxWidth: '420px', width: '90%', boxShadow: '0 0 80px rgba(248,113,113,0.12)', position: 'relative', animation: 'fadeUp 0.3s ease', overflow: 'hidden', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #F87171, #D1D5DB, #E5E7EB)', borderRadius: '20px 20px 0 0' }} />
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: '800', color: '#F87171', margin: '0 0 12px', letterSpacing: '-0.01em' }}>Warning — Activity Detected</h2>
              <p style={{ fontSize: '13px', color: '#D1D5DB', lineHeight: '1.8', margin: '0 0 14px' }}>Suspicious activity has been detected and reported to the recruiter.<br /><br />This is your <strong style={{ color: '#F87171' }}>final warning</strong>. <strong style={{ color: '#F3F4F6' }}>Any further violation will immediately terminate your interview.</strong></p>
              <div style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.12)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '11px', color: '#FCA5A5', fontFamily: 'var(--font-mono)', lineHeight: '1.6' }}>The recruiter has been notified. Please return to your interview immediately.</div>
              <button onClick={() => setShowWarning(false)}
                style={{ width: '100%', padding: '11px', borderRadius: '10px', background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)', fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.22)'; e.currentTarget.style.color = '#FCA5A5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = '#F87171' }}>
                I understand — Return to Interview
              </button>
            </div>
          </div>
        )}

        {/* Navbar */}
        <nav className="top-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#FFFFFF,#8E9AA8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: '11px', color: '#0A0C12', boxShadow: '0 0 12px rgba(255,255,255,0.2)', flexShrink: 0 }}>AI</div>
            <span className="logo-text">InterviewAI</span>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: '12px', color: accent, fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{roleLabels[role]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#D1D5DB' }}>{fmt(seconds)}</span>
            </div>
            <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B7280' }}>Q {current + 1}</span>
            </div>
            <button onClick={handleFinish} disabled={!session || submitting || stopped || isAnalyzing}
              className="ctrl-btn ctrl-btn-stop"
              style={{ padding: '5px 16px', opacity: !session || submitting || stopped || isAnalyzing ? 0.4 : 1 }}>
              {isAnalyzing ? 'Analyzing...' : 'Finish Interview'}
            </button>
          </div>
        </nav>

        {/* Status bar when paused */}
        {paused && !stopped && (
          <div style={{ background: 'rgba(229,231,235,0.04)', borderBottom: '1px solid rgba(229,231,235,0.08)', padding: '8px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D1D5DB', display: 'inline-block', animation: 'pulse-dot 1.5s infinite' }} />
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#9CA3AF', letterSpacing: '0.08em' }}>
              {recruiterQuestion ? 'Recruiter question — answer below' : 'Interview paused by recruiter'}
            </span>
          </div>
        )}

        {/* Chat area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', maxWidth: '760px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {messages.map((msg, i) => {
            if (msg.from === 'bot') return <BotBubble key={i} text={msg.text} />
            if (msg.from === 'interviewer') return <InterviewerBubble key={i} text={msg.text} />
            return <UserBubble key={i} text={msg.text} />
          })}
          {submitting && <TypingBubble />}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,12,18,0.92)', backdropFilter: 'blur(16px)', padding: '16px 24px', flexShrink: 0 }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea value={answer}
                onChange={e => { setAnswer(e.target.value); sendTyping(e.target.value) }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                rows={3}
                placeholder={
                  isAnalyzing ? 'Analyzing answers...' :
                  stopped ? 'Interview ended.' :
                  paused && !recruiterQuestion ? 'Interview paused — wait for recruiter...' :
                  paused && recruiterQuestion ? 'Type your answer to recruiter question...' :
                  'Type your answer here... (Enter to send)'
                }
                disabled={isTextareaDisabled}
                className="input-gray"
                style={{ flex: 1, resize: 'none', padding: '12px 14px', fontSize: '14px', lineHeight: '1.6', borderColor: isTextareaDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)', opacity: isTextareaDisabled ? 0.5 : 1 }}
                onFocus={e => { if (!isTextareaDisabled) e.target.style.borderColor = 'rgba(255,255,255,0.3)' }}
                onBlur={e => e.target.style.borderColor = isTextareaDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)'}
              />

              {/* Mic button */}
              <button onClick={handleMic} disabled={submitting || stopped || isAnalyzing}
                style={{ height: '50px', width: '50px', borderRadius: '10px', flexShrink: 0, border: listening ? '1px solid rgba(248,113,113,0.4)' : '1px solid rgba(255,255,255,0.08)', background: listening ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.04)', color: listening ? '#F87171' : '#9CA3AF', cursor: 'pointer', opacity: stopped || isAnalyzing || (paused && !recruiterQuestion) ? 0.4 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {listening ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                )}
              </button>

              {/* Send button */}
              <button onClick={handleSend} disabled={!answer.trim() || submitting || stopped || isAnalyzing || isTextareaDisabled}
                className="btn-launch"
                style={{ height: '50px', padding: '0 24px', fontSize: '13px', flexShrink: 0, width: 'auto', opacity: !answer.trim() || submitting || stopped || isAnalyzing || isTextareaDisabled ? 0.35 : 1 }}
                onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`); e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`) }}>
                Send
              </button>
            </div>
          </div>
        </div>

        <ProctoringHandler sessionId={session?.id} interviewActive={proctoringEnabled && !stopped && !paused && !isAnalyzing} stompClient={stompClient.current} />
        {showCamera && <CameraStream sessionId={session?.id} userId={user?.id} />}
      </div>
    </>
  )
}

const INTERVIEW_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --bg-dark: #0A0C12;
    --bg-darker: #06080D;
    --bg-surface: #0F121A;
    --bg-surface-light: #151A24;
    --border: rgba(255,255,255,0.05);
    --border-light: rgba(255,255,255,0.08);
    --text: #E8EDF2;
    --text-dim: #8E9AA8;
    --text-muted: #4A5568;
    --surface: #0F121A;
    --surface2: #151A24;
    --font-mono: 'JetBrains Mono', monospace;
    --font-display: 'Inter', system-ui, sans-serif;
    --font-body: 'Inter', system-ui, sans-serif;
    --radius: 12px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root {
    background: linear-gradient(135deg, #0A0C12 0%, #06080D 100%);
    color: var(--text);
    font-family: var(--font-body);
    min-height: 100vh;
  }

  .scene-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 60% 40% at 20% 10%, rgba(30,40,60,0.25) 0%, transparent 55%),
      radial-gradient(ellipse 50% 35% at 85% 80%, rgba(20,30,50,0.2) 0%, transparent 60%);
  }

  .top-nav {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0 36px; height: 64px;
    background: rgba(10,12,18,0.9);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    position: sticky; top: 0; z-index: 100;
    backdrop-filter: blur(20px);
    flex-shrink: 0;
  }

  .logo-text {
    font-family: var(--font-display); font-weight: 800; font-size: 18px;
    background: linear-gradient(110deg, #FFFFFF 20%, #8E9AA8 45%, #FFFFFF 70%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: shimmer-premium 4s linear infinite; letter-spacing: -0.02em;
  }

  .input-gray {
    border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
    background: rgba(15,18,26,0.95); backdrop-filter: blur(8px);
    color: var(--text); font-size: 13px; font-family: var(--font-body);
    outline: none; transition: all 0.3s ease;
  }
  .input-gray:hover:not(:disabled) { border-color: rgba(255,255,255,0.2); background: rgba(20,24,34,0.98); }
  .input-gray:focus { border-color: rgba(255,255,255,0.3); box-shadow: 0 0 0 3px rgba(255,255,255,0.04); }

  .ctrl-btn {
    padding: 5px 16px; border-radius: 8px;
    font-size: 12px; font-weight: 600; cursor: pointer;
    font-family: var(--font-mono); transition: all 0.25s ease;
  }
  .ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  .ctrl-btn-stop { border: 1px solid rgba(248,113,113,0.35); background: rgba(248,113,113,0.09); color: #F87171; }
  .ctrl-btn-stop:hover:not(:disabled) { border-color: #F87171; background: rgba(248,113,113,0.2); color: #FCA5A5; box-shadow: 0 0 12px rgba(248,113,113,0.2); }

  .btn-launch {
    border-radius: 9px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.25s ease;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.08);
    color: #FFFFFF; font-family: var(--font-body);
    position: relative; overflow: hidden;
  }
  .btn-launch::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle 140px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 40%, transparent 70%);
    opacity: 0; transition: opacity 0.25s ease; pointer-events: none;
  }
  .btn-launch:hover:not(:disabled) { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.38); box-shadow: 0 4px 16px rgba(255,255,255,0.07); }
  .btn-launch:hover:not(:disabled)::before { opacity: 1; }
  .btn-launch:disabled { opacity: 0.3; cursor: not-allowed; }

  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }

  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pulse-dot { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
  @keyframes shimmer-premium { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
  @keyframes typing-dot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }
`