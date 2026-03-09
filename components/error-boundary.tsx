"use client";

import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Component Error Caught by Boundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 my-4 border border-amber-500/20 bg-amber-500/5 rounded-xl backdrop-blur-sm">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
          <h2 className="text-base font-semibold text-foreground mb-1">Component Failure</h2>
          <p className="text-xs text-muted-foreground mb-4 text-center max-w-sm">
            This specific section failed to load properly. The rest of the app is still functioning.
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={this.handleReset}
            className="gap-2 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Reload Section
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}