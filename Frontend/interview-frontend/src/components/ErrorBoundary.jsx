import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2 text-text">Something went wrong</h2>
        <p className="text-text-dim mb-4">{error?.message || 'An unexpected error occurred'}</p>
        <div className="space-y-2">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 ml-2 border border-border rounded-lg hover:bg-surface2 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

// ✅ Named export - what main.jsx expects
export const ErrorBoundary = ({ children }) => (
  <ReactErrorBoundary 
    FallbackComponent={ErrorFallback}
    onError={(error, errorInfo) => {
      console.error('Error caught by boundary:', error, errorInfo);
    }}
  >
    {children}
  </ReactErrorBoundary>
);

// ✅ Default export for backward compatibility
export default ErrorBoundary;