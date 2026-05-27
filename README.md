Here's your updated README with all the latest features and improvements:

```markdown
# <img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Briefcase.png" width="32" /> AI Interview Preparation Platform

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

## 📋 Overview

This is a full-stack interview simulation platform where:

- **Recruiters (ADMIN)** launch sessions, observe candidates via live WebRTC camera feed, inject custom questions, pause/resume, and end interviews
- **Candidates (USER)** are interviewed by an AI chatbot with voice input/output, evaluated in real time by Groq's LLaMA model
- **WebRTC Camera Streaming** - Peer-to-peer live video from candidate to recruiter using `simple-peer`
- **Proctoring** silently detects paste events, right-clicks, keyboard shortcuts, tab switches, and window blur — reported to the recruiter
- **Resume Screening** lets recruiters upload a PDF/DOCX resume and auto-generate tailored interview questions
- **AI-Powered Evaluation** - Groq's LLaMA 3.3 70B model scores each answer on confidence, authenticity, and accuracy

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Spring Boot 3.2.5, Java 21, Maven |
| **Database** | PostgreSQL via Supabase (hosted on AWS Sydney) |
| **Auth** | Spring Security + JWT (jjwt 0.11.5) |
| **Real-time** | WebSocket + STOMP (SockJS) |
| **Video Streaming** | WebRTC (simple-peer) |
| **AI Evaluation** | Groq API — `llama-3.3-70b-versatile` |
| **File Parsing** | Apache PDFBox 3.0.1, Mammoth.js |
| **Frontend** | React 19.2.5 + Vite 5.4.11 + Tailwind CSS 4.2.4 |
| **State Management** | TanStack React Query |
| **Fonts** | DM Sans · JetBrains Mono · Syne |
| **Testing** | Vitest + React Testing Library |

---

## 📁 Project Structure

### Backend — `com.interviewai.interview_platform`

```
src/main/java/com/interviewai/interview_platform/
├── model/          # JPA entities: User, InterviewSession, Question, AnswerRecord, QuestionBank
├── repository/     # Spring Data JPA repositories
├── service/        # Business logic: Auth, Interview, Evaluation
├── controller/     # REST endpoints: Auth, Interview, User
├── security/       # JwtUtil, JwtFilter (OncePerRequestFilter)
├── dto/            # Request/response objects
├── config/         # SecurityConfig, CorsConfig, WebSocketConfig
├── websocket/      # InterviewWebSocketController
└── util/           # QuestionSeeder (seeds 51 Java questions)
```

### Frontend — `src/`

```
src/
├── assets/
├── components/
│   ├── ActivityCard.jsx
│   ├── Logo.jsx
│   ├── Navbar.jsx
│   ├── RoleCard.jsx
│   ├── StatCard.jsx
│   ├── CameraStream.jsx         # WebRTC camera initiator (candidate side)
│   ├── AdminCameraView.jsx      # WebRTC receiver (recruiter side)
│   ├── ErrorBoundary.jsx        # React error boundary
│   ├── LoadingStates.jsx        # Skeleton loaders & spinners
│   └── ProctoringHandler.jsx    # Silent proctoring — no candidate alert
├── context/
│   └── AuthContext.jsx          # sessionStorage auth with loading state
├── providers/
│   └── QueryProvider.jsx        # React Query configuration
├── pages/
│   ├── Login.jsx                # Clears sessionStorage on mount, remember me
│   ├── Register.jsx             # Form validation, resume upload
│   ├── WaitingRoom.jsx          # Candidate waits; listens on /topic/session/{id}
│   ├── Interviews.jsx           # AI chatbot, voice I/O, proctoring, Groq analysis
│   ├── Results.jsx              # Shows scored answered questions + AI feedback
│   ├── RecruiterDashboard.jsx   # ADMIN portal: live feed, controls, reports, camera view
│   ├── ResumeScreeningTab.jsx   # Resume upload → AI question generation
│   ├── CandidatesTab.jsx        # Candidate management with recruiter remarks
│   └── ... (Dashboard, History, Analytics, Progress, Jobs, Profile)
└── services/
    └── api.js                   # Axios instance, JWT from sessionStorage
