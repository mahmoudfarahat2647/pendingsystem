/** Shared glass-card field styles for the auth forms (login, forgot, reset). */

export const authLabelClass =
	"block text-[13px] font-medium mb-1.5 text-black/80 dark:text-white/90";

export const authInputWrapClass =
	"flex items-center h-10 rounded-lg px-3 border bg-white/40 border-black/10 dark:bg-white/[0.06] dark:border-white/20 focus-within:border-[#FFCC00]/70 focus-within:ring-2 focus-within:ring-[#FFCC00]/20 transition-colors";

export const authInputClass =
	"w-full h-full bg-transparent text-black dark:text-white text-sm outline-none border-none focus:outline-none focus:ring-0 [&:-webkit-autofill]:transition-colors [&:-webkit-autofill]:duration-[5000s] [&:-webkit-autofill]:[WebkitTextFillColor:black] dark:[&:-webkit-autofill]:[WebkitTextFillColor:white]";

export const authEyeButtonClass =
	"flex-shrink-0 flex items-center p-1 bg-transparent border-none cursor-pointer text-black/50 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors duration-150 outline-none";

export const authFieldErrorClass = "text-red-400 text-xs mt-1.5";

export const authSubmitClass =
	"w-full h-10 rounded-lg bg-[#FFCC00] hover:bg-[#FFCC00]/90 text-black font-semibold shadow-[0_4px_14px_rgba(255,204,0,0.2)] transition-all active:scale-[0.98]";

export const authLinkClass =
	"text-[13px] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors";
