const requireEnv = (name: string): string => {
	const value = process.env[name];
	if (!value) {
		throw new Error(`${name} environment variable is not set`);
	}
	return value;
};

export const env = {
	get DATABASE_URL() {
		return requireEnv("DATABASE_URL");
	},
	get BETTER_AUTH_SECRET() {
		return requireEnv("BETTER_AUTH_SECRET");
	},
	get BETTER_AUTH_URL() {
		return requireEnv("BETTER_AUTH_URL");
	},
	get GOOGLE_CLIENT_ID() {
		return requireEnv("GOOGLE_CLIENT_ID");
	},
	get GOOGLE_CLIENT_SECRET() {
		return requireEnv("GOOGLE_CLIENT_SECRET");
	},
	get ABLY_API_KEY() {
		return requireEnv("ABLY_API_KEY");
	},
	get RESEND_API_KEY() {
		return requireEnv("RESEND_API_KEY");
	},
	get CLOUDINARY_CLOUD_NAME() {
		return (
			process.env.CLOUDINARY_CLOUD_NAME ??
			process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
			""
		);
	},
	get CLOUDINARY_API_KEY() {
		return requireEnv("CLOUDINARY_API_KEY");
	},
	get CLOUDINARY_API_SECRET() {
		return requireEnv("CLOUDINARY_API_SECRET");
	},
	get FRONTEND_URL() {
		return process.env.FRONTEND_URL ?? "http://localhost:5173";
	},
	get BETTER_AUTH_TRUSTED_ORIGINS() {
		return (
			process.env.BETTER_AUTH_TRUSTED_ORIGINS ??
			process.env.FRONTEND_URL ??
			"http://localhost:5173"
		);
	},
	get EMAIL_FROM() {
		return process.env.EMAIL_FROM ?? "noreply@rillah.dev";
	},
	get PORT() {
		return Number(process.env.PORT ?? 3000);
	},
} as const;

export function validateCloudinaryEnv(): void {
	if (
		!env.CLOUDINARY_CLOUD_NAME ||
		!process.env.CLOUDINARY_API_KEY ||
		!process.env.CLOUDINARY_API_SECRET
	) {
		throw new Error(
			"Missing Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)",
		);
	}
}
