import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

// ─── WebGL Liquid Background ─────────────────────────────────────────────────
// Matches Framer "AnimatedLiquidBackground" Prism preset:
//   color1:#050505  color2:#66B3FF  color3:#FFFFFF
//   swirl:50  softness:47  speed:30  distortion:0
// Technique: domain-warped fBm (same underlying warpFragmentShader approach)

const VERT_SRC = `
  attribute vec2 a_pos;
  void main(){ gl_Position = vec4(a_pos,0.0,1.0); }
`

const FRAG_SRC = `
  precision highp float;
  uniform float u_time;
  uniform vec2  u_res;

  // --- value noise
  float hash(vec2 p){
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 74.9898);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(hash(i),            hash(i+vec2(1,0)), f.x),
      mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x),
    f.y);
  }

  // --- rotation
  vec2 rot2(vec2 p, float a){
    float c=cos(a), s=sin(a);
    return vec2(c*p.x-s*p.y, s*p.x+c*p.y);
  }

  // --- fBm
  float fbm(vec2 p){
    float v=0.0, a=0.5;
    for(int i=0;i<7;i++){
      v += a * vnoise(p);
      p  = rot2(p, 0.4) * 2.03;
      a *= 0.49;
    }
    return v;
  }

  void main(){
    vec2 uv  = gl_FragCoord.xy / u_res;
    float asp = u_res.x / u_res.y;
    vec2  p   = vec2(uv.x * asp, uv.y);

    float t = u_time * 0.10;          // slow, like Framer speed:30

    // Two rounds of domain warping → the swirly/liquid look
    vec2 q = vec2(
      fbm(p + t + vec2(0.00, 0.00)),
      fbm(p + t + vec2(5.20, 1.30))
    );
    vec2 r = vec2(
      fbm(p + 3.5*q + t*0.7 + vec2(1.70, 9.20)),
      fbm(p + 3.5*q + t*0.5 + vec2(8.30, 2.80))
    );
    float f = fbm(p + 4.0*r + t*0.3);

    // soften (Framer softness:47 → gentle S-curve)
    f = f * 0.5 + 0.5;
    f = smoothstep(0.05, 0.95, f);

    // ── Colour stops matching Framer "Prism" preset ──────────────────────────
    //  #050505  →  #66B3FF  →  #FFFFFF
    vec3 col0 = vec3(0.020, 0.020, 0.021); // #050505
    vec3 col1 = vec3(0.060, 0.100, 0.260); // deep navy bridge
    vec3 col2 = vec3(0.160, 0.380, 0.720); // mid blue
    vec3 col3 = vec3(0.400, 0.702, 1.000); // #66B3FF
    vec3 col4 = vec3(0.720, 0.870, 1.000); // light powder
    vec3 col5 = vec3(0.960, 0.970, 1.000); // ~#FFFFFF

    vec3 col;
    float s = clamp(f, 0.0, 1.0) * 5.0;
    if      (s < 1.0) col = mix(col0, col1, s);
    else if (s < 2.0) col = mix(col1, col2, s-1.0);
    else if (s < 3.0) col = mix(col2, col3, s-2.0);
    else if (s < 4.0) col = mix(col3, col4, s-3.0);
    else              col = mix(col4, col5, s-4.0);

    // subtle radial vignette
    float v = 1.0 - dot(uv-0.5, uv-0.5)*1.1;
    col *= clamp(v, 0.35, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`

function LiquidCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) return

    const mkShader = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src); gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   VERT_SRC))
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG_SRC))
    gl.linkProgram(prog); gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes  = gl.getUniformLocation(prog, 'u_res')

    let raf
    const t0 = performance.now()

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      gl.uniform1f(uTime, (performance.now() - t0) / 1000)
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      gl.deleteProgram(prog)
      gl.deleteBuffer(buf)
    }
  }, [])

  return <canvas ref={ref} style={{ position:'fixed', inset:0, width:'100%', height:'100%', zIndex:0, display:'block' }} />
}