```

---

## ⚙️ How It Works — Full Flow

### 1. Authentication
- Candidate or Recruiter registers/logs in via `POST /api/auth/register` or `/login`
- JWT token stored in **sessionStorage** (auto-clears on tab close)
- `USER` role → redirected to `/waiting`
- `ADMIN` role → redirected to `/recruiter`
- Remember Me option saves email in localStorage

### 2. Session Launch (Recruiter)
- Recruiter selects candidate + job role → `POST /api/interview/start`
- Backend creates session with 50 questions loaded from `question_bank`
- Broadcasts to `/topic/session/{candidateId}` via WebSocket
- Candidate auto-redirects to `/interview/JAVA_DEVELOPER?sessionId=X`

### 3. Live Interview (Candidate)
- AI bot greets with time-based message, asks questions one by one
- Every question is **spoken aloud** via `SpeechSynthesis API`
- Candidate types or uses **voice input** (Web Speech API — continuous + interim results)
- Every keystroke → sent to `/app/typing` → recruiter sees live
- Candidate submits → answer sent to `/app/answer` → Groq evaluates → score + feedback saved to DB

### 4. WebRTC Camera Streaming
- **Candidate Side:** Clicks "Enable Camera" → `getUserMedia` → creates SimplePeer as initiator → sends offer via `/app/webrtc/offer`
- **Recruiter Side:** Subscribes to `/topic/webrtc/offer/{userId}` → creates SimplePeer as non-initiator → sends answer via `/app/webrtc/answer`
- Peer-to-peer connection established directly between browsers

### 5. Recruiter Controls (Real-time)

| Action | Behaviour |
|---|---|
| **Inject Question** | Saved to DB with `questionNumber=999`, shown on candidate screen as AI bubble, spoken aloud |
| **Pause** | `ignoreFeedbackRef=true`, speech cancelled, candidate waits silently |
| **Resume** | No message shown, 1500ms delay, then next question loads seamlessly |
| **End Interview** | Confirm dialog → backend saves `COMPLETED` → candidate redirected to results after 3s |
| **Second Violation** | Popup asks recruiter to terminate or continue |

### 6. Evaluation & Results
- On finish, `handleFinish` fetches all questions from `GET /api/interview/{id}/questions`
- Filters: `userAnswer != null && questionNumber != 999`
- Groq runs per-question analysis: **confidence, authenticity, accuracy (0–100)**, suspicious flag
- Stored in `localStorage` under key `interview_analysis_{sessionId}`
- Results page shows scored questions + AI feedback only

### 7. Proctoring (Silent)

`ProctoringHandler.jsx` detects:
- **Paste** (`paste` event)
- **Right Click** (`contextmenu`)
- **Keyboard Shortcuts** (Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+R, F5, Ctrl+Shift+I, F12)
- **Alt+Tab detection** (`blur` + `visibilitychange` combo)
- **Window blur** (`blur`)

All events sent silently to `/app/proctoring-event` → broadcast to recruiter via `/topic/proctoring`. **No alert shown to candidate.**

### 8. Resume Screening
- Recruiter uploads PDF / DOCX / TXT
- Apache PDFBox / Mammoth.js parses content → sent to Groq → generates interview questions
- Follow-up chat supported
- State persists across tab switches within recruiter dashboard

### 9. Quality Improvements
- **Error Boundaries** - Graceful error handling throughout the app
- **Toast Notifications** - User feedback with react-hot-toast
- **React Query** - API caching and state management
- **PropTypes** - Runtime type checking for components
- **Memory Leak Prevention** - Proper cleanup in all useEffect hooks
- **Session Status Check** - Prevents interview restart after completion

---

## 🔐 Security Notes

- CSRF disabled (stateless JWT auth)
- `/api/auth/**` and `/ws/**` are public
- All other endpoints require valid JWT
- `POST /api/interview/start`, `GET /api/interview/all-sessions`, `GET /api/users/all` — **ADMIN only**
- Passwords hashed with **BCrypt**
- Content Security Policy configured for WebSocket connections

---

## 🗄️ Database Entities

| Entity | Key Fields |
|---|---|
| `users` | `id`, `email`, `password`, `fullName`, `role (USER/ADMIN)`, `createdAt` |
| `interview_sessions` | `id`, `user`, `jobRole`, `totalScore`, `totalQuestions`, `status (IN_PROGRESS/COMPLETED/ABANDONED)` |
| `questions` | `id`, `session`, `questiontext`, `userAnswer`, `aiFeedback`, `score`, `questionNumber` |
| `answer_records` | `id`, `session`, `questionText`, `userAnswer`, `aiFeedback`, `score`, `answeredAt` |
| `question_bank` | `id`, `questionText`, `expectedAnswer`, `difficulty (EASY/MEDIUM/HARD)`, `category`, `jobRole` |

> `questions.questiontext` — lowercase `t` (not `questionText`) — matches the DB column exactly.

---

## 🌐 WebSocket Topics

| Topic | Purpose |
|---|---|
| `/topic/session/{candidateId}` | Notify candidate that interview has started |
| `/topic/feedback/{sessionId}` | Stream AI evaluation back to candidate |
| `/topic/typing/{sessionId}` | Live keystroke feed to recruiter |
| `/topic/recruiter-question/{sessionId}` | Injected recruiter question → candidate screen |
| `/topic/pause/{sessionId}` | Pause / Resume signals |
| `/topic/end/{sessionId}` | End interview signal |
| `/topic/proctoring` | Proctoring events → recruiter |
| `/topic/webrtc/offer/{userId}` | WebRTC offer for camera stream |
| `/topic/webrtc/answer/{userId}` | WebRTC answer for camera stream |

---

## 🎤 Voice Features

**Text-to-Speech**
- `window.speechSynthesis.cancel()` then `speak()`
- rate=`0.95`, pitch=`1`, volume=`1`
- Skips duplicate consecutive messages

**Speech-to-Text**
- `SpeechRecognition` / `webkitSpeechRecognition`
- `continuous=true`, `interimResults=true`, `lang=en-US`
- Interim + final results merged for real-time display
- `sendTyping()` called on every word

---

## 🎨 Design System

| Variable | Value |
|---|---|
| `--bg` | `#080C14` |
| `--surface` | `#0F1623` |
| `--accent` | `#2563EB` |
| `--cyan` | `#06B6D4` |
| `--green` | `#10B981` |
| `--text` | `#E2E8F0` |

- Premium glassmorphism effects with mouse-following glow
- Dual-tone professional backgrounds
- Animated tab underlines (top and bottom on hover)
- CSS keyframes: `fadeUp`, `fadeIn`, `pulse-glow`, `blink`, `spin`, `shimmer-premium`, `typing`
- **No framer-motion** — all animations are pure CSS

---

## 🚀 Running Locally

### Backend
```bash
cd backend
# Set your Groq key in application.properties
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Fill in VITE_GROQ_API_KEY, VITE_API_URL, VITE_WS_URL
npm install
npm run dev -- --host
```

**Frontend `.env`**
```env
VITE_GROQ_API_KEY=your_groq_key
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

### Demo Setup (Two Laptops)
```bash
# Backend runs on: 10.72.97.198:8080
# Frontend runs on: 10.72.97.198:5173 (with --host flag)
# Friend opens: http://10.72.97.198:5173 (candidate screen)
# Admin opens: http://localhost:5173 (recruiter screen)
```

---

## 📦 Key Dependencies

### Backend
- Spring Boot Starter Web, Data JPA, Security, WebSocket, Validation
- PostgreSQL Driver
- JJWT (0.11.5)
- Apache PDFBox (3.0.1)
- Lombok

### Frontend
- React 19, React DOM, React Router DOM 7
- Axios, SockJS-client, STOMPjs
- Simple-peer (WebRTC)
- TanStack React Query
- React Hook Form, React Hot Toast
- React Error Boundary
- PDFJS-Dist, Mammoth (document parsing)
- Tailwind CSS 4, Vite 5

---

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run coverage
```

---

## ⚠️ Known Gotchas (Do Not Undo)

- `users` table name used because `user` is reserved in PostgreSQL
- `InterviewSession` status enum is `Status`, not `SessionStatus`
- `JwtFilter` uses manual constructor — **not** `@RequiredArgsConstructor`
- HikariCP: `connection-init-sql=DEALLOCATE ALL` — required for Supabase
- `vite.config.js`: `define: { global: 'globalThis' }` — fixes SockJS error
- Do **not** add `spring.datasource.hikari.auto-commit=false`
- `AuthResponse` has no `@Data` — manual constructor + getters only
- `StrictMode` removed from `main.jsx`
- `sessionStorage` only for auth — never `localStorage` for tokens
- `ignoreFeedbackRef` blocks stale WebSocket feedback on pause/stop/recruiter inject
- `questions` fetch = FetchType.EAGER — never change to LAZY
- `VITE_WS_URL` must use IP address for WebSocket connections when hosted

---

## 📄 License

This project is for educational purposes.

---

<div align="center">
Built with ☕ Java, ⚛️ React, 🎥 WebRTC, and 🤖 Groq LLaMA
</div>
```

This README now includes:
- ✅ WebRTC camera streaming documentation
- ✅ Quality improvements (Error Boundaries, React Query, PropTypes)
- ✅ Session status check fix
- ✅ Proctoring detection types (right-click, keyboard shortcuts, Alt+Tab)
- ✅ Dual-tone professional design system
- ✅ Testing commands
- ✅ Updated dependency versions
- ✅ Two-laptop demo setup instructions
