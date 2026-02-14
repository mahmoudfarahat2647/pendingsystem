"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

export class OrderFormErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("[OrderFormErrorBoundary] Error caught:", error);
		console.error("[OrderFormErrorBoundary] Error info:", errorInfo);

		// Log error details for debugging
		if (typeof globalThis.window !== "undefined") {
			console.error(
				"[OrderFormErrorBoundary] Stack trace:",
				errorInfo.componentStack,
			);
		}
	}

	private handleRetry = () => {
		this.setState({ hasError: false, error: undefined, errorInfo: undefined });
	};

	public render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="p-6">
						<div className="flex items-center space-x-3">
							<AlertTriangle className="h-6 w-6 text-red-600" />
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-red-800">
									Unable to Load Order Form
								</h3>
								<p className="text-sm text-red-600 mt-1">
									There was an error loading the order creation form. This might
									be due to corrupted data or a temporary issue.
								</p>
							</div>
						</div>

						{this.state.error && (
							<details className="mt-4">
								<summary className="text-sm font-medium text-red-700 cursor-pointer">
									Technical Details
								</summary>
								<pre className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">
									{this.state.error.stack}
								</pre>
							</details>
						)}

						<div className="mt-4 flex space-x-2">
							<Button
								onClick={this.handleRetry}
								variant="outline"
								className="flex items-center space-x-2"
							>
								<RefreshCw className="h-4 w-4" />
								<span>Try Again</span>
							</Button>
							<Button
								onClick={() => globalThis.window?.location.reload()}
								variant="destructive"
							>
								Reload Page
							</Button>
						</div>
					</CardContent>
				</Card>
			);
		}

		return this.props.children;
	}
}
