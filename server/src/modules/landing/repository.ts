import { and, asc, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { branches } from "../../db/schema/branches.js";
import { customers, reviews } from "../../db/schema/customers.js";
import { menuCategories, menuItems } from "../../db/schema/menu.js";

export const landingRepo = {
	branches: async () => {
		return db
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
	},

	menu: async () => {
		return db
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
			.innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
			.where(eq(menuItems.isAvailable, true))
			.orderBy(asc(menuItems.name))
			.limit(24);
	},

	reviews: async () => {
		return db
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
			.where(
				and(
					isNotNull(reviews.comment),
					sql`length(trim(${reviews.comment})) > 0`,
					eq(reviews.status, "approved"),
				),
			)
			.orderBy(desc(reviews.createdAt))
			.limit(10);
	},
};
