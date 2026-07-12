import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="font-display text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-muted-foreground mb-6">
            عذراً، يبدو أن هناك مشكلة تقنية. يرجى المحاولة مرة أخرى.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-primary text-primary-foreground px-6 py-3 font-semibold flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            تحديث الصفحة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
