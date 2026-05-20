import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

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

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ─── DESIGN TOKENS ─────────────────────────────────────────────── */
  :root {
    /* Backgrounds */
    --bg-page:       #07091a;
    --bg-card:       rgba(10, 14, 35, 0.88);
    --bg-section:    rgba(8, 12, 30, 0.6);
    --bg-hover:      rgba(20, 30, 70, 0.5);

    /* Borders */
    --border-subtle:  rgba(50, 80, 200, 0.18);
    --border-default: rgba(60, 100, 230, 0.28);
    --border-strong:  rgba(80, 130, 255, 0.45);
    --border-glow:    rgba(90, 140, 255, 0.6);

    /* Brand blues */
    --blue-400:  #4f8cff;
    --blue-500:  #3a7af0;
    --blue-600:  #2560e0;
    --blue-glow: rgba(79, 140, 255, 0.3);
    --blue-faint:rgba(79, 140, 255, 0.12);

    /* Text */
    --text-primary:   #e8eeff;
    --text-secondary: rgba(180, 200, 255, 0.75);
    --text-muted:     rgba(120, 150, 220, 0.55);
    --text-feedback:  rgba(170, 190, 255, 0.85);

    /* Scores */
    --score-excellent: #22c55e;
    --score-good:      #4f8cff;
    --score-average:   #f59e0b;
    --score-poor:      #ef4444;

    /* Misc */
    --radius-card:  20px;
    --radius-badge: 100px;
    --radius-tag:   100px;
  }

  .rs-page {
    min-height: 100vh;
    background: var(--bg-page);
    font-family: 'Inter', sans-serif;
    color: var(--text-primary);
    position: relative;
    overflow-x: hidden;
  }

  /* ── Background layers ── */
  .rs-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 100% 60% at 50% 0%,
        rgba(30, 60, 200, 0.22) 0%,
        rgba(10, 25, 100, 0.10) 40%,
        transparent 70%
      ),
      radial-gradient(ellipse 70% 40% at 80% 100%,
        rgba(20, 50, 180, 0.10) 0%,
        transparent 60%
      ),
      var(--bg-page);
  }
  .rs-beam {
    position: fixed; z-index: 0; pointer-events: none;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 600px; height: 45vh;
    background: conic-gradient(
      from -8deg at 50% 0%,
      transparent 0deg,
      rgba(60, 120, 255, 0.0)  18deg,
      rgba(60, 120, 255, 0.18) 25deg,
      rgba(100, 160, 255, 0.28) 30deg,
      rgba(60, 120, 255, 0.12) 35deg,
      rgba(60, 120, 255, 0.0)  42deg,
      transparent 60deg
    );
    filter: blur(2px);
    animation: rsBeamBreath 10s ease-in-out infinite;
  }
  @keyframes rsBeamBreath {
    0%,100% { opacity: 0.7; }
    50%      { opacity: 1; }
  }
  .rs-grain {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    opacity: 0.35; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
    background-size: 160px;
  }
  .rs-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(60, 120, 255, 0.028) 1px, transparent 1px),
      linear-gradient(90deg, rgba(60, 120, 255, 0.028) 1px, transparent 1px);
    background-size: 72px 72px;
    mask-image: radial-gradient(ellipse 90% 80% at 50% 50%, black 10%, transparent 80%);
  }

  /* ── Content ── */
  .rs-inner {
    position: relative; z-index: 1;
    max-width: 820px; margin: 0 auto;
    padding: 3rem 1.5rem 5rem;
    animation: rsFadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes rsFadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Header ── */
  .rs-header {
    text-align: center; margin-bottom: 2.5rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border-subtle);
    position: relative;
  }
  .rs-header::after {
    content: '';
    position: absolute; bottom: -1px; left: 20%; right: 20%; height: 1px;
    background: linear-gradient(90deg, transparent, var(--blue-400), transparent);
    opacity: 0.5;
  }
  .rs-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 10px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .rs-eyebrow::before, .rs-eyebrow::after {
    content: ''; flex: 0 0 28px; height: 1px;
    background: var(--border-default);
  }
  .rs-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: clamp(2rem, 5vw, 2.8rem); font-weight: 800;
    color: var(--text-primary); letter-spacing: -0.8px;
    text-shadow: 0 0 80px rgba(79, 140, 255, 0.25);
  }

  /* ── Score card ── */
  .rs-score-card {
    background: var(--bg-card);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-card); padding: 2.2rem 2.4rem;
    margin-bottom: 2rem;
    display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap;
    backdrop-filter: blur(24px);
    box-shadow:
      0 0 0 1px var(--blue-faint),
      0 1px 0 rgba(79, 140, 255, 0.12) inset,
      0 20px 60px rgba(0, 0, 0, 0.6);
    position: relative; overflow: hidden;
    animation: rsFadeUp 0.75s cubic-bezier(0.16,1,0.3,1) 0.1s both;
  }
  .rs-score-card::before {
    content: '';
    position: absolute; top: 0; left: 12%; right: 12%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(79, 140, 255, 0.55), transparent);
  }
  .rs-score-glow {
    position: absolute; top: -40px; left: -40px;
    width: 200px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, rgba(30, 70, 220, 0.14), transparent 70%);
    pointer-events: none;
  }
  .rs-score-circle {
    display: flex; flex-direction: column; align-items: center;
    min-width: 130px; position: relative; z-index: 1;
  }
  .rs-score-ring {
    width: 110px; height: 110px; border-radius: 50%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    position: relative;
    background: rgba(255,255,255,0.02);
    border: 2px solid var(--border-subtle);
    box-shadow: 0 0 30px var(--blue-faint), inset 0 0 20px rgba(0,0,0,0.3);
  }
  .rs-score-ring::before {
    content: '';
    position: absolute; inset: -4px; border-radius: 50%;
    background: conic-gradient(var(--score-color) var(--score-pct), rgba(255,255,255,0.05) 0);
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px));
    animation: rsRingIn 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s both;
  }
  @keyframes rsRingIn {
    from { opacity: 0; transform: rotate(-90deg) scale(0.8); }
    to   { opacity: 1; transform: rotate(0deg) scale(1); }
  }
  .rs-score-num {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 2rem; font-weight: 800; line-height: 1;
    color: var(--score-color);
    text-shadow: 0 0 20px var(--score-color);
    animation: rsCountUp 1s cubic-bezier(0.16,1,0.3,1) 0.4s both;
  }
  @keyframes rsCountUp {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1); }
  }
  .rs-score-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; color: var(--text-muted);
    letter-spacing: 1px; margin-top: 3px; text-transform: uppercase;
  }
  .rs-score-info { flex: 1; position: relative; z-index: 1; }
  .rs-grade-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 16px; border-radius: var(--radius-badge);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; font-weight: 700; letter-spacing: 1px;
    text-transform: uppercase; color: #fff; margin-bottom: 14px;
    background: var(--score-color);
    box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 20px var(--score-color-faint);
    animation: rsFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.5s both;
  }
  .rs-grade-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.7);
    animation: rsGradeDot 2s ease-in-out infinite;
  }
  @keyframes rsGradeDot {
    0%,100% { opacity: 1; } 50% { opacity: 0.3; }
  }
  .rs-score-stats {
    display: flex; gap: 1.5rem; flex-wrap: wrap;
  }
  .rs-stat-item {
    display: flex; flex-direction: column; gap: 2px;
  }
  .rs-stat-val {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 1.3rem; font-weight: 700; color: var(--text-primary);
  }
  .rs-stat-lbl {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; color: var(--text-muted);
    letter-spacing: 1px; text-transform: uppercase;
  }

  /* ── Retrying notice ── */
  .rs-retrying {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; margin-bottom: 1.5rem;
    background: var(--blue-faint);
    border: 1px solid var(--border-default); border-radius: 12px;
    font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.5px;
    color: var(--text-secondary);
    animation: rsPulse 2s ease-in-out infinite;
  }
  @keyframes rsPulse {
    0%,100% { border-color: var(--border-subtle); }
    50%      { border-color: var(--border-strong); }
  }
  .rs-retrying-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--blue-400); flex-shrink: 0;
    box-shadow: 0 0 8px var(--blue-400); animation: rsGradeDot 1.5s ease-in-out infinite;
  }

  /* ── Questions list ── */
  .rs-list { display: flex; flex-direction: column; gap: 1rem; }

  .rs-qcard {
    background: var(--bg-card);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-card); overflow: hidden;
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 1px 0 var(--blue-faint) inset;
    transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
    animation: rsFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both;
  }
  .rs-qcard:hover {
    border-color: var(--border-strong);
    box-shadow: 0 12px 48px rgba(0,0,0,0.5), 0 0 40px var(--blue-faint), 0 1px 0 rgba(79,140,255,0.1) inset;
    transform: translateY(-2px);
  }

  .rs-qcard-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px 0;
  }
  .rs-qnum {
    font-family: 'JetBrains Mono', monospace; font-size: 10px;
    letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text-muted);
    padding: 4px 12px; border-radius: var(--radius-badge);
    background: var(--blue-faint);
    border: 1px solid var(--border-subtle);
  }
  .rs-score-tag {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 13px; font-weight: 800;
    padding: 4px 14px; border-radius: var(--radius-tag); color: #fff;
    background: var(--tag-color);
    box-shadow: 0 2px 12px rgba(0,0,0,0.4), 0 0 16px var(--tag-glow);
  }

  .rs-qtext {
    padding: 12px 20px 16px;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-size: 15px; font-weight: 600; color: var(--text-primary);
    line-height: 1.55; letter-spacing: -0.2px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .rs-section {
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-subtle);
  }
  .rs-section:last-child { border-bottom: none; }
  .rs-section-lbl {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: 2px; text-transform: uppercase;
    margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
  }
  .rs-section-lbl::after {
    content: ''; flex: 1; height: 1px;
    background: linear-gradient(90deg, currentColor, transparent);
    opacity: 0.2;
  }
  .rs-answer-lbl  { color: var(--text-muted); }
  .rs-feedback-lbl { color: rgba(130, 160, 255, 0.8); }
  .rs-section-body {
    font-size: 13.5px; line-height: 1.65; white-space: pre-wrap;
  }
  .rs-answer-body   { color: var(--text-secondary); }
  .rs-feedback-body { color: var(--text-feedback); }
  .rs-evaluating {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    color: var(--text-muted); letter-spacing: 1px;
    animation: rsPulse 1.5s ease-in-out infinite;
  }

  /* ── Loading ── */
  .rs-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 100vh; gap: 16px;
  }
  .rs-loading-ring {
    width: 48px; height: 48px; border-radius: 50%;
    border: 3px solid var(--border-subtle);
    border-top-color: var(--blue-400);
    animation: rsSpin 0.8s linear infinite;
  }
  @keyframes rsSpin { to { transform: rotate(360deg); } }
  .rs-loading-text {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    letter-spacing: 2px; color: var(--text-muted); text-transform: uppercase;
  }

  @media (max-width: 600px) {
    .rs-inner { padding: 2rem 1rem 4rem; }
    .rs-score-card { padding: 1.5rem; gap: 1.5rem; }
    .rs-qcard-header { padding: 14px 16px 0; }
    .rs-qtext { padding: 10px 16px 14px; }
    .rs-section { padding: 12px 16px; }
  }
