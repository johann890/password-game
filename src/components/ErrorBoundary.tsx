import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence. Without it a single render error leaves a white page
 * with no way out — and the day's progress stranded behind it, even though it
 * is sitting safely in localStorage.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Passwordle hit an error:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash">
        <h1>Something broke</h1>
        <p>
          Sorry — that is our fault, not yours. Your progress on today's puzzle
          is saved, so reloading should put you back where you were.
        </p>
        <pre>{error.message || String(error)}</pre>
        <button className="btn solid" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
