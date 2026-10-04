import { SectionHeader } from "#/components/shared/section-header";
import { ReviewsTable } from "@/features/reviews/components/reviews-table";

export function ReviewsPage() {
    return (
        <div className="space-y-6">
            <SectionHeader
                title="Reviews"
                subtitle="Manage customer reviews and feedback."
            />
            <ReviewsTable />
        </div>
    );
}
