import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import PropTypes from 'prop-types';

function cleanMarkdown(text) {
  if (!text) return text;
  return text
    .replace(/###\s*/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

cleanMarkdown.propTypes = { text: PropTypes.string };

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-dark:         #0A0C12;
    --bg-darker:       #06080D;
    --bg-surface:      #0F121A;
    --bg-surface-light:#151A24;
    --border:          rgba(255,255,255,0.05);
    --border-light:    rgba(255,255,255,0.08);
    --text:            #E8EDF2;
    --text-dim:        #8E9AA8;
    --text-muted:      #4A5568;
    --font-mono:       'JetBrains Mono', monospace;
    --font-display:    'Inter', system-ui, sans-serif;
    --font-body:       'Inter', system-ui, sans-serif;
    --radius:          12px;
  }

  body, #root {
    background: linear-gradient(135deg, #0A0C12 0%, #06080D 100%);
    color: var(--text);
    font-family: var(--font-body);
    min-height: 100vh;
  }

  /* ── scene bg ── */
  .rs-scene-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 60% 40% at 20% 10%, rgba(30,40,60,0.25) 0%, transparent 55%),
      radial-gradient(ellipse 50% 35% at 85% 80%, rgba(20,30,50,0.2) 0%, transparent 60%);
  }

  /* ── top nav ── */
  .rs-nav {
    display: flex; justify-content: space-between; align-items: center;
    padding: 0 36px; height: 64px;
    background: rgba(10,12,18,0.85);
    border-bottom: 1px solid rgba(255,255,255,0.05);
    position: sticky; top: 0; z-index: 100;
    backdrop-filter: blur(20px);
  }
  .rs-logo-text {
    font-family: var(--font-display); font-weight: 800; font-size: 18px;
    background: linear-gradient(110deg, #FFFFFF 20%, #8E9AA8 45%, #FFFFFF 70%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: rs-shimmer 4s linear infinite; letter-spacing: -0.02em;
  }
  .rs-badge {
    font-size: 9px; font-weight: 600; font-family: monospace;
    border-radius: 20px; padding: 2px 10px; letter-spacing: 0.06em;
    background: rgba(255,255,255,0.05); color: #9CA3AF;
    border: 1px solid rgba(255,255,255,0.08);
  }

  /* ── inner ── */
  .rs-inner {
    position: relative; z-index: 1;
    max-width: 860px; margin: 0 auto;
    padding: 36px 32px 80px;
    animation: rs-fadeUp 0.5s ease forwards;
  }

  /* ── page heading ── */
  .rs-page-heading {
    font-family: var(--font-display); font-size: 32px; font-weight: 800;
    background: linear-gradient(110deg, #FFFFFF 25%, #8E9AA8 50%, #FFFFFF 75%);
    background-size: 200% auto;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    animation: rs-shimmer 5s linear infinite; letter-spacing: -0.03em;
  }

  /* ── panel ── */
  .rs-panel {
    background: linear-gradient(145deg, #0F121A 0%, rgba(15,18,26,0.95) 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; overflow: hidden;
    position: relative; isolation: isolate;
    transition: border-color 0.2s, transform 0.2s;
  }
  .rs-panel::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle 180px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, transparent 70%);
    opacity: 0; transition: opacity 0.25s ease; pointer-events: none;
  }
  .rs-panel:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-1px); }
  .rs-panel:hover::before { opacity: 1; }

  /* ── retrying bar ── */
  .rs-retrying {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; margin-bottom: 20px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
    font-family: var(--font-mono); font-size: 11px; color: #9CA3AF;
    letter-spacing: 0.05em;
    animation: rs-pulse-border 2s ease-in-out infinite;
  }
  .rs-retrying-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #D1D5DB; flex-shrink: 0;
    box-shadow: 0 0 6px rgba(209,213,219,0.4);
    animation: rs-pulse-dot 1.5s ease-in-out infinite;
  }

  /* ── question card ── */
  .rs-qcard {
    background: linear-gradient(145deg, #0F121A 0%, rgba(15,18,26,0.95) 100%);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; overflow: hidden;
    position: relative; isolation: isolate;
    transition: border-color 0.2s, transform 0.2s;
    animation: rs-fadeUp 0.5s ease both;
  }
  .rs-qcard::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle 200px at var(--mouse-x,50%) var(--mouse-y,50%), rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 40%, transparent 70%);
    opacity: 0; transition: opacity 0.25s ease; pointer-events: none;
  }
  .rs-qcard:hover { border-color: rgba(255,255,255,0.14); transform: translateY(-2px); }
  .rs-qcard:hover::before { opacity: 1; }

  /* ── loading ── */
  .rs-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; gap: 16px; position: relative; z-index: 1;
  }
  .rs-loading-ring {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.08);
    border-top-color: rgba(255,255,255,0.5);
    animation: rs-spin 1s linear infinite;
  }
  .rs-loading-text {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: 0.1em; color: #6B7280; text-transform: uppercase;
  }

  /* ── btn ghost ── */
  .rs-btn-ghost {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px; color: #9CA3AF; cursor: pointer;
    font-family: var(--font-body); font-size: 12px;
    padding: 6px 16px; transition: all 0.25s ease;
  }
  .rs-btn-ghost:hover {
    border-color: rgba(255,255,255,0.25); color: #E5E7EB;
    background: rgba(255,255,255,0.05);
  }

  /* ── scrollbar ── */
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }

  /* ── keyframes ── */
  @keyframes rs-spin    { to { transform: rotate(360deg); } }
  @keyframes rs-fadeUp  { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rs-shimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
  @keyframes rs-pulse-dot { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
  @keyframes rs-pulse-border {
    0%,100% { border-color: rgba(255,255,255,0.06); }
    50%      { border-color: rgba(255,255,255,0.18); }
  }
`;

export default function Results() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    window.history.replaceState(null, '', window.location.href)
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => { window.history.pushState(null, '', window.location.href) }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  useEffect(() => {
    if (!document.getElementById('rs-styles')) {
      const el = document.createElement('style')
      el.id = 'rs-styles'
      el.textContent = STYLES
      document.head.appendChild(el)
    }
    return () => { const el = document.getElementById('rs-styles'); if (el) el.remove() }
  }, [])

  const fetchResults = useCallback(async (attempt = 1) => {
    if (!sessionId) { setError('No session ID provided'); setLoading(false); return }
    try {
      const res = await API.get(`/interview/${sessionId}/questions`)
      const data = res.data || []
      if (data.length === 0 && attempt === 1) { setError('No results found for this session.'); setLoading(false); return }
      setAllQuestions(data); setLoading(false); setError(null)
      const pendingEval = data.some(q => q.userAnswer && !q.aiFeedback)
      if (pendingEval && attempt < 6) { setRetrying(true); timeoutRef.current = setTimeout(() => fetchResults(attempt + 1), 2000) }
      else { setRetrying(false) }
    } catch (err) {
      console.error('Failed to fetch results:', err)
      if (err.response?.status === 404) setError('Session not found. Please check the URL.')
      else if (err.response?.status === 403) setError('You do not have permission to view these results.')
      else setError('Failed to load results. Please try again.')
      setLoading(false); setRetrying(false)
    }
  }, [sessionId])

  useEffect(() => { fetchResults() }, [fetchResults])

  const answeredQuestions = allQuestions.filter(q => q.userAnswer && q.userAnswer.trim() !== "")

  const getScoreStyle = useCallback((score) => {
    if (score == null) return { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' }
    if (score >= 8)  return { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)' }
    if (score >= 5)  return { color: '#E5E7EB', bg: 'rgba(229,231,235,0.08)', border: 'rgba(229,231,235,0.2)' }
    if (score >= 3)  return { color: '#D1D5DB', bg: 'rgba(209,213,219,0.08)', border: 'rgba(209,213,219,0.2)' }
    return           { color: '#F87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)' }
  }, [])

  const getCardAccent = useCallback((score) => {
    if (score == null) return 'rgba(255,255,255,0.1)'
    if (score >= 8)  return 'rgba(16,185,129,0.4)'
    if (score >= 5)  return 'rgba(229,231,235,0.3)'
    if (score >= 3)  return 'rgba(209,213,219,0.2)'
    return           'rgba(248,113,113,0.4)'
  }, [])

  const trackMouse = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mouse-x', `${((e.clientX - r.left) / r.width) * 100}%`)
    e.currentTarget.style.setProperty('--mouse-y', `${((e.clientY - r.top) / r.height) * 100}%`)
  }

  // ── error state ──
  if (error) return (
    <>
      <style>{STYLES}</style>
      <div className="rs-scene-bg" />
      <nav className="rs-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#FFFFFF,#8E9AA8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px', color: '#0A0C12', boxShadow: '0 0 12px rgba(255,255,255,0.2)' }}>AI</div>
          <span className="rs-logo-text">InterviewAI</span>
        </div>
      </nav>
      <div className="rs-inner" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
        <div className="rs-panel" style={{ maxWidth: '420px', width: '100%', padding: '32px', textAlign: 'center', borderColor: 'rgba(248,113,113,0.25)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#F87171', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>Error Loading Results</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', lineHeight: '1.6' }}>{error}</p>
          <button className="rs-btn-ghost" style={{ width: '100%', padding: '10px' }} onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </div>
      </div>
    </>
  )

  // ── loading state ──
  if (loading) return (
    <>
      <style>{STYLES}</style>
      <div className="rs-scene-bg" />
      <div className="rs-loading">
        <div className="rs-loading-ring" />
        <p className="rs-loading-text">Loading results</p>
      </div>
    </>
  )

  // ── no answers ──
  if (answeredQuestions.length === 0) return (
    <>
      <style>{STYLES}</style>
      <div className="rs-scene-bg" />
      <nav className="rs-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#FFFFFF,#8E9AA8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '11px', color: '#0A0C12', boxShadow: '0 0 12px rgba(255,255,255,0.2)' }}>AI</div>
          <span className="rs-logo-text">InterviewAI</span>
        </div>
      </nav>
      <div className="rs-inner" style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
        <div className="rs-panel" style={{ maxWidth: '420px', width: '100%', padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#D1D5DB', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>No Answers Found</h2>
          <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '24px', lineHeight: '1.6' }}>No answers were recorded for this interview session.</p>
          <button className="rs-btn-ghost" style={{ width: '100%', padding: '10px' }} onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </div>
      </div>
    </>
  )

  // ── compute summary stats ──
  const scored = answeredQuestions.filter(q => q.score != null)
  const totalScore  = scored.reduce((s, q) => s + q.score, 0)
  const maxScore    = scored.length * 10
  const scorePct    = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : null
  const { color: pctColor } = getScoreStyle(scorePct != null ? Math.round(scorePct / 10) : null)

  return (
    <>
      <style>{STYLES}</style>
      <div className="rs-scene-bg" />

      {/* Navbar */}
      <nav className="rs-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#FFFFFF,#8E9AA8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: '11px', color: '#0A0C12', boxShadow: '0 0 12px rgba(255,255,255,0.2)', flexShrink: 0 }}>AI</div>
          <span className="rs-logo-text">InterviewAI</span>
          <span className="rs-badge" style={{ marginLeft: '4px' }}>Results</span>
        </div>
        <button className="rs-btn-ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
      </nav>

      <div className="rs-inner">

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'rgba(220,222,230,0.5)', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: '8px' }}>Session Complete</p>
          <h1 className="rs-page-heading">Interview Results</h1>
        </div>

        {/* Summary stats row */}
        {scored.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Questions', val: answeredQuestions.length, raw: true },
              { label: 'Scored',    val: scored.length,            raw: true },
              { label: 'Total',     val: `${totalScore} / ${maxScore}`, raw: true },
              { label: 'Score',     val: scorePct != null ? `${scorePct}%` : '—', highlight: true },
            ].map(({ label, val, highlight }) => (
              <div key={label} style={{ textAlign: 'center', padding: '10px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', minWidth: '80px' }}>
                <div style={{ fontSize: '9px', color: '#6B7280', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: highlight ? pctColor : '#E5E7EB', fontFamily: 'var(--font-display)' }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Retrying notice */}
        {retrying && (
          <div className="rs-retrying">
            <span className="rs-retrying-dot" />
            AI is still evaluating some answers — refreshing automatically...
          </div>
        )}

        {/* Question cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {answeredQuestions.map((q, index) => {
            const questionText = q.questiontext || q.questionText || 'Unknown'
            const userAnswer   = q.userAnswer || null
            const aiFeedback   = cleanMarkdown(q.aiFeedback) || null
            const score        = q.score
            const scoreStyle   = getScoreStyle(score)
            const accentColor  = getCardAccent(score)

            return (
              <div
                key={q.id || index}
                className="rs-qcard"
                style={{ animationDelay: `${0.05 + index * 0.06}s`, borderLeft: `3px solid ${accentColor}` }}
                onMouseMove={trackMouse}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px 0', marginBottom: '12px' }}>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#9CA3AF', background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    Q{String(index + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: '700', padding: '3px 12px', borderRadius: '20px', color: scoreStyle.color, background: scoreStyle.bg, border: `1px solid ${scoreStyle.border}` }}>
                    {score != null ? `${score} / 10` : 'N/A'}
                  </span>
                </div>

                {/* Question text */}
                <p style={{ fontSize: '14px', color: '#D1D5DB', lineHeight: '1.6', margin: '0 0 0', padding: '0 18px 14px', paddingLeft: '20px', borderLeft: '2px solid rgba(255,255,255,0.08)', marginLeft: '18px', marginRight: '18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {questionText}
                </p>

                {/* Answer section */}
                <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Your Answer</p>
                  <p style={{ fontSize: '13px', color: userAnswer ? '#D1D5DB' : '#4B5563', lineHeight: '1.65', whiteSpace: 'pre-wrap', fontStyle: userAnswer ? 'normal' : 'italic' }}>
                    {userAnswer || '— No answer provided —'}
                  </p>
                </div>

                {/* Feedback section */}
                <div style={{ padding: '12px 18px', background: 'rgba(255,255,255,0.015)' }}>
                  <p style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>AI Feedback</p>
                  <p style={{ fontSize: '13px', color: '#C4CAD6', lineHeight: '1.65', whiteSpace: 'pre-wrap', fontStyle: aiFeedback ? 'normal' : 'italic' }}>
                    {aiFeedback
                      ? aiFeedback
                      : retrying
                        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#6B7280', animation: 'rs-pulse-dot 1.5s ease-in-out infinite', display: 'inline-block' }}>Evaluating...</span>
                        : <span style={{ color: '#4B5563' }}>No feedback available</span>
                    }
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center' }}>
          <button className="rs-btn-ghost" style={{ padding: '10px 28px', fontSize: '13px' }} onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </button>
        </div>

      </div>
    </>
  )
}