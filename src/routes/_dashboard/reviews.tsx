import { createFileRoute } from "@tanstack/react-router";
import { ReviewsSkeleton } from "@/components/fallbacks/dashboard";
import { ReviewsPage } from "@/features/reviews/components/reviews-page";
import { reviewsOptions } from "@/features/reviews/hooks/useReviewQueries";
import { requireAccessRSC } from "@/lib/with-auth.server";

export const Route = createFileRoute("/_dashboard/reviews")({
    beforeLoad: () => requireAccessRSC("read", "reviews"),
    loader: ({ context: { queryClient } }) =>
        queryClient.ensureQueryData(reviewsOptions()),
    head: () => ({
        meta: [
            { title: "Reviews" },
            {
                name: "description",
                content: "Manage customer reviews and feedback.",
            },
        ],
    }),
    component: ReviewsPage,
    pendingMs: 0,
    pendingComponent: ReviewsSkeleton,
});
