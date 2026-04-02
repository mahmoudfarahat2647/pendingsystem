"use client";

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
		<div
			className="min-h-screen flex items-center justify-start relative px-4 sm:px-12 md:px-24 xl:px-48"
			style={{
				backgroundImage: "url('/auth-background.webp')",
				backgroundSize: "cover",
				backgroundPosition: "center",
			}}
		>
			<div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

			{/* Card */}
			<div className="relative z-10 w-full max-w-[380px]">
				<div className="bg-[#0A0A0A]/60 border border-white/5 border-t-white/10 rounded-3xl px-8 pb-8 pt-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-all relative overflow-hidden flex flex-col items-center">
					{/* Outer inner glow effect */}
					<div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

					{/* Logo mark */}
					<div className="flex flex-col items-center mb-10 relative z-10 w-full">
						<div className="relative inline-block">
							<h1 className="text-[40px] leading-tight font-extrabold tracking-widest text-white">
								Eim
							</h1>
							<div className="absolute -bottom-1 left-0 right-0 h-1 bg-[#FFCC00] rounded-sm shadow-[0_0_10px_rgba(255,204,0,0.4)]"></div>
						</div>
					</div>

					{title && (
						<h2 className="text-xl font-bold text-white/90 mb-1 text-center w-full relative z-10">
							{title}
						</h2>
					)}
					{subtitle && (
						<p className="text-white/40 text-sm mb-8 text-center w-full relative z-10">
							{subtitle}
						</p>
					)}

					<div className="w-full relative z-10">{children}</div>
				</div>
			</div>

			<div className="absolute bottom-12 left-0 right-0 flex flex-col items-center justify-center z-10 select-none pointer-events-none">
				<div className="w-64 h-[2px] bg-gradient-to-r from-transparent via-[#FFCC00]/80 to-transparent mb-4 shadow-[0_0_15px_rgba(255,204,0,0.6)]" />
				<p className="text-[16px] tracking-[0.8em] uppercase font-thin text-white/20 ml-[0.2em] [text-shadow:-1px_-1px_1px_rgba(0,0,0,0.8),_1px_1px_1px_rgba(255,255,255,0.15)]">
					pending system
				</p>
			</div>
		</div>
	);
}
