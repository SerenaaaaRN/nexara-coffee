import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "../db/index.js";
import { resend } from "./resend.js";

const betterAuthUrl = process.env.BETTER_AUTH_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!betterAuthUrl) {
	throw new Error("BETTER_AUTH_URL environment variable is not set");
}

if (!googleClientId || !googleClientSecret) {
	throw new Error(
		"GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set for Google OAuth",
	);
}

const emailFrom = process.env.EMAIL_FROM ?? "noreply@rillah.dev";

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: betterAuthUrl,
	user: {
		additionalFields: {
			role: {
				type: "string",
				required: true,
				defaultValue: "visitor",
				input: false,
			},
		},
	},
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
			strategy: "jwt",
		},
	},
	emailAndPassword: {
		enabled: true,
		sendResetPassword: async ({ user, url }) => {
			try {
				await resend.emails.send({
					from: `Nexara <${emailFrom}>`,
					to: user.email,
					subject: "Reset your password",
					html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2>Reset your password</h2>
              <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
              <a href="${url}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Reset Password
              </a>
              <p style="color: #666;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
				});
			} catch (err) {
				console.error("Failed to send reset password email:", err);
			}
		},
		resetPasswordTokenExpiresIn: 60 * 30,
	},
	trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
		? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
		: [betterAuthUrl, process.env.FRONTEND_URL ?? "http://localhost:3000"],
	csrf: {
		enabled: true,
		origin: betterAuthUrl,
	},
	socialProviders: {
		google: {
			clientId: googleClientId,
			clientSecret: googleClientSecret,
		},
	},
});
