"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Global Error:", error);
	}, [error]);

	const isChunkError =
		error.name === "ChunkLoadError" ||
		error.message?.includes("Loading chunk") ||
		error.message?.includes("ChunkLoadError");

	return (
		<html lang="en">
			<body className="font-sans">
				<div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0b] p-6 text-white">
					<div className="w-full max-w-md space-y-6 rounded-2xl border border-white/10 bg-[#141416] p-8 text-center shadow-2xl">
						<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="h-8 w-8 text-red-500"
								role="img"
								aria-label="Error icon"
							>
								<title>Error icon</title>
								<circle cx="12" cy="12" r="10" />
								<line x1="12" y1="8" x2="12" y2="12" />
								<line x1="12" y1="16" x2="12.01" y2="16" />
							</svg>
						</div>

						<div className="space-y-2">
							<h2 className="text-xl font-bold tracking-tight">
								{isChunkError ? "Update Available" : "System Error"}
							</h2>
							<p className="text-sm text-gray-400">
								{isChunkError
									? "A new version of the system is available. Please refresh to continue."
									: error.message || "A critical system error occurred."}
							</p>
						</div>

						<div className="flex flex-col gap-3">
							<button
								type="button"
								onClick={() => window.location.reload()}
								className="w-full rounded-xl bg-renault-yellow px-4 py-3 font-bold text-black transition-all hover:bg-yellow-500"
							>
								{isChunkError ? "Refresh Page" : "Reload System"}
							</button>
							{!isChunkError && (
								<button
									type="button"
									onClick={() => reset()}
									className="w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 font-medium text-white transition-all hover:bg-white/10"
								>
									Try Again
								</button>
							)}
						</div>

						<div className="border-t border-white/5 pt-4">
							<p className="font-mono text-[10px] text-gray-600">
								Error ID: {error.digest || "Unknown"}
							</p>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
