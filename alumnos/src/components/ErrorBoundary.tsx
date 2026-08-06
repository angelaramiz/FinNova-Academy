import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ background: '#0f172a' }}>
          <div className="max-w-md w-full rounded-2xl p-8 text-center" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-bold text-white mb-2">Algo salió mal</h2>
            <p className="text-sm text-slate-400 mb-6">
              Ha ocurrido un error inesperado. No te preocupes, tus datos están seguros.
            </p>
            {this.state.error && (
              <div className="mb-4 p-3 rounded-lg text-[11px] font-mono text-left overflow-auto max-h-24" style={{ background: '#0f172a', color: '#94a3b8', border: '1px solid #1e293b' }}>
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={this.handleRetry}
                className="flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer transition hover:opacity-80"
                style={{ background: '#FFB162', color: '#1B2632' }}>
                Reintentar
              </button>
              <button onClick={this.handleReload}
                className="flex-1 py-3 rounded-xl font-bold text-sm cursor-pointer transition hover:opacity-80"
                style={{ background: '#334155', color: '#e2e8f0' }}>
                Recargar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
