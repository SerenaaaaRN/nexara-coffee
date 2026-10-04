import { asc, desc, eq } from "drizzle-orm";
import { status } from "elysia";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { customers, reviews } from "../../db/schema/customers.js";
import { menuCategories, menuItems } from "../../db/schema/menu.js";
import { rateLimit } from "../../lib/rate-limit.js";

/** Endpoint publik landing — tanpa auth, rateLimit 60/menit (port useLandingQueries.ts). */

export const getPublicBranches = async () => {
	if (!rateLimit("landing:public-branches", 60, 60_000)) {
		return status(429, { success: false as const, error: "Too many requests" });
	}
	const rows = await db
		.select({
			id: branches.id,
			name: branches.name,
			address: branches.address,
			lat: branches.lat,
			lng: branches.lng,
			phone: branches.phone,
			openingTime: branches.openingTime,
			closingTime: branches.closingTime,
			ownershipType: branches.ownershipType,
		})
		.from(branches)
		.where(eq(branches.status, "active"))
		.orderBy(asc(branches.name));
	return { success: true as const, data: rows };
};

export const getPublicMenu = async () => {
	if (!rateLimit("landing:public-menu", 60, 60_000)) {
		return status(429, { success: false as const, error: "Too many requests" });
	}
	const rows = await db
		.select({
			id: menuItems.id,
			categoryId: menuItems.categoryId,
			name: menuItems.name,
			description: menuItems.description,
			price: menuItems.price,
			imageUrl: menuItems.imageUrl,
			categoryIdJoined: menuCategories.id,
			categoryName: menuCategories.name,
			categoryDisplayOrder: menuCategories.displayOrder,
		})
		.from(menuItems)
		.leftJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
		.where(eq(menuItems.isAvailable, true))
		.orderBy(asc(menuItems.name))
		.limit(24);
	// Filter item tanpa kategori + sort displayOrder lalu nama (parity coffee).
	const data = rows
		.filter((r) => r.categoryIdJoined !== null)
		.map((r) => ({
			id: r.id,
			categoryId: r.categoryId,
			name: r.name,
			description: r.description,
			price: Number(r.price),
			imageUrl: r.imageUrl,
			category: {
				id: r.categoryIdJoined as string,
				name: r.categoryName as string,
				displayOrder: Number(r.categoryDisplayOrder ?? 0),
			},
		}))
		.sort(
			(a, b) =>
				a.category.displayOrder - b.category.displayOrder ||
				a.name.localeCompare(b.name),
		);
	return { success: true as const, data };
};

export const getPublicReviews = async () => {
	if (!rateLimit("landing:public-reviews", 60, 60_000)) {
		return status(429, { success: false as const, error: "Too many requests" });
	}
	const rows = await db
		.select({
			id: reviews.id,
			rating: reviews.rating,
			comment: reviews.comment,
			customerName: customers.fullName,
			branchName: branches.name,
		})
		.from(reviews)
		.leftJoin(customers, eq(reviews.customerId, customers.id))
		.leftJoin(branches, eq(reviews.branchId, branches.id))
		.where(eq(reviews.status, "approved"))
		.orderBy(desc(reviews.createdAt))
		.limit(10);
	const data = rows
		.filter((r) => r.comment !== null && r.comment.trim() !== "")
		.map((r) => ({
			id: r.id,
			rating: Number(r.rating),
			comment: (r.comment as string).trim(),
			customerName: r.customerName,
			branchName: r.branchName,
		}));
	return { success: true as const, data };
};
