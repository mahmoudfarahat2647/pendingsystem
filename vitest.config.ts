import path from "node:path";

export default {
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		globals: true,
		exclude: ["**/node_modules/**", "**/dist/**", "**/tests/**"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
};
