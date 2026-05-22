import path from "node:path";
import react from "@vitejs/plugin-react";

export default {
	plugins: [react()],
	test: {
		environment: "jsdom",
		pool: "vmForks",
		setupFiles: ["./src/test/setup.ts"],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/tests/**",
			"**/.claude/**",
		],
		env: {
			SKIP_ENV_VALIDATION: "true",
			NEXT_PUBLIC_SUPABASE_URL: "https://mock-supabase-url.supabase.co",
			NEXT_PUBLIC_SUPABASE_ANON_KEY: "mock-anon-key",
			NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET: "attachments",
			DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
			BETTER_AUTH_URL: "http://localhost:3000",
			BETTER_AUTH_SECRET: "mock-secret-for-testing-min-32-chars-long",
			RESEND_API_KEY: "re_mock_key",
			RESEND_FROM_EMAIL: "test@example.com",
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
};
