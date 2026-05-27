The issue is that your browser is displaying the **raw markdown** instead of rendering it properly. GitHub will render it correctly once pushed. However, let me give you a cleaner, better-formatted README that will display correctly:

```markdown
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

## 📋 Overview

This is a full-stack interview simulation platform where:

| Role | Capabilities |
|------|--------------|
| **Recruiters (ADMIN)** | Launch sessions, observe candidates via live WebRTC camera feed, inject custom questions, pause/resume, end interviews, view proctoring alerts |
| **Candidates (USER)** | Interviewed by AI chatbot with voice input/output, evaluated in real time by Groq's LLaMA model |
| **WebRTC Camera Streaming** | Peer-to-peer live video from candidate to recruiter using `simple-peer` |
| **Proctoring** | Silently detects paste events, right-clicks, keyboard shortcuts, tab switches, and window blur |
| **Resume Screening** | Upload PDF/DOCX resume and auto-generate tailored interview questions |
| **AI-Powered Evaluation** | Groq's LLaMA 3.3 70B model scores answers on confidence, authenticity, and accuracy |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Spring Boot 3.2.5, Java 21, Maven |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Spring Security + JWT |
| **Real-time** | WebSocket + STOMP (SockJS) |
| **Video Streaming** | WebRTC (simple-peer) |
| **AI Evaluation** | Groq API — llama-3.3-70b-versatile |
| **File Parsing** | Apache PDFBox 3.0.1, Mammoth.js |
| **Frontend** | React 19.2.5 + Vite 5.4.11 + Tailwind CSS 4.2.4 |
| **State Management** | TanStack React Query |
| **Testing** | Vitest + React Testing Library |

---

## 📁 Project Structure

### Backend
```
src/main/java/com/interviewai/interview_platform/
├── model/          # JPA entities
├── repository/     # Spring Data JPA repositories
├── service/        # Business logic
├── controller/     # REST endpoints
├── security/       # JWT configuration
├── config/         # SecurityConfig, CorsConfig, WebSocketConfig
├── websocket/      # WebSocket controllers
└── util/           # QuestionSeeder
```

### Frontend
```
src/
├── components/
│   ├── CameraStream.jsx         # WebRTC camera initiator (candidate)
│   ├── AdminCameraView.jsx      # WebRTC receiver (recruiter)
│   ├── ErrorBoundary.jsx        # React error boundary
│   ├── ProctoringHandler.jsx    # Silent proctoring
│   └── LoadingStates.jsx        # Skeleton loaders
├── context/
│   └── AuthContext.jsx          # Authentication with loading state
├── providers/
│   └── QueryProvider.jsx        # React Query configuration
├── pages/
│   ├── Login.jsx                # Remember me, session clearing
│   ├── Register.jsx             # Form validation, resume upload
│   ├── WaitingRoom.jsx          # Session status check
│   ├── Interviews.jsx           # AI chatbot, voice I/O
│   ├── Results.jsx              # Scored answers + AI feedback
│   ├── RecruiterDashboard.jsx   # Live feed, controls, reports
│   ├── ResumeScreeningTab.jsx   # Resume → AI questions
│   └── CandidatesTab.jsx        # Candidate management
└── services/
    └── api.js                   # Axios with JWT interceptor
```

---

## ⚙️ How It Works

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

## 🚀 Running Locally

### Backend
```bash
cd backend
# Set Groq API key in application.properties
mvn spring-boot:run
```

### Frontend
```bash
cd frontend
cp .env.example .env
# Add your keys
npm install
npm run dev -- --host
```

### Environment Variables (`.env`)
```env
VITE_GROQ_API_KEY=your_groq_key
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=http://localhost:8080/ws
```

### Demo Setup (Two Laptops)
```bash
# Backend: 10.72.97.198:8080
# Frontend: 10.72.97.198:5173 (with --host)
# Candidate: http://10.72.97.198:5173
# Recruiter: http://localhost:5173
```

---

## 🌐 WebSocket Topics

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

## 🧪 Testing

```bash
npm run lint      # ESLint
npm run test      # Vitest
npm run coverage  # Coverage report
```

---

## ⚠️ Important Notes (Do Not Change)

- Table name is `users` (not `user` - reserved in PostgreSQL)
- `InterviewSession` status enum is `Status`, not `SessionStatus`
- `JwtFilter` uses manual constructor - no `@RequiredArgsConstructor`
- HikariCP requires `connection-init-sql=DEALLOCATE ALL` for Supabase
- `questions` fetch must be `FetchType.EAGER`
- `sessionStorage` only for auth tokens (not localStorage)
- `StrictMode` removed from `main.jsx`
- `VITE_WS_URL` must use IP for WebSocket connections

---

## 📄 License

Educational purposes only.

---

<div align="center">
Built with ☕ Java, ⚛️ React, 🎥 WebRTC, and 🤖 Groq LLaMA
</div>
```

## 📌 To fix the display issue:

1. **Copy the above README.md** content
2. **Paste it into your `README.md` file** on GitHub (edit the file directly on GitHub or push from local)
3. **Make sure the file extension is `.md`** (not `.txt` or anything else)
4. **GitHub will render it correctly** once pushed

The preview you see in your browser is showing raw markdown because:
- You might be viewing the raw file (raw.githubusercontent.com)
- Or your browser extension is interfering
- Or the file extension is incorrect

Once pushed to GitHub and viewed on the main repository page, it will render beautifully with all badges and formatting! 🚀
