"use client";

import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-destructive/30 bg-white p-6">
          <h2 className="text-lg font-semibold text-destructive">App Unavailable</h2>
          <p className="mt-2 text-sm text-slate-600">This application crashed, but the shell is still running.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
