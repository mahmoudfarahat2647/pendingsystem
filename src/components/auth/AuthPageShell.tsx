"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

const ShiningText = dynamic(
	() => import("@/components/ui/shining-text").then((m) => m.ShiningText),
	{ ssr: false },
);

interface AuthPageShellProps {
	title?: string;
	subtitle?: string;
	children: React.ReactNode;
}

export function AuthPageShell({
	title,
	subtitle,
	children,
}: AuthPageShellProps) {
	return (
		<div className="min-h-screen flex items-center justify-start relative px-4 sm:px-12 md:px-24 xl:px-48">
			<Image
				src="/login-background-city.webp"
				alt="Background"
				fill
				priority
				fetchPriority="high"
				quality={90}
				className="object-cover -z-10"
			/>
			<div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-transparent dark:from-black/35 dark:via-transparent dark:to-transparent pointer-events-none -z-10" />

			{/* Card */}
			<div className="relative z-10 w-full max-w-[340px]">
				<div className="relative overflow-hidden rounded-2xl p-6 border bg-white/40 border-white/60 dark:bg-white/[0.02] dark:border-white/15 backdrop-blur-md backdrop-saturate-150 shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all">
					{/* Glass highlight */}
					<div className="absolute inset-0 bg-gradient-to-b from-white/20 dark:from-white/[0.05] to-transparent pointer-events-none" />

					{/* Logo mark */}
					<div className="relative z-10 mb-5">
						<h1 className="text-xl leading-tight font-bold tracking-wide text-black dark:text-white">
							Eim
						</h1>
						<div className="mt-1 w-6 h-[3px] bg-[#FFCC00] rounded-sm shadow-[0_0_10px_rgba(255,204,0,0.4)]" />
					</div>

					{title && (
						<h2 className="relative z-10 text-2xl font-bold text-black dark:text-white mb-1">
							{title}
						</h2>
					)}
					{subtitle && (
						<p className="relative z-10 text-[13px] text-black/60 dark:text-white/70 mb-6">
							{subtitle}
						</p>
					)}

					<div className="w-full relative z-10">{children}</div>
				</div>
			</div>

			<div className="absolute bottom-12 left-0 right-0 flex flex-col items-center justify-center z-10 select-none pointer-events-none">
				<div className="w-64 h-[2px] bg-gradient-to-r from-transparent via-[#FFCC00]/80 to-transparent mb-4 shadow-[0_0_15px_rgba(255,204,0,0.6)]" />
				<ShiningText
					text="pending system"
					className="bg-[linear-gradient(110deg,#525252,35%,#000,50%,#525252,75%,#525252)] dark:bg-[linear-gradient(110deg,#404040,35%,#fff,50%,#404040,75%,#404040)] text-[16px] tracking-[0.8em] uppercase font-thin ml-[0.2em] [text-shadow:none] dark:[text-shadow:-1px_-1px_1px_rgba(0,0,0,0.8),_1px_1px_1px_rgba(255,255,255,0.15)]"
				/>
			</div>
		</div>
	);
}
