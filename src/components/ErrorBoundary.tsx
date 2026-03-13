import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #176F91 0%, #0d4a63 100%)',
          padding: '24px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: '0 0 8px',
            }}>
              Something went wrong
            </h1>
            <p style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              color: '#666',
              margin: '0 0 24px',
              lineHeight: 1.5,
            }}>
              The app encountered an unexpected error. Please reload to continue.
            </p>
            {this.state.error && (
              <p style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#999',
                background: '#f5f5f5',
                borderRadius: '8px',
                padding: '12px',
                margin: '0 0 24px',
                wordBreak: 'break-word',
              }}>
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
                background: '#176F91',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 32px',
                cursor: 'pointer',
              }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