// ─── Login Page ───────────────────────────────────────────────────────────────
export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused,  setFocused]  = useState('')
  const { login } = useAuth()

  useEffect(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    if (!document.getElementById('__li_styles__')) {
      const st = document.createElement('style')
      st.id = '__li_styles__'
      st.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes __spin__ { to { transform:rotate(360deg); } }
        .__spin__ { display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,0.28);border-top-color:#fff;border-radius:50%;animation:__spin__ 0.7s linear infinite; }
        input:-webkit-autofill,input:-webkit-autofill:focus {
          -webkit-box-shadow:0 0 0 1000px rgba(3,3,5,0.97) inset !important;
          -webkit-text-fill-color:rgba(255,255,255,0.88) !important;
          caret-color:#fff;
        }
      `
      document.head.appendChild(st)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login({ id: data.id, email: data.email, fullName: data.fullName, role: data.role }, data.token)
    } catch {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  const inp = (name) => ({
    width: '100%', height: '46px', boxSizing: 'border-box',
    background: focused === name ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${focused === name ? 'rgba(147,197,253,0.48)' : 'rgba(255,255,255,0.11)'}`,
    borderRadius: '13px',
    padding: name === 'pass' ? '0 44px 0 15px' : '0 15px',
    fontSize: '14px', color: 'rgba(255,255,255,0.88)',
    fontFamily: "'DM Sans',system-ui,sans-serif", outline: 'none',
    boxShadow: focused === name ? '0 0 0 3px rgba(99,102,241,0.14)' : 'none',
    transition: 'border-color .2s, background .2s, box-shadow .2s',
  })

  const lbl = {
    display:'flex', alignItems:'center', gap:'6px',
    fontSize:'11px', fontWeight:500, color:'rgba(255,255,255,0.38)',
    letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'7px',
  }

  return (
    <div style={{
      position:'relative', minHeight:'100vh', display:'flex',
      alignItems:'center', justifyContent:'center',
      background:'#050505', overflow:'hidden', padding:'2rem 1rem',
      fontFamily:"'DM Sans',system-ui,sans-serif",
    }}>

      <LiquidCanvas />

      {/* Glass card */}
      <div style={{
        position:'relative', zIndex:10, width:'100%', maxWidth:'420px',
        background:'linear-gradient(135deg,rgba(255,255,255,0.11) 0%,rgba(255,255,255,0.04) 55%,rgba(255,255,255,0.08) 100%)',
        backdropFilter:'blur(28px) saturate(160%)', WebkitBackdropFilter:'blur(28px) saturate(160%)',
        borderRadius:'26px', border:'1px solid rgba(255,255,255,0.16)',
        boxShadow:'0 0 0 1px rgba(255,255,255,0.04) inset,0 32px 72px rgba(0,0,0,0.65),0 8px 24px rgba(80,140,255,0.10)',
        padding:'44px 40px 36px', overflow:'hidden',
      }}>

        {/* pearl sheen */}
        <div style={{ position:'absolute', top:'-50%', left:'-20%', width:'140%', height:'70%', background:'radial-gradient(ellipse at 35% 40%,rgba(180,215,255,0.08) 0%,transparent 65%)', pointerEvents:'none', zIndex:0 }} />

        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'30px', position:'relative', zIndex:1 }}>
          <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#3b82f6,#6366f1)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Sora',sans-serif", fontSize:'13px', fontWeight:600, color:'#fff', letterSpacing:'-0.5px', boxShadow:'0 4px 16px rgba(99,102,241,0.45)', flexShrink:0 }}>
            AI
          </div>
          <span style={{ fontFamily:"'Sora',sans-serif", fontSize:'18px', fontWeight:600, color:'rgba(255,255,255,0.95)', letterSpacing:'-0.3px' }}>
            Interview<span style={{ color:'#93c5fd' }}>AI</span>
          </span>
        </div>

        <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:'26px', fontWeight:600, color:'#fff', letterSpacing:'-0.5px', marginBottom:'6px', position:'relative', zIndex:1 }}>Welcome back.</h1>
        <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.36)', letterSpacing:'0.2px', marginBottom:'26px', position:'relative', zIndex:1 }}>Secure access &bull; premium experience</p>

        <form onSubmit={handleLogin} style={{ position:'relative', zIndex:1 }}>

          {/* Email */}
          <div style={{ marginBottom:'15px' }}>
            <label style={lbl}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 7 10-7"/></svg>
              Email address
            </label>
            <input type="email" style={inp('email')} placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} required />
          </div>

          {/* Password */}
          <div style={{ marginBottom:'15px' }}>
            <label style={lbl}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Password
            </label>
            <div style={{ position:'relative' }}>
              <input type={showPass ? 'text' : 'password'} style={inp('pass')} placeholder="··········" value={password}
                onChange={e => setPassword(e.target.value)} onFocus={() => setFocused('pass')} onBlur={() => setFocused('')} required />
              <button type="button" tabIndex={-1} onClick={() => setShowPass(p => !p)}
                style={{ position:'absolute', right:'13px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.30)', padding:'4px', display:'flex', alignItems:'center' }}>
                {showPass
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Remember / Forgot */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
            <label onClick={() => setRemember(p => !p)}
              style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize:'13px', color:'rgba(255,255,255,0.42)', userSelect:'none' }}>
              <div style={{ width:'17px', height:'17px', borderRadius:'5px', flexShrink:0, border: remember ? '1px solid rgba(37,99,235,0.9)' : '1px solid rgba(255,255,255,0.16)', background: remember ? 'rgba(37,99,235,0.62)' : 'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
                {remember && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4l2.5 2.5L9 1"/></svg>}
              </div>
              Remember me
            </label>
            <button type="button" style={{ background:'none', border:'none', cursor:'pointer', fontSize:'13px', color:'rgba(147,197,253,0.62)', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
              Forgot password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.24)', borderRadius:'12px', padding:'10px 14px', fontSize:'13px', color:'rgba(252,165,165,0.88)', marginBottom:'15px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{ width:'100%', height:'50px', borderRadius:'15px', border:'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily:"'Sora',system-ui,sans-serif", fontSize:'14px', fontWeight:600, letterSpacing:'0.2px', background:'linear-gradient(135deg,#2563eb 0%,#6366f1 100%)', color:'#fff', opacity: loading ? 0.72 : 1, boxShadow:'0 4px 22px rgba(99,102,241,0.48),0 1px 0 rgba(255,255,255,0.13) inset', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
            {loading && <span className="__spin__" />}
            {loading ? 'Signing in…' : 'Sign in to InterviewAI'}
          </button>

        </form>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'20px 0 16px', position:'relative', zIndex:1 }}>
          <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.24)' }}>or</span>
          <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Register */}
        <p style={{ textAlign:'center', fontSize:'13px', color:'rgba(255,255,255,0.34)', marginBottom:'22px', position:'relative', zIndex:1 }}>
          No account yet?{' '}
          <Link to="/register" style={{ color:'rgba(147,197,253,0.80)', textDecoration:'none', fontWeight:500 }}>Create one free →</Link>
        </p>

        {/* Trust badges */}
        <div style={{ display:'flex', justifyContent:'center', gap:'8px', flexWrap:'wrap', marginBottom:'14px', position:'relative', zIndex:1 }}>
          {[
            { svg:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(147,197,253,0.60)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, t:'End-to-end encrypted' },
            { svg:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(147,197,253,0.60)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>, t:'Zero-trust secure' },
            { svg:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(147,197,253,0.60)" strokeWidth="2"><path d="M20 12v6H4v-6M12 2v12m-3-3 3 3 3-3"/></svg>, t:'Premium AI' },
          ].map(({ svg, t }) => (
            <span key={t} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'rgba(255,255,255,0.26)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'4px 10px' }}>
              {svg}{t}
            </span>
          ))}
        </div>

        {/* Footer */}
        <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,0.17)', lineHeight:'1.6', position:'relative', zIndex:1 }}>
          By signing in you agree to our{' '}
          <span style={{ color:'rgba(147,197,253,0.36)', cursor:'pointer' }}>Terms of Service</span>{' '}and{' '}
          <span style={{ color:'rgba(147,197,253,0.36)', cursor:'pointer' }}>Privacy Policy</span>.
        </p>

      </div>
    </div>
  )
}