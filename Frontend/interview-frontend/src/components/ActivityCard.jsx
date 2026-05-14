export default function ActivityCard({
  title,
  score
}) {
  return (
    <div style={styles.card}>
      <h3>{title}</h3>

      <p>AI Score: {score}</p>
    </div>
  )
}

const styles = {
  card: {
    background: 'white',
    padding: '22px',
    borderRadius: '16px',
    marginBottom: '15px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
  }
}