import { t } from "elysia";

export const reviewsQuery = t.Object({
	branchId: t.Optional(t.String()),
	status: t.Optional(t.String()),
	rating: t.Optional(t.Numeric({ minimum: 1, maximum: 5 })),
});


export const replyReviewBody = t.Object({
	reply: t.String({ minLength: 1, maxLength: 1000 }),
});

export const moderateReviewBody = t.Object({
	status: t.Union([t.Literal("approved"), t.Literal("rejected")]),
});
