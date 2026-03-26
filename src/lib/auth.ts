import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins/username";
import { sendResetEmail } from "./auth-email";
import { pool } from "./postgres";

export const auth = betterAuth({
	database: pool,
	emailAndPassword: {
		enabled: true,
		disableSignUp: true,
		resetPasswordTokenExpiresIn: 3600,
		sendResetPassword: async ({ user, url }) => {
			// Non-awaited fire-and-forget to prevent timing attacks
			void sendResetEmail({ email: user.email, name: user.name }, url);
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
