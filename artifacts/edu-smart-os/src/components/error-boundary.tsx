import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "حدث خطأ غير متوقع";
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch() {
    // Error already captured in getDerivedStateFromError
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-background p-6"
        >
          <div className="max-w-md w-full text-center space-y-4">
            <div className="text-6xl mb-2">⚠️</div>
            <h1 className="text-2xl font-bold text-secondary">
              حدث خطأ في التطبيق
            </h1>
            <p className="text-muted-foreground text-sm">
              {this.state.errorMessage}
            </p>
            <button
              onClick={this.handleReset}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
