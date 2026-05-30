Here is the complete README.md for your AI Interview Preparation Platform project:

# AI Interview Preparation Platform

<div align="center">

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.5-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.4.11-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.2.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-STOMP-FF6C37?style=for-the-badge&logo=socketdotio&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-P2P-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=for-the-badge&logo=groq&logoColor=white)

**A real-time AI-powered interview platform with live recruiter controls, voice interaction, WebRTC camera streaming, proctoring, and AI evaluation.**

</div>

---

## Overview

This is a full-stack interview simulation platform where:

| Role | Capabilities |
|------|--------------|
| **Recruiters (ADMIN)** | Launch sessions, observe candidates via live WebRTC camera feed, inject custom questions, pause/resume, end interviews, view proctoring alerts |
| **Candidates (USER)** | Interviewed by AI chatbot with voice input/output, evaluated in real time by Groq's LLaMA 3.3 70B model |
| **WebRTC Camera Streaming** | Peer-to-peer live video from candidate to recruiter using `simple-peer` |
| **Proctoring** | Silently detects paste events, right-clicks, keyboard shortcuts, tab switches, and window blur |
| **Resume Screening** | Upload PDF/DOCX resume and auto-generate tailored interview questions |
| **AI-Powered Evaluation** | Groq's LLaMA 3.3 70B model scores answers on confidence, authenticity, and accuracy |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Spring Boot 3.2.5, Java 21, Maven |
| **Database** | PostgreSQL 15+ (local or Supabase) |
| **Auth** | Spring Security + JWT |
| **Real-time** | WebSocket + STOMP (SockJS) |
| **Video Streaming** | WebRTC (simple-peer) |
| **AI Evaluation** | Groq API — llama-3.3-70b-versatile |
| **File Parsing** | Apache PDFBox 3.0.1, Mammoth.js |
| **Frontend** | React 19.2.5 + Vite 5.4.11 + Tailwind CSS 4.2.4 |
| **State Management** | TanStack React Query |
| **Testing** | Vitest + React Testing Library |

---

## Project Structure

### Backend
```
src/main/java/com/interviewai/interview_platform/
├── config/          # SecurityConfig, CorsConfig, WebSocketConfig
├── controller/      # REST endpoints (Auth, Interview, User)
├── dto/             # Request/response objects
├── model/           # JPA entities (User, InterviewSession, Question)
├── repository/      # Spring Data JPA repositories
├── security/        # JWT filter and utilities
├── service/         # Business logic (Auth, Interview, Evaluation)
├── websocket/       # WebSocket controllers
└── util/            # QuestionSeeder (51 Java questions)
```

### Frontend
```
src/
├── components/
│   ├── CameraStream.jsx         # WebRTC camera initiator (candidate)
│   ├── AdminCameraView.jsx      # WebRTC receiver (recruiter)
│   ├── ErrorBoundary.jsx        # React error boundary
│   ├── ProctoringHandler.jsx    # Silent proctoring detection
│   ├── LoadingStates.jsx        # Skeleton loaders
│   └── ThemeToggle.jsx          # Dark/Light mode toggle
├── context/
│   ├── AuthContext.jsx          # JWT authentication
│   └── ThemeContext.jsx         # Theme management
├── providers/
│   └── QueryProvider.jsx        # React Query configuration
├── pages/
│   ├── Login.jsx                # Login with rate limiting & lockout
│   ├── Register.jsx             # Registration with resume upload
│   ├── WaitingRoom.jsx          # Session waiting with camera setup
│   ├── Interviews.jsx           # AI chatbot, voice I/O
│   ├── Results.jsx              # Scored answers + AI feedback
│   ├── RecruiterDashboard.jsx   # Live feed, controls, reports
│   ├── ResumeScreeningTab.jsx   # Resume → AI questions
│   └── CandidatesTab.jsx        # Candidate management
└── services/
    └── api.js                   # Axios with JWT interceptor
```

---

## How It Works

### 1. Authentication
- JWT token stored in **sessionStorage** (clears on tab close)
- `USER` role → redirected to `/waiting`
- `ADMIN` role → redirected to `/recruiter`
- Remember Me saves email in localStorage

### 2. Session Launch
- Recruiter selects candidate + job role → `POST /api/interview/start`
- Broadcasts to `/topic/session/{candidateId}` via WebSocket
- Candidate auto-redirects to interview page

### 3. Live Interview
- AI bot speaks questions via SpeechSynthesis API
- Candidate types or uses voice input (Web Speech API)
- Every keystroke → recruiter sees live via `/topic/typing`
- Answer submitted → Groq evaluates → score + feedback saved

### 4. WebRTC Camera Streaming
- **Candidate:** Clicks "Enable Camera" → creates SimplePeer as initiator → sends offer via `/app/webrtc/offer`
- **Recruiter:** Subscribes to `/topic/webrtc/offer/{userId}` → creates SimplePeer → sends answer via `/app/webrtc/answer`

### 5. Recruiter Controls

| Action | Behaviour |
|--------|-----------|
| **Inject Question** | Saved as `questionNumber=999`, shown on candidate screen, spoken aloud |
| **Pause** | Speech cancelled, candidate waits silently |
| **Resume** | Next question loads after 1500ms |
| **End Interview** | Saves `COMPLETED`, candidate redirected to results |
| **Second Violation** | Popup asks recruiter to terminate or continue |

