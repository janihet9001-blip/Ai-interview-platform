import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export default function ResumeScreeningTab({
  candidates,
  selectedCandidate, setSelectedCandidate,
  resumeFile, setResumeFile,
  resumeText, setResumeText,
  messages, setMessages,
  generated, setGenerated,
  conversationRef,
}) {
  const chatEndRef = useRef(null)
  const [input, setInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [fileError, setFileError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const extractTextFromFile = async (file) => {
    const name = file.name.toLowerCase()

    if (name.endsWith('.txt')) {
      return await file.text()
    }

    if (name.endsWith('.pdf')) {
      const buffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map(item => item.str).join(' ') + '\n'
      }
      return text
    }

    if (name.endsWith('.docx')) {
      const buffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer: buffer })
      return result.value
    }

    throw new Error('Only PDF, DOCX, and TXT files are supported.')
  }

  const handleFileSelect = async (file) => {
    if (!file) return

    setFileError('')
    setResumeFile(file)
    setResumeText('')
    setMessages([])
    setGenerated(false)
    conversationRef.current = []

    try {
      const text = await extractTextFromFile(file)

      if (!text.trim()) {
        setFileError('Could not read text from this resume. Try another file.')
        return
      }

      setResumeText(text)
    } catch (err) {
      setFileError(err.message || 'Failed to read resume.')
    }
  }

  const callGroq = async (msgs) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY

    if (!apiKey) {
      throw new Error('Missing VITE_GROQ_API_KEY in .env')
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: msgs,
        max_tokens: 1200,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error?.message || 'Groq request failed.')
    }

    return data.choices?.[0]?.message?.content || 'No response received.'
  }

  const generateQuestions = async () => {
    if (!resumeText.trim()) return

    setAiLoading(true)
    setGenerated(true)

    const history = [
      {
        role: 'system',
        content: `You are a senior technical interviewer. Based on the candidate's resume provided by the recruiter, generate targeted interview questions grouped by category (Technical Skills, Projects, Problem Solving, Culture Fit). Be specific to their actual skills and projects. Keep each question concise.`,
      },
      {
        role: 'user',
        content: `Here is the candidate's resume:\n\n${resumeText}\n\nGenerate a structured list of interview questions.`,
      },
    ]

    conversationRef.current = history

    try {
      const reply = await callGroq(history)
      const assistantMsg = { role: 'assistant', content: reply }
      conversationRef.current = [...history, assistantMsg]
      setMessages([assistantMsg])
    } catch (err) {
      setMessages([
        {
          role: 'assistant',
          content: err.message || 'Failed to generate questions. Check your Groq API key and try again.',
        },
      ])
    } finally {
      setAiLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || aiLoading) return

    const userText = input.trim()
    setInput('')

    const newUserMsg = { role: 'user', content: userText }
    const updatedHistory = [...conversationRef.current, newUserMsg]
    conversationRef.current = updatedHistory
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    setAiLoading(true)

    try {
      const reply = await callGroq(updatedHistory)
      const assistantMsg = { role: 'assistant', content: reply }
      conversationRef.current = [...updatedHistory, assistantMsg]
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: err.message || 'Something went wrong. Try again.',
        },
      ])
    } finally {
      setAiLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', minHeight: '600px' }}>

      {/* Left panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Candidate list */}
        <div className="card" style={{ padding: '20px' }}>
          <p style={{
            fontSize: '12px', fontFamily: 'var(--font-mono)',
            color: 'var(--text-dim)', letterSpacing: '0.08em',
            textTransform: 'uppercase', marginBottom: '12px',
          }}>
            Candidate
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {candidates.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>No candidates found.</p>
            ) : (
              candidates.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCandidate(c)
                    setResumeFile(null)
                    setResumeText('')
                    setMessages([])
                    setGenerated(false)
                    setFileError('')
                    conversationRef.current = []
                  }}
                  onMouseEnter={e => {
                    if (selectedCandidate?.id !== c.id) {
                      e.currentTarget.style.border = '1px solid #2563EB60'
                      e.currentTarget.style.background = '#2563EB08'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={e => {
                    if (selectedCandidate?.id !== c.id) {
                      e.currentTarget.style.border = '1px solid var(--border)'
                      e.currentTarget.style.background = 'var(--surface2)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius)',
                    border: `1px solid ${selectedCandidate?.id === c.id ? '#2563EB' : 'var(--border)'}`,
                    background: selectedCandidate?.id === c.id ? '#2563EB15' : 'var(--surface2)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedCandidate?.id === c.id ? '0 0 0 1px #2563EB40, 0 0 12px #2563EB15' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: selectedCandidate?.id === c.id
                      ? 'linear-gradient(135deg, #2563EB, #06B6D4)'
                      : 'linear-gradient(135deg, #1E2D45, #2563EB40)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'white',
                    flexShrink: 0,
                  }}>
                    {c.fullName?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{
                      fontWeight: '700',
                      fontSize: '13px',
                      color: selectedCandidate?.id === c.id ? '#60A5FA' : 'var(--text)',
                    }}>
                      {c.fullName}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text-dim)',
                      fontFamily: 'var(--font-mono)',
                      marginTop: '2px',
                    }}>
                      {c.email}
                    </div>
                  </div>

                  {/* Selected dot */}
                  {selectedCandidate?.id === c.id && (
                    <div style={{
                      marginLeft: 'auto',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#2563EB',
                      boxShadow: '0 0 8px #2563EB80',
                    }} />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Resume upload card */}
        {selectedCandidate && (
          <div className="card" style={{ padding: '20px' }}>
            <p style={{
              fontSize: '12px', fontFamily: 'var(--font-mono)',
              color: 'var(--text-dim)', letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: '12px',
            }}>
              Resume
            </p>

            {/* Drag-and-drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]) }}
              onClick={() => document.getElementById('rs-file-input').click()}
              style={{
                border: `2px dashed ${dragOver ? '#2563EB' : resumeFile ? '#10B98160' : 'var(--border)'}`,
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? '#2563EB08' : 'var(--surface2)',
                transition: 'all 0.2s ease',
                marginBottom: resumeFile ? '12px' : 0,
              }}
            >
              <input
                id="rs-file-input"
                type="file"
                accept=".pdf,.docx,.txt"
                style={{ display: 'none' }}
                onChange={e => handleFileSelect(e.target.files[0])}
              />
              {resumeFile ? (
                <>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>📄</div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text)', margin: '0 0 2px', wordBreak: 'break-all' }}>{resumeFile.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0 }}>click to change</p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '20px', marginBottom: '4px' }}>⬆️</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '0 0 2px' }}>Drop resume here</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: 0 }}>PDF, TXT, DOCX</p>
                </>
              )}
            </div>

            {fileError && (
              <p style={{ fontSize: '12px', color: '#F87171', marginTop: '8px', marginBottom: '0' }}>{fileError}</p>
            )}

            {resumeFile && !generated && (
              <button
                onClick={generateQuestions}
                disabled={aiLoading}
                style={{
                  width: '100%', padding: '10px',
                  borderRadius: '10px', border: 'none',
                  background: aiLoading ? 'var(--surface2)' : '#2563EB',
                  color: aiLoading ? 'var(--text-dim)' : 'white',
                  fontSize: '13px', fontWeight: '600',
                  cursor: aiLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-display)',
                  transition: 'all 0.2s ease',
                  marginTop: '12px',
                }}
              >
                {aiLoading ? 'Generating...' : 'Generate Questions'}
              </button>
            )}

            {resumeFile && generated && (
              <button
                onClick={() => {
                  setResumeFile(null)
                  setResumeText('')
                  setMessages([])
                  setGenerated(false)
                  setFileError('')
                  conversationRef.current = []
                }}
                style={{
                  width: '100%', padding: '10px',
                  borderRadius: '10px', border: '1px solid var(--border)',
                  background: 'var(--surface2)', color: 'var(--text-dim)',
                  fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'var(--font-display)',
                  marginTop: '12px',
                }}
              >
                Upload New Resume
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right — chat panel */}
      <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>

        {!selectedCandidate ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Select a candidate to begin</p>
          </div>
        ) : !resumeFile ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '8px' }}>
            <div style={{ fontSize: '32px' }}>📋</div>
            <p style={{ color: 'var(--text-dim)', fontSize: '14px', margin: 0 }}>Upload {selectedCandidate.fullName}'s resume to generate questions</p>
            <p style={{ color: 'var(--text-faint)', fontSize: '12px', fontFamily: 'var(--font-mono)', margin: 0 }}>PDF, TXT, or DOCX</p>
          </div>
        ) : !generated ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
            <div style={{ fontSize: '32px' }}>📄</div>
            <p style={{ color: 'var(--text)', fontSize: '14px', fontWeight: '600', margin: 0 }}>{resumeFile.name}</p>
            <p style={{ color: 'var(--text-dim)', fontSize: '13px', margin: 0 }}>Ready — click Generate Questions</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: '700', fontSize: '15px', margin: 0 }}>{selectedCandidate.fullName}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>{resumeFile.name}</p>
              </div>
              <span style={{
                padding: '4px 10px', borderRadius: '6px',
                background: '#10B98115', border: '1px solid #10B98140',
                fontSize: '11px', fontWeight: '600', color: '#10B981',
                fontFamily: 'var(--font-mono)',
              }}>AI Ready</span>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', maxHeight: '420px',
              display: 'flex', flexDirection: 'column', gap: '12px',
              marginBottom: '16px',
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: msg.role === 'user' ? '#2563EB20' : 'var(--surface2)',
                    border: `1px solid ${msg.role === 'user' ? '#2563EB40' : 'var(--border)'}`,
                    fontSize: '13px', lineHeight: 1.7,
                    color: 'var(--text)', whiteSpace: 'pre-wrap',
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {aiLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: '12px 12px 12px 4px',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    fontSize: '13px', color: 'var(--text-dim)',
                  }}>
                    Thinking<span style={{ animation: 'blink 1s infinite' }}>...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMessage() }}
                placeholder="Ask follow-up, request more questions..."
                style={{
                  flex: 1, padding: '12px 14px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)', color: 'var(--text)',
                  fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || aiLoading}
                className="btn-primary"
                style={{ padding: '12px 20px', fontSize: '14px', flexShrink: 0 }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
