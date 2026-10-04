import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { resend } from "./resend";

const requireEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
};

const env = {
    BETTER_AUTH_URL: requireEnv("BETTER_AUTH_URL"),
    GOOGLE_CLIENT_ID: requireEnv("GOOGLE_CLIENT_ID"),
    GOOGLE_CLIENT_SECRET: requireEnv("GOOGLE_CLIENT_SECRET"),
    EMAIL_FROM: requireEnv("EMAIL_FROM"),
    DATABASE_URL: requireEnv("DATABASE_URL"),
    TRUSTED_ORIGINS: process.env.BETTER_AUTH_TRUSTED_ORIGINS,
} as const;

// Kysely khusus untuk tabel auth Better Auth.
// Query bisnis tetap pakai supabase-js via @database/server.
const db = new Kysely({
    dialect: new PostgresDialect({
        pool: new pg.Pool({ connectionString: env.DATABASE_URL }),
    }),
    plugins: [new CamelCasePlugin()],
});

const buildResetPasswordHtml = (url: string) => `
  <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
    <h2>Reset your password</h2>
    <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
    <a href="${url}" 
       style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 16px 0;">
      Reset Password
    </a>
    <p style="color: #666;">If you didn't request this, you can safely ignore this email.</p>
  </div>
`;

export const auth = betterAuth({
    database: kyselyAdapter(db, { type: "postgres" }),

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
        resetPasswordTokenExpiresIn: 60 * 30,
        sendResetPassword: async ({ user, url }) => {
            try {
                await resend.emails.send({
                    from: `Nexara <${env.EMAIL_FROM}>`,
                    to: user.email,
                    subject: "Reset your password",
                    html: buildResetPasswordHtml(url),
                });
            } catch (err) {
                console.error(
                    "[Auth] Failed to send reset password email:",
                    err,
                );
            }
        },
    },

    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },

    plugins: [tanstackStartCookies()],

    trustedOrigins: env.TRUSTED_ORIGINS
        ? env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
        : [env.BETTER_AUTH_URL],

    csrf: {
        enabled: true,
        origin: env.BETTER_AUTH_URL,
    },
});
