import { Component, ReactNode } from 'react';
import { TOKENS } from './tokens';
import { diagnosticsService } from './diagnostics';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    diagnosticsService.logEvent('RENDER_ERROR', 'app', 'error');
    console.error('Unhandled render error:', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '32px',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          backgroundColor: TOKENS.colors.neutral[50],
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: TOKENS.colors.green[500],
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <span style={{ color: 'white', fontWeight: 800, fontFamily: 'Manrope, sans-serif' }}>TM</span>
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: TOKENS.colors.neutral[900], fontFamily: 'Manrope, sans-serif', marginBottom: '8px' }}>
          Something went wrong displaying this page
        </h1>
        <p style={{ fontSize: '14px', color: TOKENS.colors.neutral[600], maxWidth: '420px', marginBottom: '24px' }}>
          Your data is stored locally in this browser and has not been affected. Reloading usually
          resolves this.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: TOKENS.colors.green[500],
            color: 'white',
          }}
        >
          Reload TaxMate
        </button>
      </div>
    );
  }
}
