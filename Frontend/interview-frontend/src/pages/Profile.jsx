import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import api from '../services/api'

export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    role: 'Full Stack Developer',
    bio: 'Passionate developer preparing for top-tier tech interviews.',
  })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeStatus, setResumeStatus] = useState(null)
  const [resumeMessage, setResumeMessage] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleResumeUpload = async () => {
    if (!resumeFile) return
    setResumeUploading(true)
    setResumeStatus(null)
    const formData = new FormData()
    formData.append('file', resumeFile)
    formData.append('candidateId', user?.id)
    try {
      await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResumeStatus('success')
      setResumeMessage('Resume uploaded successfully!')
    } catch {
      setResumeStatus('error')
      setResumeMessage('Upload failed. Please try again.')
    } finally {
      setResumeUploading(false)
    }
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) setResumeFile(file)
  }

  const BADGES = [
    { label: 'First Interview', desc: 'Completed your first session', earned: true, color: '#e8b45a' },
    { label: 'High Scorer', desc: 'Scored 90%+ in a session', earned: true, color: '#3ddc84' },
    { label: 'Consistent', desc: '5-day streak', earned: true, color: '#06b6d4' },
    { label: 'Polyglot', desc: 'Tried 4+ roles', earned: false, color: '#a78bfa' },
    { label: 'Perfectionist', desc: 'Score 100% in any session', earned: false, color: '#f97316' },
    { label: 'Marathon', desc: 'Complete 20 sessions', earned: false, color: '#ec4899' },
  ]

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: 'var(--surface2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', color: 'var(--text)',
    fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'var(--font-body)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: 'var(--text-dim)', marginBottom: '7px',
    letterSpacing: '0.1em', textTransform: 'uppercase',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)', animation: 'fadeIn 0.4s ease' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Profile hero */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '2rem',
          display: 'flex', alignItems: 'center', gap: '1.5rem',
          marginBottom: '1.5rem', animation: 'fadeUp 0.5s ease both',
        }}>
          <div style={{
            width: '72px', height: '72px', flexShrink: 0,
            background: 'var(--accent)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '28px', color: '#000',
          }}>
            {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.01em', marginBottom: '4px' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '8px' }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: '13 sessions', color: '#e8b45a' },
                { label: 'Avg 79%', color: '#06b6d4' },
                { label: '6-day streak', color: '#3ddc84' },
              ].map(({ label, color }) => (
                <span key={label} style={{
                  padding: '3px 10px',
                  background: `${color}15`, border: `1px solid ${color}30`,
                  borderRadius: '4px', fontSize: '11px', fontWeight: 600, color,
                }}>{label}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', animation: 'fadeUp 0.5s ease 0.05s both' }}>
          {[
            { id: 'profile', label: 'Edit Profile' },
            { id: 'badges', label: 'Badges' },
            { id: 'resume', label: 'Resume' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '10px 18px', background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-dim)',
              fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 400,
              cursor: 'pointer', marginBottom: '-1px',
              fontFamily: activeTab === tab.id ? 'var(--font-display)' : 'var(--font-body)',
              transition: 'all 0.15s ease',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Edit Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,180,90,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,180,90,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Target Role</label>
              <select
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {['Java Developer', 'React Developer', 'Python Developer', 'Full Stack Developer', 'DevOps Engineer', 'ML Engineer'].map(r => (
                  <option key={r} value={r} style={{ background: 'var(--surface2)' }}>{r}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(232,180,90,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <button
              onClick={handleSave}
              style={{
                padding: '12px 28px',
                background: saved ? '#3ddc84' : 'var(--accent)',
                color: '#000', border: 'none',
                borderRadius: 'var(--radius)',
                fontSize: '14px', fontWeight: 700,
                fontFamily: 'var(--font-display)',
                cursor: 'pointer', letterSpacing: '0.02em',
                transition: 'background 0.3s ease',
              }}
              onMouseEnter={e => { if (!saved) { e.currentTarget.style.background = 'var(--accent2)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,241,118,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
              onMouseLeave={e => { if (!saved) { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' } }}
            >
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', animation: 'fadeUp 0.4s ease both' }}>
            {BADGES.map(({ label, desc, earned, color }) => (
              <div key={label} style={{
                background: 'var(--surface)', border: `1px solid ${earned ? color + '40' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                opacity: earned ? 1 : 0.5,
                transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { if (earned) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}25` } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div style={{
                  width: '40px', height: '40px',
                  background: earned ? `${color}20` : 'var(--surface2)',
                  border: `1px solid ${earned ? color + '40' : 'var(--border)'}`,
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '0.75rem',
                }}>
                  {earned ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: earned ? 'var(--text)' : 'var(--text-dim)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-faint)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Resume Tab */}
        {activeTab === 'resume' && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', animation: 'fadeUp 0.4s ease both' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Upload your resume so it can be used during your interview sessions. Accepted formats: PDF, DOC, DOCX.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('resume-file-input').click()}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent)' : resumeFile ? '#3ddc8460' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                padding: '2.5rem 1rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(232,180,90,0.05)' : resumeFile ? 'rgba(61,220,132,0.04)' : 'var(--surface2)',
                transition: 'all 0.2s ease',
                marginBottom: '1rem',
              }}
            >
              <input
                id="resume-file-input"
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={e => setResumeFile(e.target.files[0] || null)}
              />
              {resumeFile ? (
                <>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', marginBottom: '4px' }}>{resumeFile.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{(resumeFile.size / 1024).toFixed(1)} KB — click to change</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>⬆️</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)', marginBottom: '4px' }}>Drop your resume here</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>or click to browse — PDF, DOC, DOCX</div>
                </>
              )}
            </div>

            <button
              onClick={handleResumeUpload}
              disabled={!resumeFile || resumeUploading}
              style={{
                padding: '12px 28px',
                background: !resumeFile || resumeUploading ? 'var(--surface2)' : 'var(--accent)',
                color: !resumeFile || resumeUploading ? 'var(--text-dim)' : '#000',
                border: `1px solid ${!resumeFile || resumeUploading ? 'var(--border)' : 'transparent'}`,
                borderRadius: 'var(--radius)',
                fontSize: '14px', fontWeight: 700,
                fontFamily: 'var(--font-display)',
                cursor: !resumeFile || resumeUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {resumeUploading ? 'Uploading...' : 'Upload Resume'}
            </button>

            {resumeStatus && (
              <p style={{
                marginTop: '12px', fontSize: '13px',
                color: resumeStatus === 'success' ? '#3ddc84' : '#F87171',
                fontFamily: 'var(--font-mono)',
              }}>
                {resumeMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}