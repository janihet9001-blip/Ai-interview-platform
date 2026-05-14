export default function StatCard({ title, value }) {
  return (
    <div style={styles.card}>
      <h4>{title}</h4>

      <h2>{value}</h2>
    </div>
  )
}

const styles = {
  card: {
    background: '#1e293b',
    color: 'white',
    padding: '28px',
    borderRadius: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }
}