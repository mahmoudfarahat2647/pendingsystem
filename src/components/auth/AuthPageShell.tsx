"use client";

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthPageShell({ title, subtitle, children }: AuthPageShellProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: "url('/auth-background.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-black/80 border border-white/10 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#FFCC00] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,204,0,0.3)]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-6 h-6" role="img" aria-label="pendingsystem Logo">
                <g transform="translate(16, 16)">
                  <rect x="-8" y="-13" width="4.5" height="26" rx="2.25" fill="#000000" transform="rotate(-8)" />
                  <rect x="3.5" y="-13" width="4.5" height="26" rx="2.25" fill="#000000" transform="rotate(-8)" />
                  <rect x="-13" y="-6.25" width="26" height="4.5" rx="2.25" fill="#000000" transform="rotate(-8)" />
                  <rect x="-13" y="1.75" width="26" height="4.5" rx="2.25" fill="#000000" transform="rotate(-8)" />
                </g>
              </svg>
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-none">BODY&PAINT</p>
              <p className="text-[#FFCC00] text-xs tracking-[0.2em] leading-none mt-1">pending system</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          {subtitle && <p className="text-gray-400 text-sm mb-6">{subtitle}</p>}

          {children}
        </div>
      </div>
    </div>
  );
}
