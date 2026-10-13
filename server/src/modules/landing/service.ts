import { ok } from "../../lib/http.js";
import { checkRate } from "../../utils/effects.js";
import { landingRepo } from "./repository.js";

export const getPublicBranches = async () => {
	const limited = checkRate("landing:public-branches", 60, 60_000);
	if (limited) return limited;

	return ok(await landingRepo.branches());
};

export const getPublicMenu = async () => {
	const limited = checkRate("landing:public-menu", 60, 60_000);
	if (limited) return limited;

	const rows = await landingRepo.menu();
	const data = rows
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

	return ok(data);
};

export const getPublicReviews = async () => {
	const limited = checkRate("landing:public-reviews", 60, 60_000);
	if (limited) return limited;

	const rows = await landingRepo.reviews();
	const data = rows.map((r) => ({
		id: r.id,
		rating: Number(r.rating),
		comment: (r.comment as string).trim(),
		customerName: r.customerName,
		branchName: r.branchName,
	}));

	return ok(data);
};
