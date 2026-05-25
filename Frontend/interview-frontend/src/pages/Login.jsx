import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap');

  :root {
    --bg-deep: #0A0A1A;
    --bg-surface: #0F1028;
    --accent-400: #A78BFA;
    --accent-500: #7C3AED;
    --accent-600: #6D28D9;
    --accent-glow: #C4B5FD;
    --cyan-400: #22D3EE;
    --cyan-500: #06B6D4;
    --text-100: #F8FAFC;
    --text-200: #E2E8F0;
    --text-300: #CBD5E1;
    --text-400: #94A3B8;
    --text-500: #64748B;
    --border-100: rgba(167, 139, 250, 0.1);
    --border-200: rgba(167, 139, 250, 0.18);
    --border-300: rgba(167, 139, 250, 0.3);
    --glass-bg: rgba(15, 16, 40, 0.65);
    --error: #EF4444;
    --success: #10B981;
    --radius-sm: 8px;
    --radius-md: 12px;
    --radius-lg: 18px;
    --radius-xl: 24px;
  }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
    background: var(--bg-deep);
    overflow: hidden;
  }

  .cosmic-viewport {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-deep);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
    isolation: isolate;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .nebula-layer {
    position: absolute;
    inset: -20%;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse 70% 50% at 15% 25%, rgba(124, 58, 237, 0.18) 0%, transparent 55%),
      radial-gradient(ellipse 50% 60% at 80% 65%, rgba(6, 182, 212, 0.13) 0%, transparent 55%),
      radial-gradient(ellipse 45% 55% at 50% 45%, rgba(167, 139, 250, 0.08) 0%, transparent 60%),
      radial-gradient(ellipse 65% 45% at 35% 70%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse 55% 50% at 70% 20%, rgba(34, 211, 238, 0.07) 0%, transparent 55%);
    animation: nebulaBreath 18s ease-in-out infinite;
  }

  @keyframes nebulaBreath {
    0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.8; }
    25% { transform: scale(1.08) translate(2%, -1%); opacity: 1; }
    50% { transform: scale(0.95) translate(-1%, 2%); opacity: 0.7; }
    75% { transform: scale(1.05) translate(-2%, -2%); opacity: 0.9; }
  }

  .cosmic-grid {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(167, 139, 250, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(167, 139, 250, 0.04) 1px, transparent 1px);
    background-size: 70px 70px;
    mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, black 20%, transparent 70%);
    -webkit-mask-image: radial-gradient(ellipse 75% 75% at 50% 50%, black 20%, transparent 70%);
  }

  .starfield-canvas {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }

  .cosmic-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
    pointer-events: none;
    z-index: 0;
    will-change: transform;
  }

  .orb-1 {
    width: 450px;
    height: 450px;
    background: rgba(124, 58, 237, 0.15);
    top: -15%;
    left: -8%;
    animation: orbDrift1 22s ease-in-out infinite;
  }

  .orb-2 {
    width: 380px;
    height: 380px;
    background: rgba(6, 182, 212, 0.12);
    bottom: -12%;
    right: -5%;
    animation: orbDrift2 26s ease-in-out infinite;
  }

  .orb-3 {
    width: 320px;
    height: 320px;
    background: rgba(167, 139, 250, 0.1);
    top: 50%;
    left: 55%;
    animation: orbDrift3 20s ease-in-out infinite;
  }

  .orb-4 {
    width: 280px;
    height: 280px;
    background: rgba(34, 211, 238, 0.08);
    top: 20%;
    left: 60%;
    animation: orbDrift1 24s ease-in-out infinite;
    animation-delay: -8s;
  }

  @keyframes orbDrift1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(40px, -35px) scale(1.15); }
    66% { transform: translate(-25px, 20px) scale(0.9); }
  }

  @keyframes orbDrift2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-35px, -30px) scale(1.1); }
    66% { transform: translate(30px, 25px) scale(0.92); }
  }

  @keyframes orbDrift3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(20px, -40px) scale(1.12); }
  }

  .ring-system {
    position: absolute;
    top: 50%;
    left: 50%;
    pointer-events: none;
    z-index: 0;
  }

  .orbital-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    border: 1px solid rgba(167, 139, 250, 0.08);
    transform: translate(-50%, -50%);
    animation: ringSpin linear infinite;
  }

  .ring-1 {
    width: 450px;
    height: 280px;
    animation-duration: 28s;
    border-color: rgba(167, 139, 250, 0.1);
  }

  .ring-2 {
    width: 650px;
    height: 400px;
    animation-duration: 38s;
    animation-direction: reverse;
    border-color: rgba(6, 182, 212, 0.07);
  }

  .ring-3 {
    width: 850px;
    height: 520px;
    animation-duration: 48s;
    border-color: rgba(124, 58, 237, 0.06);
  }

  .ring-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    background: #A78BFA;
    border-radius: 50%;
    box-shadow: 0 0 12px #A78BFA, 0 0 25px rgba(167, 139, 250, 0.5);
  }

  .ring-1 .ring-dot { top: -3px; left: 50%; transform: translateX(-50%); }
  .ring-2 .ring-dot { bottom: -3px; left: 30%; }
  .ring-3 .ring-dot { top: 40%; right: -3px; }

  @keyframes ringSpin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  .vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: radial-gradient(
      ellipse at center,
      transparent 30%,
      rgba(10, 10, 26, 0.3) 50%,
      rgba(10, 10, 26, 0.65) 75%,
      rgba(10, 10, 26, 0.9) 100%
    );
  }

  .scanlines {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.03;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.5) 2px,
      rgba(255, 255, 255, 0.5) 3px
    );
  }

  .shooting-star {
    position: absolute;
    width: 2px;
    height: 60px;
    background: linear-gradient(to bottom, rgba(255,255,255,0.9), transparent);
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    animation: shootStar linear infinite;
  }

  .shoot-1 {
    top: 8%;
    left: 15%;
    transform: rotate(-35deg);
    animation-duration: 4s;
    animation-delay: 0s;
  }

  .shoot-2 {
    top: 12%;
    left: 55%;
    transform: rotate(-28deg);
    animation-duration: 5s;
    animation-delay: 2.5s;
  }

  .shoot-3 {
    top: 5%;
    left: 75%;
    transform: rotate(-40deg);
    animation-duration: 4.5s;
    animation-delay: 5s;
  }

  @keyframes shootStar {
    0% { opacity: 0; }
    3% { opacity: 0.8; }
    8% { opacity: 0; }
    100% { opacity: 0; }
  }

  .dust-particle {
    position: absolute;
    border-radius: 50%;
    background: white;
    z-index: 0;
    pointer-events: none;
    animation: dustRise linear infinite;
  }

  @keyframes dustRise {
    0% { transform: translateY(0) translateX(0); opacity: 0; }
    10% { opacity: 0.7; }
    90% { opacity: 0.2; }
    100% { transform: translateY(-100vh) translateX(var(--drift, 30px)); opacity: 0; }
  }

  .login-stage {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 440px;
    padding: 20px;
    animation: stageEntry 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes stageEntry {
    0% { opacity: 0; transform: translateY(40px) scale(0.94); filter: blur(8px); }
    100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
  }

  .auth-panel {
    position: relative;
    background: rgba(15, 16, 40, 0.6);
    backdrop-filter: blur(50px) saturate(180%);
    -webkit-backdrop-filter: blur(50px) saturate(180%);
    border: 1px solid rgba(167, 139, 250, 0.12);
    border-radius: var(--radius-xl);
    padding: 42px 38px 34px;
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.6),
      0 0 50px rgba(124, 58, 237, 0.1),
      0 0 80px rgba(6, 182, 212, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.03),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3);
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .auth-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(167, 139, 250, 0.4),
      transparent 35%,
      rgba(6, 182, 212, 0.2) 50%,
      transparent 65%,
      rgba(124, 58, 237, 0.3)
    );
    background-size: 300% 300%;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.5;
    animation: borderShimmer 6s ease infinite;
  }

  .auth-panel:hover {
    border-color: rgba(167, 139, 250, 0.22);
    box-shadow:
      0 24px 70px rgba(0, 0, 0, 0.7),
      0 0 70px rgba(124, 58, 237, 0.2),
      0 0 100px rgba(6, 182, 212, 0.1),
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3);
  }

  .auth-panel:hover::before {
    opacity: 0.8;
  }

  @keyframes borderShimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .card-inner-glow {
    position: absolute;
    top: -60%;
    left: -60%;
    width: 220%;
    height: 220%;
    background: radial-gradient(
      ellipse at center,
      rgba(124, 58, 237, 0.06) 0%,
      transparent 60%
    );
    pointer-events: none;
    z-index: 0;
    animation: innerGlow 15s linear infinite;
  }

  @keyframes innerGlow {
    to { transform: rotate(360deg); }
  }

  .panel-content {
    position: relative;
    z-index: 1;
  }

  .brand-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 34px;
  }

  .logo-emblem {
    width: 54px;
    height: 54px;
    margin-bottom: 18px;
    position: relative;
  }

  .emblem-core {
    width: 54px;
    height: 54px;
    background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #4C1D95 100%);
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 0 35px rgba(124, 58, 237, 0.6),
      0 0 70px rgba(124, 58, 237, 0.3),
      0 0 100px rgba(167, 139, 250, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
  }

  .emblem-core:hover {
    transform: scale(1.1) rotate(8deg);
    box-shadow:
      0 0 50px rgba(124, 58, 237, 0.8),
      0 0 100px rgba(124, 58, 237, 0.4),
      0 0 150px rgba(167, 139, 250, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  .logo-orbit {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 75px;
    height: 75px;
    border: 1.5px solid rgba(167, 139, 250, 0.25);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: logoOrbit 10s linear infinite;
    pointer-events: none;
  }

  .logo-orbit::after {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    width: 8px;
    height: 8px;
    background: #A78BFA;
    border-radius: 50%;
    transform: translateX(-50%);
    box-shadow: 0 0 20px #A78BFA, 0 0 40px rgba(167, 139, 250, 0.6);
  }

  @keyframes logoOrbit {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  .brand-title {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-size: 26px;
    font-weight: 700;
    color: #F8FAFC;
    letter-spacing: -0.5px;
    margin-bottom: 5px;
    text-shadow: 0 0 30px rgba(167, 139, 250, 0.3);
  }

  .brand-accent {
    background: linear-gradient(135deg, #A78BFA 0%, #22D3EE 60%, #C4B5FD 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .brand-subtitle {
    font-size: 13px;
    color: #94A3B8;
    font-weight: 400;
    letter-spacing: 0.3px;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    color: #64748B;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    transition: color 0.3s ease;
  }

  .field-group:focus-within .field-label {
    color: #A78BFA;
    text-shadow: 0 0 10px rgba(167, 139, 250, 0.3);
  }

  .label-icon {
    width: 14px;
    height: 14px;
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }

  .field-group:focus-within .label-icon {
    opacity: 1;
  }

  .input-container {
    position: relative;
  }

  .form-input {
    width: 100%;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(167, 139, 250, 0.12);
    border-radius: var(--radius-md);
    color: #F8FAFC;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    outline: none;
    transition: all 0.3s ease;
    letter-spacing: 0.2px;
  }

  .form-input::placeholder {
    color: #64748B;
    font-weight: 400;
  }

  .form-input:hover {
    border-color: rgba(167, 139, 250, 0.22);
    background: rgba(255, 255, 255, 0.05);
  }

  .form-input:focus {
    border-color: #7C3AED;
    background: rgba(255, 255, 255, 0.05);
    box-shadow:
      0 0 0 3px rgba(124, 58, 237, 0.12),
      0 0 25px rgba(124, 58, 237, 0.1),
      inset 0 0 15px rgba(124, 58, 237, 0.03);
  }

  .input-has-icon {
    padding-right: 44px;
  }

  .password-toggle {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #64748B;
    cursor: pointer;
    padding: 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .password-toggle:hover {
    color: #A78BFA;
    background: rgba(124, 58, 237, 0.1);
  }

  .actions-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 2px;
  }

  .remember-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
  }

  .custom-checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(167, 139, 250, 0.22);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.02);
  }

  .custom-checkbox.checked {
    background: #7C3AED;
    border-color: #7C3AED;
    box-shadow: 0 0 18px rgba(124, 58, 237, 0.4);
  }

  .remember-label {
    font-size: 13px;
    color: #CBD5E1;
    font-weight: 500;
    transition: color 0.2s ease;
  }

  .remember-wrap:hover .remember-label {
    color: #E2E8F0;
  }

  .forgot-btn {
    background: none;
    border: none;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #A78BFA;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .forgot-btn:hover {
    color: #C4B5FD;
    background: rgba(124, 58, 237, 0.08);
    text-shadow: 0 0 10px rgba(167, 139, 250, 0.3);
  }

  .error-block {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-left: 2px solid #EF4444;
    border-radius: var(--radius-md);
    color: #FCA5A5;
    font-size: 13px;
    font-weight: 500;
    animation: errorIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes errorIn {
    0% { opacity: 0; transform: translateX(-10px); }
    100% { opacity: 1; transform: translateX(0); }
  }

  .error-icon-block {
    flex-shrink: 0;
  }

  .submit-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-md);
    color: white;
    font-family: 'Inter', sans-serif;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    margin-top: 6px;
  }

  .submit-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }

  .submit-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
    transition: left 0.7s ease;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
    box-shadow: 0 10px 35px rgba(124, 58, 237, 0.55), 0 0 60px rgba(167, 139, 250, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }

  .submit-btn:hover:not(:disabled)::after {
    left: 100%;
  }

  .submit-btn:active:not(:disabled) {
    transform: translateY(-1px);
    transition: all 0.1s ease;
  }

  .submit-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    filter: saturate(0.4);
  }

  .btn-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    position: relative;
    z-index: 1;
  }

  .btn-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: btnSpin 0.7s linear infinite;
  }

  @keyframes btnSpin {
    to { transform: rotate(360deg); }
  }

  .divider-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
    margin: 24px 0;
  }

  .divider-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.15), transparent);
  }

  .divider-text {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    color: #64748B;
    font-weight: 500;
    letter-spacing: 1px;
  }

  .register-wrap {
    text-align: center;
    margin-bottom: 22px;
  }

  .register-prompt {
    font-size: 14px;
    color: #94A3B8;
    font-weight: 400;
  }

  .register-link {
    color: #A78BFA;
    font-weight: 600;
    text-decoration: none;
    margin-left: 4px;
    transition: all 0.2s ease;
  }

  .register-link:hover {
    color: #C4B5FD;
    text-shadow: 0 0 10px rgba(167, 139, 250, 0.3);
  }

  .trust-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .trust-pill {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 15px;
    background: rgba(124, 58, 237, 0.06);
    border: 1px solid rgba(167, 139, 250, 0.1);
    border-radius: 50px;
    font-size: 11px;
    color: #94A3B8;
    font-weight: 500;
    letter-spacing: 0.3px;
    transition: all 0.25s ease;
  }

  .trust-pill:hover {
    background: rgba(124, 58, 237, 0.12);
    border-color: rgba(167, 139, 250, 0.22);
    color: #CBD5E1;
    box-shadow: 0 0 15px rgba(124, 58, 237, 0.15);
  }

  .pill-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #A78BFA;
    box-shadow: 0 0 10px #A78BFA;
    flex-shrink: 0;
    animation: dotPulse 2s ease-in-out infinite;
  }

  @keyframes dotPulse {
    0%, 100% { opacity: 0.5; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  .legal-footer {
    text-align: center;
    font-size: 11px;
    color: #64748B;
    line-height: 1.7;
  }

  .legal-link {
    color: #94A3B8;
    cursor: pointer;
    transition: color 0.2s ease;
    font-weight: 500;
  }

  .legal-link:hover {
    color: #A78BFA;
  }

  @media (max-width: 480px) {
    .auth-panel {
      padding: 32px 22px 28px;
      border-radius: var(--radius-lg);
    }
    .brand-title {
      font-size: 22px;
    }
    .login-stage {
      padding: 16px;
    }
    .trust-row {
      gap: 6px;
    }
    .trust-pill {
      padding: 5px 10px;
      font-size: 10px;
    }
    .orb-1, .orb-2, .orb-3, .orb-4 {
      opacity: 0.5;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`

function useStarfield(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationId
    const stars = []
    const shootingStars = []
    const STAR_COUNT = 200
    const SHOOTING_COUNT = 3

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    class Star {
      constructor(w, h) {
        this.w = w
        this.h = h
        this.x = Math.random() * w
        this.y = Math.random() * h
        this.size = Math.random() * 2.2 + 0.4
        this.baseOpacity = Math.random() * 0.65 + 0.25
        this.twinkleSpeed = Math.random() * 0.018 + 0.004
        this.twinkleOffset = Math.random() * Math.PI * 2
        this.driftX = (Math.random() - 0.5) * 0.15
        this.driftY = (Math.random() - 0.5) * 0.1
        const colors = ['#ffffff', '#A78BFA', '#C4B5FD', '#22D3EE', '#E0E7FF', '#DDD6FE']
        this.color = colors[Math.floor(Math.random() * colors.length)]
      }

      draw(ctx, time) {
        this.x += this.driftX
        this.y += this.driftY
        if (this.x < -10) this.x = this.w + 10
        if (this.x > this.w + 10) this.x = -10
        if (this.y < -10) this.y = this.h + 10
        if (this.y > this.h + 10) this.y = -10

        const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.35 + 0.65
        const alpha = this.baseOpacity * twinkle

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.globalAlpha = alpha
        ctx.fill()

        if (this.size > 1.3) {
          const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 8)
          glow.addColorStop(0, this.color)
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.globalAlpha = alpha * 0.25
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }
    }

    class ShootingStar {
      constructor(w, h) {
        this.w = w
        this.h = h
        this.reset()
      }

      reset() {
        this.x = Math.random() * this.w * 0.6 + this.w * 0.2
        this.y = Math.random() * this.h * 0.3
        this.length = Math.random() * 70 + 40
        this.speed = Math.random() * 7 + 5
        this.opacity = 0
        this.fadingIn = true
        this.angle = Math.PI * 0.35 + (Math.random() - 0.5) * 0.3
      }

      update() {
        if (this.fadingIn) {
          this.opacity += 0.025
          if (this.opacity >= 0.9) this.fadingIn = false
        } else {
          this.opacity -= 0.008
        }
        this.x += Math.cos(this.angle) * this.speed
        this.y += Math.sin(this.angle) * this.speed
        if (this.opacity <= 0 || this.x > this.w + 100 || this.y > this.h + 100) {
          this.reset()
        }
      }

      draw(ctx) {
        if (this.opacity <= 0.01) return
        const endX = this.x - Math.cos(this.angle) * this.length
        const endY = this.y - Math.sin(this.angle) * this.length
        const gradient = ctx.createLinearGradient(this.x, this.y, endX, endY)
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`)
        gradient.addColorStop(0.5, `rgba(167, 139, 250, ${this.opacity * 0.5})`)
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(endX, endY)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.5
        ctx.globalAlpha = this.opacity
        ctx.stroke()
        ctx.globalAlpha = 1
      }
    }

    const init = () => {
      const w = canvas.width / Math.min(window.devicePixelRatio || 1, 2)
      const h = canvas.height / Math.min(window.devicePixelRatio || 1, 2)
      stars.length = 0
      shootingStars.length = 0
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(new Star(w, h))
      }
      for (let j = 0; j < SHOOTING_COUNT; j++) {
        shootingStars.push(new ShootingStar(w, h))
      }
    }

    init()

    const animate = (timestamp) => {
      const w = canvas.width / Math.min(window.devicePixelRatio || 1, 2)
      const h = canvas.height / Math.min(window.devicePixelRatio || 1, 2)
      const time = timestamp * 0.001
      ctx.clearRect(0, 0, w, h)
      for (let i = 0; i < stars.length; i++) {
        stars[i].draw(ctx, time)
      }
      for (let j = 0; j < shootingStars.length; j++) {
        shootingStars[j].update()
        shootingStars[j].draw(ctx)
      }
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [canvasRef])
}

