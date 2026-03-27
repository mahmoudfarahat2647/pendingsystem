import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins/username";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import { sendResetEmail } from "./auth-email";
import { pool } from "./postgres";

const db = new Kysely({
	dialect: new PostgresDialect({ pool }),
	plugins: [new CamelCasePlugin()],
});

export const auth = betterAuth({
	database: { db, type: "postgres" },
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	emailAndPassword: {
		enabled: true,
		disableSignUp: true,
		resetPasswordTokenExpiresIn: 3600,
		sendResetPassword: async ({ user, url }) => {
			await sendResetEmail({ email: user.email, name: user.name }, url);
		},
	},
	disabledPaths: ["/sign-up/email"],
	plugins: [username()],
	user: {
		modelName: "auth_users",
	},
	session: {
		modelName: "auth_sessions",
		expiresIn: 3600,
		disableSessionRefresh: true,
	},
	account: {
		modelName: "auth_accounts",
	},
	verification: {
		modelName: "auth_verifications",
	},
});