`;

export default function Results() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!document.getElementById('rs-styles')) {
      const el = document.createElement('style');
      el.id = 'rs-styles';
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    return () => { document.getElementById('rs-styles')?.remove(); };
  }, []);

  useEffect(() => { fetchResults(); }, [sessionId]);

  const fetchResults = async (attempt = 1) => {
    try {
      const res = await API.get(`/interview/${sessionId}/questions`);
      const data = res.data || [];
      setAllQuestions(data);
      setLoading(false);
      const pendingEval = data.some(q => q.userAnswer && !q.aiFeedback);
      if (pendingEval && attempt < 6) {
        setRetrying(true);
        setTimeout(() => fetchResults(attempt + 1), 2000);
      } else {
        setRetrying(false);
      }
    } catch (err) {
      console.error('Failed to fetch results', err);
      setLoading(false);
      setRetrying(false);
    }
  };

  const answeredQuestions = allQuestions.filter(
    q => q.userAnswer && q.userAnswer.trim() !== ""
  );
  const aiAnswered = answeredQuestions.filter(q => Number(q.questionNumber) !== 999);
  const totalScore = aiAnswered.reduce((sum, q) => sum + (q.score || 0), 0);
  const maxScore = aiAnswered.length * 10;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const getScoreColor = (score) => {
    if (!score && score !== 0) return { color: '#64748b', glow: 'rgba(100,116,139,0.3)' };
    if (score >= 8) return { color: 'var(--score-excellent)', glow: 'rgba(34,197,94,0.3)' };
    if (score >= 5) return { color: 'var(--blue-400)', glow: 'var(--blue-glow)' };
    if (score >= 3) return { color: 'var(--score-average)', glow: 'rgba(245,158,11,0.3)' };
    return { color: 'var(--score-poor)', glow: 'rgba(239,68,68,0.3)' };
  };

  const getGrade = (pct) => {
    if (pct >= 80) return { grade: 'Excellent',      color: 'var(--score-excellent)', faint: 'rgba(34,197,94,0.25)' };
    if (pct >= 60) return { grade: 'Good',           color: 'var(--blue-400)',        faint: 'var(--blue-glow)' };
    if (pct >= 40) return { grade: 'Average',        color: 'var(--score-average)',   faint: 'rgba(245,158,11,0.25)' };
    return          { grade: 'Needs Practice',      color: 'var(--score-poor)',      faint: 'rgba(239,68,68,0.25)' };
  };

  const { grade, color: gradeColor, faint: gradeFaint } = getGrade(percentage);
  const scoreAngle = `${Math.round((percentage / 100) * 360)}deg`;

  if (loading) return (
    <div className="rs-page">
      <div className="rs-bg" /><div className="rs-grain" />
      <div className="rs-loading">
        <div className="rs-loading-ring" />
        <p className="rs-loading-text">Loading results</p>
      </div>
    </div>
  );

  return (
    <div className="rs-page">
      <div className="rs-bg" />
      <div className="rs-beam" />
      <div className="rs-grain" />
      <div className="rs-grid" />

      <div className="rs-inner">

        {/* Header */}
        <div className="rs-header">
          <p className="rs-eyebrow">Session complete</p>
          <h1 className="rs-title">Interview Results</h1>
        </div>

        {/* Score card */}
        <div
          className="rs-score-card"
          style={{ '--score-color': gradeColor, '--score-color-faint': gradeFaint, '--score-pct': scoreAngle }}
        >
          <div className="rs-score-glow" />
          <div className="rs-score-circle">
            <div className="rs-score-ring">
              <span className="rs-score-num">{percentage}%</span>
              <span className="rs-score-sub">Score</span>
            </div>
          </div>
          <div className="rs-score-info">
            <div className="rs-grade-badge">
              <span className="rs-grade-dot" />
              {grade}
            </div>
            <div className="rs-score-stats">
              <div className="rs-stat-item">
                <span className="rs-stat-val">{aiAnswered.length}</span>
                <span className="rs-stat-lbl">Questions</span>
              </div>
              <div className="rs-stat-item">
                <span className="rs-stat-val">{totalScore}</span>
                <span className="rs-stat-lbl">Points earned</span>
              </div>
              <div className="rs-stat-item">
                <span className="rs-stat-val">{maxScore}</span>
                <span className="rs-stat-lbl">Max points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Retrying notice */}
        {retrying && (
          <div className="rs-retrying">
            <span className="rs-retrying-dot" />
            AI is still evaluating some answers — refreshing automatically...
          </div>
        )}

        {/* Questions */}
        <div className="rs-list">
          {answeredQuestions.map((q, index) => {
            const questionText = q.questiontext || q.questionText || "Unknown";
            const userAnswer = q.userAnswer || null;
            const aiFeedback = cleanMarkdown(q.aiFeedback) || null;
            const score = q.score;
            const { color: tagColor, glow: tagGlow } = getScoreColor(score);

            return (
              <div
                key={q.id}
                className="rs-qcard"
                style={{ animationDelay: `${0.05 + index * 0.06}s` }}
              >
                <div className="rs-qcard-header">
                  <span className="rs-qnum">Q {String(index + 1).padStart(2, '0')}</span>
                  <span
                    className="rs-score-tag"
                    style={{ '--tag-color': tagColor, '--tag-glow': tagGlow }}
                  >
                    {score != null ? `${score} / 10` : 'N/A'}
                  </span>
                </div>

                <p className="rs-qtext">{questionText}</p>

                <div className="rs-section">
                  <span className="rs-section-lbl rs-answer-lbl">Your Answer</span>
                  <p className="rs-section-body rs-answer-body">{userAnswer}</p>
                </div>

                <div className="rs-section" style={{ background: 'rgba(10, 15, 45, 0.5)' }}>
                  <span className="rs-section-lbl rs-feedback-lbl">AI Feedback</span>
                  <p className="rs-section-body rs-feedback-body">
                    {aiFeedback
                      ? aiFeedback
                      : retrying
                        ? <span className="rs-evaluating">Evaluating...</span>
                        : "No feedback available"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}