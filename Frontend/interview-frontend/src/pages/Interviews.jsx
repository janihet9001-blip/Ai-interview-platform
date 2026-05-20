import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import API from '../services/api'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import ProctoringHandler from '../components/ProctoringHandler'

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
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', animation: 'fadeUp 0.3s ease forwards' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, alignSelf: 'flex-end',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <div style={{
        maxWidth: '75%', padding: '14px 18px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '4px 16px 16px 16px',
        fontSize: '15px', lineHeight: '1.7', color: 'var(--text)',
        whiteSpace: 'pre-wrap',
      }}>
        {text}
      </div>
    </div>
  )
}

function InterviewerBubble({ text }) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', animation: 'fadeUp 0.3s ease forwards' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, alignSelf: 'flex-end',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <div style={{
        maxWidth: '75%', padding: '14px 18px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '4px 16px 16px 16px',
        fontSize: '15px', lineHeight: '1.7', color: 'var(--text)',
        whiteSpace: 'pre-wrap',
      }}>
        {text}
      </div>
    </div>
  )
}

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '20px', animation: 'fadeUp 0.3s ease forwards' }}>
      <div style={{
        maxWidth: '75%', padding: '14px 18px',
        background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
        borderRadius: '16px 4px 16px 16px',
        fontSize: '15px', lineHeight: '1.7', color: 'white',
        whiteSpace: 'pre-wrap',
      }}>
        {text}
      </div>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: '700', color: 'white',
        flexShrink: 0, alignSelf: 'flex-end',
      }}>U</div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>
      <div style={{
        padding: '14px 20px', background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '4px 16px 16px 16px',
        display: 'flex', alignItems: 'center', gap: '6px',
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--text-dim)',
            animation: `blink 1.2s ease ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )
}

export default function Interviews() {
  const { role } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      const confirmEnd = window.confirm('Going back will end your interview. Are you sure?')
      if (confirmEnd) {
        window.speechSynthesis.cancel()
        stompClient.current?.deactivate()
        navigate(`/results/${sessionRef.current?.id}`, { replace: true })
      } else {
        window.history.pushState(null, '', window.location.href)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [navigate])

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

  // ── NEW: termination overlay state ──
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

  const accent = roleColors[role] || '#2563EB'
  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  useEffect(() => { sessionRef.current = session }, [session])
  useEffect(() => { questionsRef.current = questions }, [questions])
  useEffect(() => { currentRef.current = current }, [current])
  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { stoppedRef.current = stopped }, [stopped])
  useEffect(() => { recruiterQuestionRef.current = recruiterQuestion }, [recruiterQuestion])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, submitting])

  // ── Countdown timer when terminated overlay is shown ──
  useEffect(() => {
    if (!showTerminated) return
    setTerminatedCountdown(5)
    const interval = setInterval(() => {
      setTerminatedCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          stompClient.current?.deactivate()
          navigate(`/results/${sessionRef.current?.id}`, { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [showTerminated])

  const botSay = (text) => {
    setMessages(prev => {
      if (prev.length > 0 && prev[prev.length - 1].text === text) return prev
      return [...prev, { from: 'bot', text }]
    })
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  }

  const interviewerSay = (text) => {
    setMessages(prev => [...prev, { from: 'interviewer', text }])
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.speak(utterance)
  }

  const userSay = (text) => {
    setMessages(prev => [...prev, { from: 'user', text }])
  }

  const analyzeAllAnswers = async (sessionId, questionsList) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) { console.error('Groq API key missing'); return []; }

    const results = [];
    for (const q of questionsList) {
      if (!q.userAnswer || q.userAnswer.trim() === '') continue;
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            temperature: 0.2,
            max_tokens: 200,
            messages: [
              {
                role: 'system',
                content: `You are a senior technical interviewer evaluating a candidate's answer.

Score the answer on THREE dimensions, each as an integer from 0 to 100:

1. confidence (0-100): How clearly and assertively does the candidate communicate?
2. authenticity (0-100): Does this read like a genuine human answer or copied/AI-generated?
3. accuracy (0-100): How technically correct and complete is the answer for the question asked?

Set suspicious=true if authenticity < 40 OR the answer is suspiciously perfect or AI-sounding.

Respond ONLY with a raw JSON object:
{"confidence": 72, "authenticity": 65, "accuracy": 80, "suspicious": false, "reason": "one sentence max"}`
              },
              { role: 'user', content: `Question: ${q.questiontext}\n\nAnswer: ${q.userAnswer}` }
            ]
          })
        });
        const data = await response.json();
        let parsed;
        try {
          const text = data.choices[0].message.content;
          parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        } catch {
          parsed = { confidence: 50, authenticity: 50, accuracy: 50, suspicious: false, reason: 'Analysis completed' };
        }
        results.push({
          questionNumber: q.questionNumber,
          questionText: q.questiontext,
          userAnswer: q.userAnswer,
          score: q.score,
          confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
          authenticity: Math.min(100, Math.max(0, Number(parsed.authenticity) || 50)),
          accuracy: Math.min(100, Math.max(0, Number(parsed.accuracy) || 50)),
          suspicious: Boolean(parsed.suspicious),
          reason: String(parsed.reason || 'Analysis completed')
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        results.push({
          questionNumber: q.questionNumber, questionText: q.questiontext,
          userAnswer: q.userAnswer, score: q.score,
          confidence: 50, authenticity: 50, accuracy: 50,
          suspicious: false, reason: 'Analysis error'
        });
      }
    }
    localStorage.setItem(`interview_analysis_${sessionId}`, JSON.stringify(results));
    return results;
  };

  const handleFinish = async () => {
    if (!sessionRef.current || isAnalyzing) return;
    if (submitting) await new Promise(resolve => setTimeout(resolve, 3000));
    
    setStopped(true);
    stoppedRef.current = true;
    ignoreFeedbackRef.current = true;
    setIsAnalyzing(true);
    window.speechSynthesis.cancel();
    
    botSay('Analyzing your answers... Please wait.');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const res = await API.get(`/interview/${sessionRef.current.id}/questions`);
      const allQuestions = res.data || [];
      const answeredQuestionsList = allQuestions.filter(
        q => q.userAnswer && q.userAnswer.trim() !== '' &&
             q.questionNumber !== 999 && q.questionNumber !== '999'
      );
      if (answeredQuestionsList.length === 0) {
        botSay('No answers to analyze. Redirecting...');
        setTimeout(() => navigate(`/results/${sessionRef.current.id}`), 2000);
        setIsAnalyzing(false);
        return;
      }
      await analyzeAllAnswers(sessionRef.current.id, answeredQuestionsList);
      botSay('Analysis complete! Redirecting to your results...');
      setTimeout(() => navigate(`/results/${sessionRef.current.id}`), 2500);
    } catch (err) {
      botSay('Redirecting to your results...');
      setTimeout(() => navigate(`/results/${sessionRef.current.id}`), 2000);
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const startSession = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('sessionId')
        let sessionData

        if (sessionId) {
          const res = await API.get(`/interview/${sessionId}/questions`)
          sessionData = { id: Number(sessionId), questions: res.data }
        } else {
          const res = await API.post('/interview/start', { jobRole: role })
          sessionData = res.data
        }

        setSession(sessionData)
        setQuestions(sessionData.questions || [])
        setLoading(false)

        const label = roleLabels[role] || 'Technical'
        const getGreeting = () => {
          const hour = new Date().getHours()
          if (hour >= 5 && hour < 12) return 'Good morning'
          if (hour >= 12 && hour < 17) return 'Good afternoon'
          if (hour >= 17 && hour < 21) return 'Good evening'
          return 'Working late'
        }

        setTimeout(() => botSay(`${getGreeting()} - welcome to your ${label} interview.`), 300)
        setTimeout(() => botSay(`${sessionData.questions[0]?.questiontext || ''}`), 2200)

        const client = new Client({
          webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
          onConnect: () => {

            client.subscribe(`/topic/feedback/${sessionData.id}`, (message) => {
              const feedback = JSON.parse(message.body)
              if (stoppedRef.current || ignoreFeedbackRef.current) { setSubmitting(false); return }
              if (pausedRef.current) { setSubmitting(false); return }

              if (feedback.questionId) {
                setAllAnswers(prev => {
                  const updated = { ...prev }
                  const existing = updated[feedback.questionId] || {}
                  updated[feedback.questionId] = { ...existing, score: feedback.score, aiFeedback: feedback.feedback }
                  return updated
                })
              }

              if (feedback.sessionCompleted) {
                setTimeout(() => {
                  botSay('Interview complete. You answered all questions. Analyzing your answers...')
                  handleFinish()
                }, 500)
              } else {
                const nextIndex = currentRef.current
                const nextQ = questionsRef.current[nextIndex]
                if (nextQ) {
                  setTimeout(() => {
                    if (!pausedRef.current && !stoppedRef.current && !ignoreFeedbackRef.current) {
                      botSay(nextQ.questiontext)
                    }
                  }, 600)
                }
              }
              setSubmitting(false)
            })

            client.subscribe(`/topic/end/${sessionData.id}`, () => {
              ignoreFeedbackRef.current = true
              pausedRef.current = true
              stoppedRef.current = true
              setPaused(true)
              setStopped(true)
              window.speechSynthesis.cancel()
              botSay('The interviewer has ended the session. Analyzing your answers...')
              setTimeout(() => handleFinish(), 3000)
            })

            client.subscribe(`/topic/recruiter-question/${sessionData.id}`, (message) => {
              const data = JSON.parse(message.body)
              const question = data.question || ''
              const questionId = data.questionId || null
              ignoreFeedbackRef.current = true
              recruiterQuestionRef.current = question
              recruiterQuestionIdRef.current = questionId
              setRecruiterQuestion(question)
              pausedRef.current = true
              setPaused(true)
              interviewerSay(question)
            })

            client.subscribe(`/topic/pause/${sessionData.id}`, (message) => {
              const data = JSON.parse(message.body)
              if (data.action === 'STOP') {
                ignoreFeedbackRef.current = true
                pausedRef.current = true
                stoppedRef.current = true
                setPaused(true)
                setStopped(true)
                botSay('Your interview session has ended. Analyzing your answers...')
                handleFinish()
                return
              }
              if (data.action === 'PAUSE') {
                ignoreFeedbackRef.current = true
                pausedRef.current = true
                setPaused(true)
                return
              }
              if (data.action === 'RESUME' || data.action === 'CONTINUE') {
                recruiterQuestionRef.current = null
                recruiterQuestionIdRef.current = null
                setRecruiterQuestion(null)
                setTimeout(() => {
                  ignoreFeedbackRef.current = false
                  pausedRef.current = false
                  setPaused(false)
                  const nextIndex = currentRef.current
                  const nextQ = questionsRef.current[nextIndex]
                  if (nextQ) {
                    setTimeout(() => {
                      if (!pausedRef.current && !stoppedRef.current) botSay(nextQ.questiontext)
                    }, 600)
                  }
                }, 1500)
              }
            })

            client.subscribe(`/topic/warning/${sessionData.id}`, (msg) => {
              const data = JSON.parse(msg.body)
              if (data.action === 'WARN') {
                setShowWarning(true)
                window.speechSynthesis.cancel()
                setTimeout(() => setShowWarning(false), 10000)
              }
              // ── CHANGED: show termination overlay instead of plain botSay ──
              if (data.action === 'END_FOR_CHEATING') {
                setShowWarning(false)
                setStopped(true)
                stoppedRef.current = true
                ignoreFeedbackRef.current = true
                window.speechSynthesis.cancel()
                setShowTerminated(true) // triggers overlay + countdown
              }
            })

          },
          onStompError: () => { setError('Connection failed.'); setSubmitting(false) },
        })
        client.activate()
        stompClient.current = client
      } catch {
        setError('Failed to start interview.')
        setLoading(false)
      }
    }

    startSession()
    return () => stompClient.current?.deactivate()
  }, [role, navigate])

  const sendTyping = (value) => {
    const s = sessionRef.current
    const qs = questionsRef.current
    const c = currentRef.current
    if (!stompClient.current?.connected || !s) return
    const isRecruiterQ = Boolean(recruiterQuestionRef.current)
    stompClient.current.publish({
      destination: '/app/typing',
      body: JSON.stringify({
        sessionId: s.id,
        questionId: isRecruiterQ ? null : qs[c]?.id,
        questionText: isRecruiterQ ? recruiterQuestionRef.current : qs[c]?.questiontext,
        questionNumber: isRecruiterQ ? 'R' : c + 1,
        currentAnswer: value,
        status: 'TYPING',
      }),
    })
  }

  const handleMic = () => {
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Speech Recognition not supported. Use Chrome or Edge.'); return }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onstart = () => setListening(true)
    recognition.onresult = (event) => {
      let finalText = '', interimText = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalText += result[0].transcript + ' '
        else interimText += result[0].transcript
      }
      const transcript = finalText + interimText
      setAnswer(transcript)
      sendTyping(transcript)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
  }

  const handleSend = () => {
    if (!answer.trim() || !session || submitting || stopped) return
    const isRecruiterQ = Boolean(recruiterQuestionRef.current)
    const currentQuestion = questionsRef.current[currentRef.current]
    userSay(answer)
    setSubmitting(true)

    if (!isRecruiterQ && currentQuestion) {
      setAllAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: { questionNumber: current + 1, questiontext: currentQuestion.questiontext, userAnswer: answer, score: null, aiFeedback: null }
      }))
    } else if (isRecruiterQ && recruiterQuestionRef.current && recruiterQuestionIdRef.current) {
      setAllAnswers(prev => ({
        ...prev,
        [recruiterQuestionIdRef.current]: { questionNumber: 'R', questiontext: recruiterQuestionRef.current, userAnswer: answer, score: null, aiFeedback: null }
      }))
    }

    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: '/app/typing',
        body: JSON.stringify({
          sessionId: session.id,
          questionId: isRecruiterQ ? null : currentQuestion?.id,
          questionText: isRecruiterQ ? recruiterQuestionRef.current : currentQuestion?.questiontext,
          questionNumber: isRecruiterQ ? 'R' : current + 1,
          currentAnswer: answer,
          status: 'SUBMITTED',
        }),
      })
      if (!isRecruiterQ && currentQuestion && !pausedRef.current) {
        stompClient.current.publish({
          destination: '/app/answer',
          body: JSON.stringify({ sessionId: session.id, questionId: currentQuestion.id, questionText: currentQuestion.questiontext, userAnswer: answer }),
        })
        setCurrent((c) => c + 1)
      } else if (isRecruiterQ && recruiterQuestionIdRef.current) {
        stompClient.current.publish({
          destination: '/app/answer',
          body: JSON.stringify({ sessionId: session.id, questionId: recruiterQuestionIdRef.current, questionText: recruiterQuestionRef.current, userAnswer: answer }),
        })
        recruiterQuestionIdRef.current = null
      }
    }

    if (isRecruiterQ) {
      recruiterQuestionRef.current = null
      setRecruiterQuestion(null)
      recruiterQuestionIdRef.current = null
      setSubmitting(false)
    }
    setAnswer('')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
        Initializing session...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F87171' }}>
        {error}
      </div>
    )
  }

  const isTextareaDisabled = submitting || stopped || isAnalyzing || (paused && !recruiterQuestionRef.current)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>

      {/* ── TERMINATION OVERLAY (END_FOR_CHEATING) ── */}
      {showTerminated && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.88)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            background: '#0D1117',
            border: '2px solid #EF4444',
            borderRadius: '20px',
            padding: '48px 40px',
            maxWidth: '480px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 0 100px rgba(239,68,68,0.3)',
            animation: 'fadeUp 0.35s ease',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Top gradient bar */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
              background: 'linear-gradient(90deg, #EF4444, #F97316, #EF4444)',
            }} />

            {/* Icon */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#EF444418',
              border: '2px solid #EF444450',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px',
            }}>
              🚫
            </div>

            {/* Title */}
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '24px', fontWeight: '800',
              color: '#EF4444', margin: '0 0 12px',
              letterSpacing: '-0.01em',
            }}>
              Interview Terminated
            </h2>

            {/* One-liner message */}
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: '#FCA5A5',
              background: '#EF444412',
              border: '1px solid #EF444430',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: '0 0 20px',
              lineHeight: '1.6',
            }}>
              Your interview has been ended due to a violation issue.
            </p>

            {/* Detail */}
            <p style={{
              fontSize: '14px', color: '#94A3B8',
              lineHeight: '1.8', margin: '0 0 28px',
              fontFamily: 'var(--font-body)',
            }}>
              Multiple suspicious activities were detected and reported during your session. The recruiter has terminated this interview.
            </p>

            {/* Countdown */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '10px',
              padding: '12px 20px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#EF444420',
                border: '2px solid #EF444460',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: '13px',
                fontWeight: '800', color: '#EF4444',
              }}>
                {terminatedCountdown}
              </div>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '12px',
                color: 'var(--text-dim)', letterSpacing: '0.05em',
              }}>
                Redirecting to results in {terminatedCountdown}s…
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Warning overlay (first violation) ── */}
      {showWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            background: '#0D1117', border: '2px solid #EF4444',
            borderRadius: '16px', padding: '40px', maxWidth: '440px', width: '90%',
            textAlign: 'center', boxShadow: '0 0 80px rgba(239,68,68,0.35)',
            animation: 'fadeUp 0.3s ease', position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #EF4444, #F97316, #EF4444)' }} />
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>⚠️</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: '800', color: '#EF4444', marginBottom: '14px' }}>
              Warning — Activity Detected
            </h2>
            <p style={{ fontSize: '14px', color: '#CBD5E1', lineHeight: '1.8', marginBottom: '20px', fontFamily: 'var(--font-body)' }}>
              Suspicious activity has been detected and reported to the recruiter.
              <br /><br />
              This is your <strong style={{ color: '#EF4444', fontSize: '16px' }}>final warning</strong>.
              <br />
              <strong style={{ color: 'white' }}>Any further violation will immediately terminate your interview.</strong>
            </p>
            <div style={{ background: '#EF444415', border: '1px solid #EF444440', borderRadius: '8px', padding: '10px 16px', marginBottom: '24px', fontSize: '12px', color: '#FCA5A5', fontFamily: 'var(--font-mono)', lineHeight: '1.6' }}>
              The recruiter has been notified.<br />Please return to your interview immediately.
            </div>
            <button
              onClick={() => setShowWarning(false)}
              style={{ padding: '12px 36px', borderRadius: '10px', background: '#EF4444', color: 'white', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'var(--font-body)', width: '100%' }}
              onMouseEnter={e => e.currentTarget.style.background = '#DC2626'}
              onMouseLeave={e => e.currentTarget.style.background = '#EF4444'}
            >
              I understand — Return to Interview
            </button>
          </div>
        </div>
      )}

      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 32px', height: '60px',
        background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg, #2563EB, #06B6D4)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '12px', color: 'white' }}>AI</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: '800', fontSize: '16px' }}>InterviewAI</span>
          <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
          <span style={{ fontSize: '13px', color: accent, fontWeight: '600' }}>{roleLabels[role]}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-dim)', padding: '4px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '6px' }}>{fmt(seconds)}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>Q {current + 1}</span>
          <button
            onClick={handleFinish}
            disabled={!session || submitting || stopped || isAnalyzing}
            style={{ padding: '6px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', border: '1px solid #EF444460', background: '#EF444415', color: '#EF4444', fontFamily: 'var(--font-mono)', opacity: !session || submitting || stopped || isAnalyzing ? 0.4 : 1, transition: 'all 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EF444430' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#EF444415' }}
          >
            {isAnalyzing ? 'Analyzing...' : 'Finish Interview'}
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', maxWidth: '780px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {messages.map((msg, i) => {
          if (msg.from === 'bot') return <BotBubble key={i} text={msg.text} />
          if (msg.from === 'interviewer') return <InterviewerBubble key={i} text={msg.text} />
          return <UserBubble key={i} text={msg.text} />
        })}
        {submitting && <TypingBubble />}
        <div ref={chatEndRef} />
      </div>

      <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '20px 24px', flexShrink: 0 }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              value={answer}
              onChange={(e) => { setAnswer(e.target.value); sendTyping(e.target.value) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              rows={3}
              placeholder={
                isAnalyzing ? 'Analyzing answers...' :
                stopped ? 'Interview ended.' :
                paused && !recruiterQuestion ? 'AI paused - wait for interviewer question...' :
                paused && recruiterQuestion ? 'Type your answer to interviewer...' :
                'Type your answer...'
              }
              disabled={isTextareaDisabled}
              style={{ flex: 1, padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', resize: 'none', outline: 'none', fontSize: '15px', fontFamily: 'var(--font-body)', transition: 'border-color 0.2s ease', opacity: isTextareaDisabled ? 0.5 : 1 }}
              onFocus={e => e.target.style.borderColor = '#2563EB'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              onClick={handleMic}
              disabled={submitting || stopped || isAnalyzing}
              style={{ height: '52px', width: '52px', borderRadius: '12px', flexShrink: 0, border: listening ? '2px solid #EF4444' : '1px solid var(--border)', background: listening ? '#EF444420' : 'var(--surface2)', color: listening ? '#EF4444' : 'var(--text-dim)', fontSize: '22px', cursor: 'pointer', opacity: stopped || isAnalyzing || (paused && !recruiterQuestion) ? 0.4 : 1 }}
            >
              {listening ? 'Stop' : 'Mic'}
            </button>
            <button
              onClick={handleSend}
              disabled={!answer.trim() || submitting || stopped || isAnalyzing || isTextareaDisabled}
              className="btn-primary"
              style={{ height: '52px', padding: '0 28px', fontSize: '15px', flexShrink: 0 }}
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <ProctoringHandler
        sessionId={session?.id}
        interviewActive={!stopped && !paused && !isAnalyzing}
        stompClient={stompClient.current}
      />
    </div>
  )
}