### 6. Proctoring Detection
- Paste events (`paste`)
- Right clicks (`contextmenu`)
- Keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+R, F5, Ctrl+Shift+I, F12)
- Alt+Tab detection (`blur` + `visibilitychange`)
- Window blur (`blur`)

All events sent silently to recruiter via `/topic/proctoring` - **no alert to candidate**

### 7. Resume Screening
- Upload PDF/DOCX/TXT → parsed content → sent to Groq → generates interview questions
- Follow-up chat supported

---

## Security Features

| Feature | Description |
|---------|-------------|
| **Rate Limiting** | 10 login requests per minute per IP |
| **Account Lockout** | 5 failed attempts = 15 minute lock |
| **Tarpit Delay** | Progressive delays: 1s → 2s → 4s → 8s → 16s |
| **JWT Authentication** | Stateless token-based auth |
| **BCrypt Password Hashing** | Secure password storage |
| **CORS Configuration** | Restricted allowed origins |
| **SQL Injection Protection** | JPA parameterized queries |
| **XSS Protection** | React escapes by default |

---

## WebSocket Topics

| Topic | Purpose |
|-------|---------|
| `/topic/session/{candidateId}` | Notify candidate interview started |
| `/topic/feedback/{sessionId}` | AI evaluation results |
| `/topic/typing/{sessionId}` | Live keystroke feed |
| `/topic/recruiter-question/{sessionId}` | Injected questions |
| `/topic/pause/{sessionId}` | Pause/Resume signals |
| `/topic/end/{sessionId}` | End interview signal |
| `/topic/proctoring` | Proctoring events |
| `/topic/webrtc/offer/{userId}` | WebRTC offer |
| `/topic/webrtc/answer/{userId}` | WebRTC answer |

---

## Design System

### Colors

| Variable | Dark Mode | Light Mode |
|----------|-----------|------------|
| `--bg` | `#080C14` | `#F8FAFC` |
| `--surface` | `#0F1623` | `#FFFFFF` |
| `--text` | `#E2E8F0` | `#0F172A` |
| `--border` | `#1E2D45` | `#CBD5E1` |
| `--accent` | `#2563EB` | `#4F46E5` |

### Features
- ✅ Dark/Light theme toggle
- ✅ Mouse-following glow effects
- ✅ Glassmorphism cards
- ✅ Animated tab underlines
- ✅ Smooth transitions

---

## Running Locally

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Java | 21+ |
| Node.js | 20+ |
| PostgreSQL | 15+ |
| Maven | 3.8+ |

### Backend Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd interview-platform

# Configure database in application.properties
# Update username and password

# Run the backend
mvn spring-boot:run
```

### Frontend Setup

```bash
cd Frontend/interview-frontend

# Install dependencies
npm install

# Create .env file
echo VITE_API_URL=http://localhost:8080/api > .env
echo VITE_WS_URL=http://localhost:8080/ws >> .env

# Run the frontend
npm run dev -- --host
```

### Environment Variables (`.env`)

```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

### Database Configuration (`application.properties`)

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=postgres
spring.datasource.password=your_password

# Security Settings
security.max-login-attempts=5
security.block-duration-minutes=15
security.rate-limit-requests=10
security.rate-limit-window-ms=60000
security.tarpit-enabled=true
```

### Demo Setup (Two Laptops)

```bash
# Backend runs on: 10.72.97.198:8080
# Frontend runs on: 10.72.97.198:5173 (with --host flag)
# Candidate opens: http://10.72.97.198:5173
# Recruiter opens: http://localhost:5173
```

---

## Testing

```bash
# Frontend tests
cd Frontend/interview-frontend
npm run lint      # ESLint
npm run test      # Vitest
npm run coverage  # Coverage report

# Backend tests
cd interview-platform
mvn test
```

---

## Key Dependencies

### Backend
- Spring Boot Starter Web, Data JPA, Security, WebSocket, Validation
- PostgreSQL Driver
- JJWT (0.11.5)
- Apache PDFBox (3.0.1)
- Lombok

### Frontend
- React 19, React Router DOM 7
- Axios, SockJS-client, STOMPjs
- Simple-peer (WebRTC)
- TanStack React Query
- React Hook Form, React Hot Toast
- React Error Boundary
- PDFJS-Dist, Mammoth
- Tailwind CSS 4, Vite 5

---

## Important Notes

- Table name is `users` (not `user` - reserved in PostgreSQL)
- `InterviewSession` status enum is `Status`, not `SessionStatus`
- `JwtFilter` uses manual constructor - no `@RequiredArgsConstructor`
- `questions` fetch must be `FetchType.EAGER`
- `sessionStorage` only for auth tokens (not localStorage)
- `VITE_WS_URL` must use IP for WebSocket connections
- `StrictMode` removed from `main.jsx`

---

## User Roles

| Role | Access |
|------|--------|
| **USER (Candidate)** | Take interviews, view results |
| **ADMIN (Recruiter)** | Launch sessions, view candidates, screen resumes, analyze reports |

---

## License

Educational purposes only.

---

<div align="center">
Built with ☕ Java, ⚛️ React, 🎥 WebRTC, and 🤖 Groq LLaMA
</div>

This README includes:
- ✅ Complete project overview
- ✅ Tech stack with badges
- ✅ Folder structure
- ✅ How it works (detailed flow)
- ✅ Security features
- ✅ WebSocket topics
- ✅ Design system
- ✅ Running instructions
- ✅ Testing commands
- ✅ Important notes
