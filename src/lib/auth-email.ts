import { resend } from "./resend";

export async function sendResetEmail(
	user: { email: string; name: string },
	resetUrl: string,
): Promise<void> {
	await resend.emails.send({
		from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
		to: user.email,
		subject: "Reset your password",
		html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>Hi ${user.name},</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="color: #ffcc00;">Reset Password</a></p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
		text: `Reset your password\n\nHi ${user.name},\n\nClick the link below to reset your password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request a password reset, you can ignore this email.`,
	});
}
