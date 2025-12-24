"use client";

import { AlertTriangle } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallbackTitle?: string;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ClientErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center p-6 bg-red-500/5 border border-red-500/20 rounded-xl space-y-4">
					<div className="p-3 bg-red-500/10 rounded-full">
						<AlertTriangle className="w-8 h-8 text-red-500" />
					</div>
					<div className="text-center">
						<h3 className="text-lg font-semibold text-white mb-1">
							{this.props.fallbackTitle || "Component Error"}
						</h3>
						<p className="text-sm text-gray-400 font-mono max-w-md break-words mb-4">
							{this.state.error?.message || "An unknown error occurred"}
						</p>
						<button
							onClick={() => this.setState({ hasError: false, error: null })}
							className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
						>
							Try Again
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
