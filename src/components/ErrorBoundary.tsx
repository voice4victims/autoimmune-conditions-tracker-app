import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

const isChunkLoadError = (error: Error): boolean => {
  const message = error.message || '';
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk') ||
    (error.name === 'TypeError' && message.includes('importing a module'))
  );
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
    if (isChunkLoadError(error) && !sessionStorage.getItem('chunk_reload')) {
      sessionStorage.setItem('chunk_reload', '1');
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      const heading = this.state.isChunkError
        ? 'App Updated'
        : 'Something went wrong';
      const message = this.state.isChunkError
        ? 'A new version of the app is available. Please refresh to load the latest version.'
        : 'The app encountered an unexpected error. Please reload to continue.';

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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {this.state.isChunkError ? '🔄' : '⚠️'}
            </div>
            <h1 style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: '0 0 8px',
            }}>
              {heading}
            </h1>
            <p style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              color: '#666',
              margin: '0 0 24px',
              lineHeight: 1.5,
            }}>
              {message}
            </p>
            {!this.state.isChunkError && this.state.error && (
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
              {this.state.isChunkError ? 'Refresh Now' : 'Reload App'}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
