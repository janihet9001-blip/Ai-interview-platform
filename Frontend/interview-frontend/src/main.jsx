import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { QueryProvider } from './providers/QueryProvider'
import { ThemeProvider } from './context/ThemeContext'  // ← ADD THIS
import ErrorBoundary from './components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ErrorBoundary>
      <ThemeProvider>  {/* ← ADD THIS WRAPPER */}
        <QueryProvider>
          <AuthProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                },
              }}
            />
            <App />
          </AuthProvider>
        </QueryProvider>
      </ThemeProvider>  {/* ← CLOSE WRAPPER */}
    </ErrorBoundary>
  </BrowserRouter>
)