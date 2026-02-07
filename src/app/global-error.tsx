"use client";

import { Inter } from "next/font/google";
import { useEffect } from "react";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
});

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
			<body className={inter.className}>
				<div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0b] text-white p-6">
					<div className="w-full max-w-md p-8 rounded-2xl bg-[#141416] border border-white/10 shadow-2xl space-y-6 text-center">
						<div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="w-8 h-8 text-red-500"
							>
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
								onClick={() => window.location.reload()}
								className="w-full px-4 py-3 bg-renault-yellow hover:bg-yellow-500 text-black font-bold rounded-xl transition-all"
							>
								{isChunkError ? "Refresh Page" : "Reload System"}
							</button>
							{!isChunkError && (
								<button
									onClick={() => reset()}
									className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-all border border-white/5"
								>
									Try Again
								</button>
							)}
						</div>

						<div className="pt-4 border-t border-white/5">
							<p className="text-[10px] text-gray-600 font-mono">
								Error ID: {error.digest || "Unknown"}
							</p>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
