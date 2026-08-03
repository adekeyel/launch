import { Component } from "react";

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
          <h1 className="font-display text-2xl font-bold text-ink">Something went wrong</h1>
          <p className="max-w-sm text-sm text-ink/55">
            The page hit an unexpected error. Try reloading — if it keeps happening, check the browser console for
            details.
          </p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-2">
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