function StarfieldCanvas() {
  const ref = useRef(null)
  useStarfield(ref)
  return <canvas ref={ref} className="starfield-canvas" />
}

function CosmicDust() {
  const particles = useMemo(() => {
    const arr = []
    for (let i = 0; i < 25; i++) {
      arr.push({
        id: i,
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        size: Math.random() * 2.5 + 0.5 + 'px',
        duration: (Math.random() * 18 + 10) + 's',
        delay: (Math.random() * 12) + 's',
        drift: ((Math.random() - 0.5) * 80) + 'px'
      })
    }
    return arr
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="dust-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            '--drift': p.drift
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
  const { login } = useAuth()

  useEffect(() => {
    if (!document.getElementById('deep-nebula-styles')) {
      const el = document.createElement('style')
      el.id = 'deep-nebula-styles'
      el.textContent = STYLES
      document.head.appendChild(el)
    }
    return () => {
      const el = document.getElementById('deep-nebula-styles')
      if (el) el.remove()
    }
  }, [])

  useEffect(() => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }, [])

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/login', { email, password })
      const data = response.data
      login(
        { id: data.id, email: data.email, fullName: data.fullName, role: data.role },
        data.token
      )
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password. Please try again.'
      setError(message)
      setLoading(false)
    }
  }, [email, password, login])

  const togglePassword = useCallback(() => {
    setShowPass(prev => !prev)
  }, [])

  const toggleRemember = useCallback(() => {
    setRemember(prev => !prev)
  }, [])

  const trustItems = useMemo(() => {
    return ['Enterprise Grade', 'SOC2 Compliant', '256-bit Encryption']
  }, [])

  return (
    <div className="cosmic-viewport">
      <div className="nebula-layer" />
      <div className="cosmic-grid" />
      <StarfieldCanvas />
      <CosmicDust />
      <div className="cosmic-orb orb-1" />
      <div className="cosmic-orb orb-2" />
      <div className="cosmic-orb orb-3" />
      <div className="cosmic-orb orb-4" />
      <div className="ring-system">
        <div className="orbital-ring ring-1"><div className="ring-dot" /></div>
        <div className="orbital-ring ring-2"><div className="ring-dot" /></div>
        <div className="orbital-ring ring-3"><div className="ring-dot" /></div>
      </div>
      <div className="shooting-star shoot-1" />
      <div className="shooting-star shoot-2" />
      <div className="shooting-star shoot-3" />
      <div className="vignette" />
      <div className="scanlines" />

      <div className="login-stage">
        <div className="auth-panel">
          <div className="card-inner-glow" />
          <div className="panel-content">
            <div className="brand-block">
              <div className="logo-emblem">
                <div className="logo-orbit" />
                <div className="emblem-core">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.5 7.5L20 8L16 12.5L17 18L12 15L7 18L8 12.5L4 8L9.5 7.5L12 2Z" fill="white" opacity="0.9" />
                  </svg>
                </div>
              </div>
              <h1 className="brand-title">
                Interview<span className="brand-accent">AI</span>
              </h1>
              <p className="brand-subtitle">Welcome back to your dashboard</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
              <div className="field-group">
                <label className="field-label">
                  <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7L13 13L4 7" />
                  </svg>
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <circle cx="12" cy="16" r="1" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Password
                </label>
                <div className="input-container">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input input-has-icon"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePassword}
                    tabIndex={-1}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="actions-row">
                <div className="remember-wrap" onClick={toggleRemember}>
                  <div className={`custom-checkbox${remember ? ' checked' : ''}`}>
                    {remember && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 4.5L4 7.5L10 1.5" />
                      </svg>
                    )}
                  </div>
                  <span className="remember-label">Remember me</span>
                </div>
                <button type="button" className="forgot-btn">Forgot password?</button>
              </div>

              {error && (
                <div className="error-block">
                  <svg className="error-icon-block" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                <div className="btn-inner">
                  {loading && <div className="btn-spinner" />}
                  <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                </div>
              </button>
            </form>

            <div className="divider-wrap">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            <div className="register-wrap">
              <span className="register-prompt">
                Don&apos;t have an account?
                <Link to="/register" className="register-link">Create one</Link>
              </span>
            </div>

            <div className="trust-row">
              {trustItems.map((item) => (
                <div key={item} className="trust-pill">
                  <span className="pill-dot" />
                  {item}
                </div>
              ))}
            </div>

            <p className="legal-footer">
              By signing in, you agree to our{' '}
              <span className="legal-link">Terms of Service</span> and{' '}
              <span className="legal-link">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}