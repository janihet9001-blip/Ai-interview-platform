#  AI Interview Preparation Platform

A full-stack AI-powered interview preparation platform built with **Spring Boot**, **React**, **WebSockets**, and **Groq AI**.

The platform simulates real technical interviews with:

* AI-generated evaluation
* Real-time recruiter monitoring
* Voice interaction
* Live typing feed
* Recruiter-controlled interview flows

Designed with a modern dark UI inspired by **Stripe** and **Vercel**.

---

#  Features

##  Candidate Features

* JWT authentication
* AI chatbot interview experience
* Real-time AI feedback
* Voice-to-text answering
* Bot text-to-speech
* Session history
* Results dashboard
* Live recruiter interaction
* Waiting room before interview launch

---

##  Recruiter Features

* Candidate management
* Launch interviews remotely
* Monitor live typing in real-time
* Ask custom interview questions
* Pause/resume interview flow
* View completed interview sessions
* Live interview feed panel

---

##  AI Features

* AI answer evaluation using Groq LLM
* Automatic scoring
* Personalized feedback
* Question-by-question assessment

---

#  Tech Stack

## Backend

* Java 21
* Spring Boot 3.2.5
* Spring Security
* JWT Authentication
* STOMP WebSockets
* PostgreSQL (Supabase)
* Apache PDFBox
* Maven

## Frontend

* React
* Vite
* Tailwind CSS
* Axios
* SockJS
* STOMP.js

## AI

* Groq API
* Model: `llama-3.3-70b-versatile`

---

#  Project Structure

## Backend Structure

```text
src/main/java/com/interviewai/interview_platform/

├── model/
├── repository/
├── service/
├── controller/
├── security/
├── dto/
├── config/
├── websocket/
└── util/
```

---

## Frontend Structure

```text
src/

├── assets/
├── components/
├── context/
├── pages/
├── services/
├── App.jsx
└── main.jsx
```

---

# Core Features

## Authentication

* Secure JWT login/register
* BCrypt password hashing
* Role-based access control
* USER / ADMIN roles

---

## Real-Time WebSockets

* Live typing monitoring
* Recruiter live dashboard
* Real-time interview events
* Session launch broadcasting

### Topics

```text
/topic/session/{candidateId}
/topic/feedback/{sessionId}
/topic/typing/{sessionId}
/topic/recruiter-question/{sessionId}
/topic/pause/{sessionId}
```

---

#  Voice Features

## Bot Text-to-Speech

The AI interviewer speaks every question aloud using:

```js
window.speechSynthesis
```

---

## Candidate Speech-to-Text

Uses browser speech recognition:

```js
window.SpeechRecognition
window.webkitSpeechRecognition
```

Features:

* Real-time transcription
* Live recruiter visibility
* Continuous listening
* Interim result updates

---

#  AI Evaluation Flow

1. Candidate submits answer
2. Backend sends answer to Groq API
3. AI evaluates:

   * Technical quality
   * Completeness
   * Clarity
4. AI returns:

   * Score
   * Feedback
5. Results saved to PostgreSQL

---

#  UI Design

## Design Style

* Modern dark UI
* Stripe/Vercel-inspired
* Glassmorphism surfaces
* Animated gradients
* Smooth hover effects
* Real-time chat experience

## Fonts

* DM Sans
* JetBrains Mono
* Syne

---

#  Database

## PostgreSQL (Supabase)

### Tables

* users
* interview_sessions
* questions
* answer_records
* question_bank

---

#  Backend Features

## Implemented

* JWT authentication
* WebSocket configuration
* AI evaluation service
* Question seeding
* Recruiter controls
* Session tracking
* REST APIs
* Real-time typing relay

---

#  REST API Highlights

## Auth APIs

```http
POST /api/auth/register
POST /api/auth/login
```

---

## Interview APIs

```http
POST /api/interview/start
GET /api/interview/my-sessions
GET /api/interview/{id}/questions
GET /api/interview/all-sessions
```

---

## User APIs

```http
GET /api/users/all
```

---

#  Getting Started

## Clone Repository

```bash
git clone YOUR_REPOSITORY_URL
```

---

## Backend Setup

### Configure `application.properties`

```properties
spring.datasource.url=YOUR_DB_URL
spring.datasource.username=YOUR_USERNAME
spring.datasource.password=YOUR_PASSWORD

groq.api.key=YOUR_GROQ_KEY
```

---

### Run Backend

```bash
mvn spring-boot:run
```

Backend runs on:

```text
http://localhost:8080
```

---

## Frontend Setup

### Install Dependencies

```bash
npm install
```

---

### Run Frontend

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

---

#  Important Notes

## PostgreSQL Reserved Keyword Fix

```java
@Table(name = "users")
```

---

## Question Field Name

Use:

```js
q.questiontext
```

NOT:

```js
q.questionText
```

---

## React StrictMode

StrictMode is intentionally removed to prevent:

* Duplicate WebSocket subscriptions
* Duplicate chatbot messages
* Double useEffect execution

---

## Supabase Stability Fixes

Required Hikari settings:

```properties
spring.datasource.hikari.connection-init-sql=DEALLOCATE ALL
spring.datasource.hikari.keepalive-time=60000
```

---

# Screens

## Included Screens

* Login
* Register
* Candidate Dashboard
* Recruiter Dashboard
* Waiting Room
* AI Chat Interview
* Results Page

---

#  Future Improvements

* Resume upload + parsing
* AI-generated interview questions
* Video interview support
* Analytics dashboard
* Leaderboards
* Multi-role question banks
* Docker deployment
* AWS hosting
* Redis caching
* OAuth login

---

#  Author

Built by Het Jani

Computer Engineering Student passionate about:

* Full-stack development
* AI systems
* Real-time applications
* Backend architecture

---

#  Project Status

 Fully Working MVP

Features completed:

* Authentication
* AI Evaluation
* WebSockets
* Voice Features
* Recruiter Controls
* Live Typing Feed
* Session Tracking
* Results Dashboard

