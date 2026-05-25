import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

  :root {
    --bg-primary: #F8FAFC;
    --bg-secondary: #FFFFFF;
    --bg-tertiary: #F1F5F9;
    --accent-50: #EEF2FF;
    --accent-100: #E0E7FF;
    --accent-200: #C7D2FE;
    --accent-500: #6366F1;
    --accent-600: #4F46E5;
    --accent-700: #4338CA;
    --text-primary: #0F172A;
    --text-secondary: #334155;
    --text-tertiary: #64748B;
    --text-quaternary: #94A3B8;
    --border-light: #E2E8F0;
    --border-medium: #CBD5E1;
    --border-focus: #818CF8;
    --success: #10B981;
    --success-bg: #ECFDF5;
    --error: #EF4444;
    --error-bg: #FEF2F2;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04);
    --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);
    --shadow-3d: 0 20px 60px rgba(99,102,241,0.12), 0 8px 20px rgba(0,0,0,0.06);
    --shadow-3d-hover: 0 30px 80px rgba(99,102,241,0.18), 0 12px 30px rgba(0,0,0,0.1);
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 16px;
    --radius-xl: 20px;
    --transition-fast: 150ms ease;
    --transition-base: 200ms ease;
    --transition-smooth: 300ms cubic-bezier(0.4,0,0.2,1);
    --transition-spring: 400ms cubic-bezier(0.34,1.56,0.64,1);
  }

  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

  html, body, #root {
    width: 100%;
    height: 100%;
    background: var(--bg-primary);
  }

  .login-page {
    min-height: 100vh;
    width: 100vw;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #F0F4FF 0%, #EEF2FF 25%, #E8EDFF 50%, #EEF2FF 75%, #F0F4FF 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .canvas-3d-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
  }

  .bg-orb {
    position: fixed;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(80px);
  }

  .bg-orb-tl {
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(99,102,241,0.13) 0%, rgba(129,140,248,0.05) 45%, transparent 70%);
    top: -200px; left: -150px;
    animation: orbDrift1 11s ease-in-out infinite;
  }
  .bg-orb-tr {
    width: 550px; height: 550px;
    background: radial-gradient(circle, rgba(139,92,246,0.10) 0%, rgba(99,102,241,0.04) 45%, transparent 70%);
    top: -180px; right: -150px;
    animation: orbDrift2 13s ease-in-out infinite;
  }
  .bg-orb-bl {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(167,139,250,0.04) 45%, transparent 70%);
    bottom: -180px; left: -120px;
    animation: orbDrift3 15s ease-in-out infinite;
  }
  .bg-orb-br {
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(129,140,248,0.10) 0%, rgba(99,102,241,0.04) 45%, transparent 70%);
    bottom: -190px; right: -130px;
    animation: orbDrift4 12s ease-in-out infinite;
  }
  .bg-orb-c {
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(99,102,241,0.05) 0%, rgba(129,140,248,0.02) 45%, transparent 70%);
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    animation: orbPulse 8s ease-in-out infinite;
  }

  @keyframes orbDrift1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(50px,40px) scale(1.15); }
    66% { transform: translate(-20px,25px) scale(0.9); }
  }
  @keyframes orbDrift2 {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(-45px,35px) scale(1.2); }
    66% { transform: translate(25px,-20px) scale(0.85); }
  }
  @keyframes orbDrift3 {
    0%,100% { transform: translate(0,0) scale(1); }
    40% { transform: translate(40px,-35px) scale(1.1); }
    70% { transform: translate(-15px,20px) scale(0.95); }
  }
  @keyframes orbDrift4 {
    0%,100% { transform: translate(0,0) scale(1); }
    35% { transform: translate(-35px,-30px) scale(1.18); }
    65% { transform: translate(20px,25px) scale(0.88); }
  }
  @keyframes orbPulse {
    0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
    50% { transform: translate(-50%,-50%) scale(1.25); opacity: 0.7; }
  }

  .bg-grid-pattern {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 0;
    opacity: 0.18;
    background-image:
      linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .floating-shapes {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .float-shape {
    position: absolute;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(99,102,241,0.09), rgba(129,140,248,0.04));
    animation: shapeFloat linear infinite;
  }

  @keyframes shapeFloat {
    0%   { transform: translateY(110vh) translateX(0) rotate(0deg) scale(0); opacity: 0; }
    5%   { opacity: 0.5; }
    50%  { opacity: 0.3; }
    95%  { opacity: 0.05; }
    100% { transform: translateY(-10vh) translateX(var(--drift-x,50px)) rotate(var(--rotation,360deg)) scale(1.2); opacity: 0; }
  }

  .light-sweep {
    position: fixed;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: linear-gradient(
      115deg,
      transparent 30%,
      rgba(99,102,241,0.03) 45%,
      rgba(129,140,248,0.05) 50%,
      rgba(99,102,241,0.03) 55%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 0;
    animation: sweepAcross 10s ease-in-out infinite;
  }

  @keyframes sweepAcross {
    0%,100% { transform: translateX(-60%) skewX(-15deg); opacity: 0; }
    20%     { opacity: 1; }
    50%     { transform: translateX(60%) skewX(-15deg); opacity: 1; }
    80%     { opacity: 0; }
  }

  .login-container {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 440px;
    animation: cardEntry3D 0.9s cubic-bezier(0.16,1,0.3,1) both;
    transform-style: preserve-3d;
  }

  @keyframes cardEntry3D {
    from {
      opacity: 0;
      transform: translateY(50px) rotateX(14deg) rotateY(-6deg) scale(0.9);
      filter: blur(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0) rotateX(0) rotateY(0) scale(1);
      filter: blur(0);
    }
  }

  .auth-card {
    background: rgba(255,255,255,0.94);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-xl);
    padding: 44px 40px 36px;
    box-shadow: var(--shadow-3d);
    transform-style: preserve-3d;
    transition: all var(--transition-smooth);
    position: relative;
    overflow: hidden;
  }

  .auth-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-500), var(--accent-200), transparent);
    opacity: 0;
    transition: opacity var(--transition-smooth);
  }

  .auth-card:hover { transform: translateY(-6px) rotateX(2deg); box-shadow: var(--shadow-3d-hover); border-color: var(--accent-200); }
  .auth-card:hover::before { opacity: 1; }

  .card-shine {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at var(--mouse-x,50%) var(--mouse-y,50%), rgba(99,102,241,0.07) 0%, transparent 60%);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }
  .auth-card:hover .card-shine { opacity: 1; }
  .card-content { position: relative; z-index: 1; }

  .brand-section { text-align: center; margin-bottom: 36px; }

  .logo-icon {
    width: 52px; height: 52px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #6366F1, #4F46E5);
    border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 6px 20px rgba(99,102,241,0.35);
    transition: all var(--transition-spring);
    cursor: pointer;
    position: relative;
  }
  .logo-icon::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 20px;
    border: 2px solid transparent;
    border-top-color: rgba(99,102,241,0.35);
    border-right-color: rgba(99,102,241,0.18);
    animation: logoSpin 4s linear infinite;
  }
  @keyframes logoSpin { to { transform: rotate(360deg); } }
  .logo-icon:hover { transform: scale(1.1) rotate(8deg); box-shadow: 0 10px 30px rgba(99,102,241,0.5); }
  .logo-icon:active { transform: scale(0.95) rotate(0deg); transition: all 0.1s ease; }
  .logo-icon svg { width: 28px; height: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }

  .brand-name {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 28px; font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.5px;
    margin-bottom: 4px;
  }
  .brand-accent {
    background: linear-gradient(135deg, #6366F1, #818CF8, #6366F1);
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradientShift 3s ease infinite;
  }
  @keyframes gradientShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  .brand-tagline { font-size: 14px; color: var(--text-tertiary); font-weight: 400; }

  .form { display: flex; flex-direction: column; gap: 20px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    font-size: 13px; font-weight: 600;
    color: var(--text-secondary);
    letter-spacing: -0.1px;
    transition: all var(--transition-fast);
  }
  .field:focus-within .field-label { color: var(--accent-500); transform: translateX(2px); }
  .input-wrap { position: relative; }
  .input {
    width: 100%;
    padding: 13px 16px;
    background: var(--bg-primary);
    border: 1.5px solid var(--border-light);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-family: 'Inter', sans-serif;
    font-size: 14px; font-weight: 500;
    outline: none;
    transition: all var(--transition-base);
  }
  .input::placeholder { color: var(--text-quaternary); font-weight: 400; }
  .input:hover { border-color: var(--border-medium); box-shadow: var(--shadow-sm); }
  .input:focus {
    border-color: var(--border-focus);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 4px rgba(99,102,241,0.07), 0 4px 12px rgba(99,102,241,0.1);
    transform: translateY(-2px);
  }
  .input-padding-right { padding-right: 44px; }

  .toggle-password {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    background: none; border: none;
    color: var(--text-quaternary);
    cursor: pointer; padding: 8px; border-radius: 8px;
    display: flex; align-items: center;
    transition: all var(--transition-fast);
  }
  .toggle-password:hover { color: var(--accent-500); background: var(--accent-50); }
  .toggle-password:active { transform: translateY(-50%) scale(0.85); }

  .row { display: flex; align-items: center; justify-content: space-between; }
  .remember { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
  .checkbox {
    width: 20px; height: 20px;
    border: 2px solid var(--border-medium);
    border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    transition: all var(--transition-spring);
    flex-shrink: 0;
    background: var(--bg-primary);
  }
  .checkbox.active {
    background: linear-gradient(135deg, #6366F1, #4F46E5);
    border-color: transparent;
    box-shadow: 0 0 0 4px rgba(99,102,241,0.12);
    transform: scale(1.1);
  }
  .remember-text { font-size: 13px; color: var(--text-tertiary); font-weight: 500; transition: color var(--transition-fast); }
  .remember:hover .remember-text { color: var(--text-secondary); }

  .forgot-link {
    background: none; border: none;
    font-family: 'Inter', sans-serif;
    font-size: 13px; font-weight: 600;
    color: var(--accent-500); cursor: pointer;
    transition: all var(--transition-fast);
    padding: 4px 8px; border-radius: 6px; position: relative;
  }
  .forgot-link::after {
    content: ''; position: absolute;
    bottom: 0; left: 8px; right: 8px;
    height: 1.5px; background: var(--accent-500);
    transform: scaleX(0); transition: transform var(--transition-base);
  }
  .forgot-link:hover { color: var(--accent-700); background: var(--accent-50); }
  .forgot-link:hover::after { transform: scaleX(1); }

  .error-box {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    background: var(--error-bg);
    border: 1px solid rgba(239,68,68,0.25);
    border-left: 3px solid var(--error);
    border-radius: var(--radius-md);
    color: var(--error);
    font-size: 13px; font-weight: 500;
    animation: errorShake 0.5s ease;
    box-shadow: 0 2px 8px rgba(239,68,68,0.06);
  }
  @keyframes errorShake {
    0%,100% { transform: translateX(0); }
    15% { transform: translateX(-8px); }
    30% { transform: translateX(8px); }
    45% { transform: translateX(-5px); }
    60% { transform: translateX(5px); }
    75% { transform: translateX(-2px); }
    90% { transform: translateX(2px); }
  }
  .error-icon { flex-shrink: 0; }

  .submit-btn {
    width: 100%; padding: 14px;
    background: linear-gradient(135deg, #6366F1, #4F46E5);
    border: none; border-radius: var(--radius-md);
    color: white;
    font-family: 'Inter', sans-serif;
    font-size: 15px; font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-smooth);
    box-shadow: 0 4px 16px rgba(99,102,241,0.28);
    display: flex; align-items: center; justify-content: center; gap: 10px;
    letter-spacing: 0.3px;
    position: relative; overflow: hidden;
  }
  .submit-btn::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    transition: left 0.7s ease;
  }
  .submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4F46E5, #4338CA);
    box-shadow: 0 8px 30px rgba(99,102,241,0.42), 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  .submit-btn:hover:not(:disabled)::before { left: 100%; }
  .submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.97); transition: all 0.1s ease; box-shadow: 0 2px 8px rgba(99,102,241,0.2); }
  .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

  .spinner {
    width: 18px; height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .divider { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
  .divider-line { flex: 1; height: 1px; background: var(--border-light); }
  .divider-text { font-size: 12px; color: var(--text-quaternary); font-weight: 500; }

  .register-row { text-align: center; margin-bottom: 20px; }
  .register-text { font-size: 14px; color: var(--text-tertiary); }
  .register-link {
    color: var(--accent-500); font-weight: 600;
    text-decoration: none; margin-left: 4px;
    transition: all var(--transition-fast);
    padding: 2px 6px; border-radius: 6px; position: relative;
  }
  .register-link::after {
    content: ''; position: absolute;
    bottom: 0; left: 6px; right: 6px;
    height: 1.5px; background: var(--accent-500);
    transform: scaleX(0); transition: transform var(--transition-base);
  }
  .register-link:hover { color: var(--accent-700); background: var(--accent-50); }
  .register-link:hover::after { transform: scaleX(1); }

  .features { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .feature-badge {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px;
    background: var(--accent-50);
    border: 1px solid var(--accent-100);
    border-radius: 100px;
    font-size: 11px; color: var(--accent-600); font-weight: 600;
    letter-spacing: 0.2px;
    transition: all var(--transition-smooth);
    cursor: default;
  }
  .feature-badge:hover { background: var(--accent-100); border-color: var(--accent-200); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(99,102,241,0.12); }
  .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent-500); flex-shrink: 0; box-shadow: 0 0 6px rgba(99,102,241,0.3); }

  .footer-text { text-align: center; font-size: 12px; color: var(--text-quaternary); line-height: 1.6; }
  .footer-link { color: var(--text-tertiary); cursor: pointer; font-weight: 500; transition: all var(--transition-fast); position: relative; }
  .footer-link::after {
    content: ''; position: absolute;
    bottom: -1px; left: 0; right: 0;
    height: 1px; background: var(--accent-500);
    transform: scaleX(0); transition: transform var(--transition-base);
  }
  .footer-link:hover { color: var(--accent-500); }
  .footer-link:hover::after { transform: scaleX(1); }

  @media (max-width: 480px) {
    .auth-card { padding: 32px 20px 28px; border-radius: var(--radius-lg); }
    .brand-name { font-size: 24px; }
    .login-container { padding: 0; }
    .features { gap: 6px; }
    .feature-badge { padding: 5px 10px; font-size: 10px; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`

function use3DBackground(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId
    const particles = []
    const PARTICLE_COUNT = 100
    const CONNECTION_DIST = 150
    const MOUSE_RADIUS = 200

    let mouseX = -1000, mouseY = -1000
    let targetMouseX = -1000, targetMouseY = -1000
    let currentWidth = window.innerWidth
    let currentHeight = window.innerHeight

    class Particle {
      constructor() {
        this.reset(true)
      }

      reset(initial = false) {
        this.x = initial ? Math.random() * currentWidth : Math.random() * currentWidth
        this.y = initial ? Math.random() * currentHeight : Math.random() * currentHeight
        this.z = Math.random() * 3 + 0.5
        this.baseRadius = Math.random() * 2.5 + 1.2
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.35
        this.opacity = Math.random() * 0.4 + 0.12
        this.hue = Math.random() * 25 + 230
      }

      update() {
        this.x += this.speedX * this.z
        this.y += this.speedY * this.z
        if (this.x < -60) this.x = currentWidth + 60
        if (this.x > currentWidth + 60) this.x = -60
        if (this.y < -60) this.y = currentHeight + 60
        if (this.y > currentHeight + 60) this.y = -60
      }

      draw(ctx, time) {
        const r = this.baseRadius * this.z
        const pulse = Math.sin(time * 0.0015 + this.x * 0.008 + this.y * 0.008) * 0.2 + 0.8
        const alpha = this.opacity * pulse
        
        ctx.beginPath()
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue},78%,64%,${alpha})`
        ctx.fill()

        if (r > 1.6) {
          const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 5)
          glow.addColorStop(0, `hsla(${this.hue},78%,64%,${alpha * 0.45})`)
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.beginPath()
          ctx.arc(this.x, this.y, r * 5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      currentWidth = window.innerWidth
      currentHeight = window.innerHeight
      canvas.width = currentWidth * dpr
      canvas.height = currentHeight * dpr
      canvas.style.width = currentWidth + 'px'
      canvas.style.height = currentHeight + 'px'
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
      
      particles.length = 0
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle())
      }
    }

    resize()
    window.addEventListener('resize', resize)

    const handleMouseMove = (e) => { 
      targetMouseX = e.clientX
      targetMouseY = e.clientY
    }
    const handleMouseLeave = () => { 
      targetMouseX = -1000
      targetMouseY = -1000
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    const animate = (ts) => {
      mouseX += (targetMouseX - mouseX) * 0.08
      mouseY += (targetMouseY - mouseY) * 0.08
      
      ctx.clearRect(0, 0, currentWidth, currentHeight)

      particles.forEach(p => { 
        p.update()
        p.draw(ctx, ts) 
      })

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < CONNECTION_DIST) {
            const op = (1 - dist / CONNECTION_DIST) * 0.14
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(99,102,241,${op})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }

      // Mouse interaction
      if (mouseX > 0 && mouseY > 0) {
        particles.forEach(p => {
          const dx = p.x - mouseX
          const dy = p.y - mouseY
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MOUSE_RADIUS) {
            const op = (1 - dist / MOUSE_RADIUS) * 0.22
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouseX, mouseY)
            ctx.strokeStyle = `rgba(99,102,241,${op})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
        
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(99,102,241,0.35)'
        ctx.fill()
        
        const mg = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, MOUSE_RADIUS * 0.4)
        mg.addColorStop(0, 'rgba(99,102,241,0.07)')
        mg.addColorStop(1, 'transparent')
        ctx.fillStyle = mg
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, MOUSE_RADIUS * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [canvasRef])
}

function Canvas3DBackground() {
  const ref = useRef(null)
  use3DBackground(ref)
  return <canvas ref={ref} className="canvas-3d-bg" />
}

function FloatingShapes() {
  const shapes = useMemo(() => {
    const arr = []
    for (let i = 0; i < 18; i++) {
      arr.push({
        id: i,
        left: Math.random() * 100 + '%',
        size: Math.random() * 45 + 12 + 'px',
        duration: Math.random() * 22 + 14 + 's',
        delay: -(Math.random() * 20) + 's',
        driftX: (Math.random() - 0.5) * 140 + 'px',
        rotation: Math.random() * 720 + 'deg',
      })
    }
    return arr
  }, [])

  return (
    <div className="floating-shapes">
      {shapes.map(s => (
        <div
          key={s.id}
          className="float-shape"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            animationDuration: s.duration,
            animationDelay: s.delay,
            '--drift-x': s.driftX,
            '--rotation': s.rotation,
          }}
        />
      ))}
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const cardRef = useRef(null)
  const { login } = useAuth()

  useEffect(() => {
    if (!document.getElementById('3d-login-styles')) {
      const el = document.createElement('style')
      el.id = '3d-login-styles'
      el.textContent = STYLES
      document.head.appendChild(el)
    }
    return () => { document.getElementById('3d-login-styles')?.remove() }
  }, [])

  useEffect(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    cardRef.current.style.setProperty('--mouse-x', x + '%')
    cardRef.current.style.setProperty('--mouse-y', y + '%')
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return
    cardRef.current.style.setProperty('--mouse-x', '50%')
    cardRef.current.style.setProperty('--mouse-y', '50%')
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      login(
        { id: data.id, email: data.email, fullName: data.fullName, role: data.role },
        data.token
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.')
      setLoading(false)
    }
  }, [email, password, login])

  const features = useMemo(() => ['SOC2 Compliant', '256-bit Encryption', '99.9% Uptime'], [])

  return (
    <div className="login-page">
      <Canvas3DBackground />
      <div className="bg-orb bg-orb-tl" />
      <div className="bg-orb bg-orb-tr" />
      <div className="bg-orb bg-orb-bl" />
      <div className="bg-orb bg-orb-br" />
      <div className="bg-orb bg-orb-c" />
      <div className="bg-grid-pattern" />
      <div className="light-sweep" />
      <FloatingShapes />

      <div className="login-container">
        <div
          ref={cardRef}
          className="auth-card"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <div className="card-shine" />
          <div className="card-content">
            <div className="brand-section">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L14.5 7.5L20 8L16 12.5L17 18L12 15L7 18L8 12.5L4 8L9.5 7.5L12 2Z" fill="white" />
                </svg>
              </div>
              <h1 className="brand-name">
                Interview<span className="brand-accent">AI</span>
              </h1>
              <p className="brand-tagline">Sign in to your account</p>
            </div>

            <form className="form" onSubmit={handleSubmit} autoComplete="off">
              <div className="field">
                <label className="field-label">Email address</label>
                <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>

              <div className="field">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <input type={showPass ? 'text' : 'password'} className="input input-padding-right" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                  <button type="button" className="toggle-password" onClick={() => setShowPass(prev => !prev)} tabIndex={-1} aria-label={showPass ? 'Hide password' : 'Show password'}>
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="row">
                <div className="remember" onClick={() => setRemember(prev => !prev)}>
                  <div className={`checkbox${remember ? ' active' : ''}`}>
                    {remember && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4l3 3 5-6" /></svg>}
                  </div>
                  <span className="remember-text">Remember me</span>
                </div>
                <button type="button" className="forgot-link">Forgot password?</button>
              </div>

              {error && (
                <div className="error-box">
                  <svg className="error-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  {error}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading && <div className="spinner" />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div className="divider"><div className="divider-line" /><span className="divider-text">or</span><div className="divider-line" /></div>

            <div className="register-row">
              <span className="register-text">Don&apos;t have an account?<Link to="/register" className="register-link">Create one</Link></span>
            </div>

            <div className="features">
              {features.map((item) => (<div key={item} className="feature-badge"><span className="badge-dot" />{item}</div>))}
            </div>

            <p className="footer-text">By signing in, you agree to our <span className="footer-link">Terms of Service</span> and <span className="footer-link">Privacy Policy</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}