import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	client: {
		NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
		NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
		NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
		NEXT_PUBLIC_SETTINGS_PASSWORD: z.string().optional(),
		NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET: z.string().default("attachments"),
	},
	server: {
		SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
		GITHUB_PAT: z.string().optional(),
		GITHUB_OWNER: z.string().optional(),
		GITHUB_REPO: z.string().optional(),
		DATABASE_URL: z.string().url(),
		BETTER_AUTH_URL: z.string().url(),
		BETTER_AUTH_SECRET: z.string().min(32),
		RESEND_API_KEY: z.string().min(1),
		RESEND_FROM_EMAIL: z.string().email(),
	},
	runtimeEnv: {
		NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
		NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
		NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
		NEXT_PUBLIC_SETTINGS_PASSWORD: process.env.NEXT_PUBLIC_SETTINGS_PASSWORD,
		NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET:
			process.env.NEXT_PUBLIC_SUPABASE_ATTACHMENTS_BUCKET,
		SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
		GITHUB_PAT: process.env.GITHUB_PAT,
		GITHUB_OWNER: process.env.GITHUB_OWNER,
		GITHUB_REPO: process.env.GITHUB_REPO,
		DATABASE_URL: process.env.DATABASE_URL,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		RESEND_API_KEY: process.env.RESEND_API_KEY,
		RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
	},
});
