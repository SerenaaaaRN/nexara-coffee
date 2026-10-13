import { eq, inArray, ne } from "drizzle-orm";
import { db } from "../../db/index.js";
import { user as userTable } from "../../db/schema/auth-schema.js";
import { branches } from "../../db/schema/branches.js";

export const settingsRepo = {
	otherUsers: async (userId: string) => {
		return db
			.select({
				id: userTable.id,
				name: userTable.name,
				email: userTable.email,
				role: userTable.role,
				image: userTable.image,
				createdAt: userTable.createdAt,
			})
			.from(userTable)
			.where(ne(userTable.id, userId))
			.orderBy(userTable.name);
	},

	setProfile: async (userId: string, name: string) => {
		const [row] = await db
			.update(userTable)
			.set({ name })
			.where(eq(userTable.id, userId))
			.returning();
		return row ?? null;
	},

	findRole: async (userId: string) => {
		const [row] = await db
			.select({ id: userTable.id, role: userTable.role })
			.from(userTable)
			.where(eq(userTable.id, userId))
			.limit(1);
		return row ?? null;
	},

	setRole: async (userId: string, role: string) => {
		const [row] = await db
			.update(userTable)
			.set({ role })
			.where(eq(userTable.id, userId))
			.returning();
		return row ?? null;
	},

	setAvatar: async (userId: string, image: string | null) => {
		await db.update(userTable).set({ image }).where(eq(userTable.id, userId));
	},

	allBranches: async () => {
		return db
			.select({ id: branches.id, name: branches.name })
			.from(branches)
			.orderBy(branches.name);
	},

	scopedBranches: async (ids: string[]) => {
		return db
			.select({ id: branches.id, name: branches.name })
			.from(branches)
			.where(inArray(branches.id, ids))
			.orderBy(branches.name);
	},
};
