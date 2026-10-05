import { v2 as cloudinary } from "cloudinary";

const cloudName =
	process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??
	process.env.CLOUDINARY_CLOUD_NAME;

if (
	!cloudName ||
	!process.env.CLOUDINARY_API_KEY ||
	!process.env.CLOUDINARY_API_SECRET
) {
	throw new Error("Missing Cloudinary environment variables");
}

cloudinary.config({
	cloud_name: cloudName,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

function uploadBuffer(
	buffer: Buffer,
	folder?: string,
): Promise<{ url: string; publicId: string }> {
	return new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ folder: folder ?? "nexara/menu" },
			(error, result) => {
				if (error || !result) {
					reject(error ?? new Error("Upload failed"));
					return;
				}
				resolve({ url: result.secure_url, publicId: result.public_id });
			},
		);
		stream.end(buffer);
	});
}

export async function uploadImage(
	file: File,
	folder?: string,
): Promise<{ url: string; publicId: string }> {
	const buffer = Buffer.from(await file.arrayBuffer());
	return uploadBuffer(buffer, folder);
}

export async function uploadImageBase64(
	base64: string,
	folder?: string,
): Promise<{ url: string; publicId: string }> {
	const buffer = Buffer.from(base64, "base64");
	return uploadBuffer(buffer, folder);
}

export async function deleteImage(publicId: string) {
	await cloudinary.uploader.destroy(publicId);
}

export function getPublicId(url: string): string {
	const parts = url.split("/upload/");
	if (parts.length < 2) return "";
	return parts[1].replace(/^v\d+\//, "").replace(/\.[^.]+$/, "");
}
