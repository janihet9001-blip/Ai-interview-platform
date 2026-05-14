import { useNavigate } from 'react-router-dom'

export default function RoleCard({ role }) {
  const navigate = useNavigate()

  return (
    <div style={styles.card}>
      <div style={styles.icon}>
        {role.icon}
      </div>

      <h3>{role.label}</h3>

      <p>{role.desc}</p>

      <button
        style={styles.button}
        onClick={() => navigate('/interviews')}
      >
        Start Interview
      </button>
    </div>
  )
}

const styles = {
  card: {
    background: 'white',
    padding: '26px',
    borderRadius: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    textAlign: 'center'
  },

  icon: {
    fontSize: '45px',
    marginBottom: '15px'
  },

  button: {
    marginTop: '18px',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '12px 22px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
}