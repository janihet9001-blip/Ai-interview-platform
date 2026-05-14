import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Results() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [sessionId]);

  const fetchResults = async (attempt = 1) => {
    try {
      const res = await API.get(`/interview/${sessionId}/questions`)
      const data = res.data || []
      setAllQuestions(data)
      setLoading(false)

      const pendingEval = data.some(q => q.userAnswer && !q.aiFeedback)
      if (pendingEval && attempt < 6) {
        setRetrying(true)
        setTimeout(() => fetchResults(attempt + 1), 2000)
      } else {
        setRetrying(false)
      }
    } catch (err) {
      console.error('Failed to fetch results', err)
      setLoading(false)
      setRetrying(false)
    }
  }

  // FILTER: Only show questions that have an answer
  const answeredQuestions = allQuestions.filter(q => q.userAnswer && q.userAnswer.trim() !== "");
  const unansweredCount = allQuestions.length - answeredQuestions.length;

  const totalScore = answeredQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
  const maxScore = answeredQuestions.length * 10;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const strongAnswers = answeredQuestions.filter(q => (q.score || 0) >= 7).length;

  const getScoreColor = (score) => {
    if (!score && score !== 0) return "#64748b";
    if (score >= 8) return "#22c55e";
    if (score >= 5) return "#f59e0b";
    return "#ef4444";
  };

  const getGrade = (pct) => {
    if (pct >= 80) return { grade: "Excellent", color: "#22c55e" };
    if (pct >= 60) return { grade: "Good", color: "#3b82f6" };
    if (pct >= 40) return { grade: "Average", color: "#f59e0b" };
    return { grade: "Needs Practice", color: "#ef4444" };
  };

  const { grade, color } = getGrade(percentage);

  if (loading) return (
    <div style={styles.center}>
      <p style={{ color: "#94a3b8" }}>Loading results...</p>
    </div>
  );

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <h1 style={styles.title}>Interview Results</h1>
        <p style={styles.subtitle}>
          {answeredQuestions.length} Answered • {unansweredCount} Unanswered • Total {allQuestions.length} Questions
        </p>
      </div>

      <div style={styles.scoreCard}>
        <div style={styles.scoreCircle}>
          <span style={{ ...styles.scoreNumber, color }}>
            {percentage}%
          </span>
          <span style={styles.scoreLabel}>Overall Score</span>
        </div>
        <div style={styles.scoreDetails}>
          <div style={{ ...styles.gradeBadge, background: color }}>
            {grade}
          </div>
          <p style={styles.scoreText}>
            {totalScore} / {maxScore} points
          </p>
          <p style={styles.scoreText}>
            {strongAnswers} strong answers
          </p>
        </div>
      </div>

      {retrying && (
        <div style={{
          textAlign: 'center', padding: '12px',
          color: '#F97316', fontSize: '13px',
          fontFamily: 'monospace',
          marginBottom: '16px',
          background: '#F9731610',
          border: '1px solid #F9731640',
          borderRadius: '8px',
        }}>
          ⏳ AI is evaluating your answers, please wait...
        </div>
      )}

      <div style={styles.questionsList}>
        {answeredQuestions.map((q, index) => {
          const questionText = q.questiontext || q.questionText || "Unknown";
          const userAnswer = q.userAnswer || null;
          const aiFeedback = q.aiFeedback || null;
          const score = q.score;

          return (
            <div key={q.id} style={styles.questionCard}>

              <div style={styles.questionHeader}>
                <span style={styles.questionNumber}>Q{index + 1}</span>
                <div style={{
                  ...styles.scoreTag,
                  background: getScoreColor(score)
                }}>
                  {score != null ? `${score} / 10` : 'N/A'}
                </div>
              </div>

              <p style={styles.questionText}>
                {questionText}
              </p>

              <div style={styles.section}>
                <span style={styles.sectionLabel}>Your Answer</span>
                <p style={styles.answerText}>
                  {userAnswer}
                </p>
              </div>

              <div style={{ ...styles.section, background: "#1e293b" }}>
                <span style={{ ...styles.sectionLabel, color: "#818cf8" }}>
                  🤖 AI Feedback
                </span>
                <p style={{ ...styles.answerText, color: "#cbd5e1" }}>
                  {aiFeedback
                    ? aiFeedback
                    : retrying
                      ? "Evaluating..."
                      : "No feedback available"
                  }
                </p>
              </div>

            </div>
          );
        })}
      </div>

      {/* Show message if some questions were unanswered */}
      {unansweredCount > 0 && (
        <div style={{
          textAlign: 'center', padding: '16px',
          background: '#F9731610', border: '1px solid #F9731640',
          borderRadius: '12px', marginTop: '20px'
        }}>
          <p style={{ fontSize: '13px', color: '#F97316', fontFamily: 'monospace', margin: 0 }}>
            ℹ️ {unansweredCount} question(s) were not answered and are not shown in results.
          </p>
        </div>
      )}

      <div style={styles.buttons}>
        <button
          style={styles.btnPrimary}
          onClick={() => navigate("/waiting")}
        >
          Start New Interview
        </button>
        <button
          style={styles.btnSecondary}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0f172a",
    padding: "2rem",
    color: "#f1f5f9",
    fontFamily: "Inter, sans-serif",
    maxWidth: "800px",
    margin: "0 auto",
  },
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "#0f172a",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#f1f5f9",
    margin: 0,
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: "0.5rem",
  },
  scoreCard: {
    background: "#1e293b",
    borderRadius: "16px",
    padding: "2rem",
    display: "flex",
    alignItems: "center",
    gap: "2rem",
    marginBottom: "2rem",
    border: "1px solid #334155",
    flexWrap: "wrap",
  },
  scoreCircle: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "120px",
  },
  scoreNumber: {
    fontSize: "3rem",
    fontWeight: "800",
    lineHeight: 1,
  },
  scoreLabel: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    marginTop: "0.25rem",
  },
  scoreDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  gradeBadge: {
    display: "inline-block",
    padding: "0.25rem 1rem",
    borderRadius: "999px",
    color: "white",
    fontWeight: "600",
    fontSize: "0.875rem",
    width: "fit-content",
  },
  scoreText: {
    color: "#94a3b8",
    margin: 0,
    fontSize: "0.9rem",
  },
  questionsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  questionCard: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "1.5rem",
    border: "1px solid #334155",
  },
  questionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  questionNumber: {
    background: "#334155",
    color: "#94a3b8",
    padding: "0.2rem 0.75rem",
    borderRadius: "999px",
    fontSize: "0.8rem",
    fontWeight: "600",
  },
  scoreTag: {
    padding: "0.2rem 0.75rem",
    borderRadius: "999px",
    color: "white",
    fontWeight: "700",
    fontSize: "0.85rem",
  },
  questionText: {
    color: "#f1f5f9",
    fontWeight: "500",
    marginBottom: "1rem",
    lineHeight: 1.6,
  },
  section: {
    background: "#0f172a",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "0.75rem",
  },
  sectionLabel: {
    color: "#64748b",
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: "0.5rem",
  },
  answerText: {
    color: "#94a3b8",
    margin: 0,
    lineHeight: 1.6,
    fontSize: "0.9rem",
  },
  buttons: {
    display: "flex",
    gap: "1rem",
    marginTop: "2rem",
    justifyContent: "center",
  },
  btnPrimary: {
    background: "#6366f1",
    color: "white",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1rem",
  },
  btnSecondary: {
    background: "#334155",
    color: "#f1f5f9",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "1rem",
  },
};