import path from "node:path";
import react from "@vitejs/plugin-react";

export default {
	plugins: [react()],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		globals: true,
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/tests/**",
			"**/.claude/**",
		],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
};
