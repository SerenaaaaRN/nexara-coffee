import { kyselyAdapter } from "@better-auth/kysely-adapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { resend } from "./resend";

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

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
}

// Kysely hanya untuk tabel auth Better Auth (user/session/account/verification).
// Query bisnis memakai supabase-js via @database/server — bukan Kysely.
// CamelCasePlugin wajib: kolom DB snake_case (user_id), field Better Auth
// camelCase (userId) — tanpa ini semua query auth gagal (42703).
const kysely = new Kysely({
    dialect: new PostgresDialect({
        pool: new pg.Pool({ connectionString: databaseUrl }),
    }),
    plugins: [new CamelCasePlugin()],
});

export const auth = betterAuth({
    database: kyselyAdapter(kysely, {
        type: "postgres",
    }),
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
        // Cache session di cookie (signed JWT) supaya getSession() tidak
        // query DB berulang kali — RBAC (session.user.role) dibaca dari cookie.
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
    plugins: [tanstackStartCookies()],
    trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS
        ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
        : [betterAuthUrl],
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
