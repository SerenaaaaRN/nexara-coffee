import { Quote, Star } from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from "@/components/ui/card";
import { SectionHeading } from "@/features/landing/components/landing-motion";
import type { PublicReview } from "@/features/landing/types";
import { cn } from "@/utils/cn";

export const LandingTestimonials = ({
    reviews,
}: {
    reviews: PublicReview[];
}) => {
    if (!reviews.length) return null;

    return (
        <section
            id="cerita"
            aria-label="Testimonial"
            className="scroll-mt-24 border-t">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 ">
                <SectionHeading
                    title="Kata mereka yang kembali"
                    body="Ulasan asli pelanggan, hanya yang lolos kurasi yang tampil di sini."
                />
            </div>

            <div className="overflow-hidden pb-10 mask-linear-to-r from-transparent via-black to-transparent mask-x-8">
                <div className="landing-review-track flex w-max items-stretch gap-3 sm:gap-4">
                    {[0, 1].map((half) => (
                        <div
                            key={half}
                            aria-hidden={half === 1}
                            className="flex w-max shrink-0 items-stretch gap-3 pr-3 sm:gap-4 sm:pr-4">
                            {reviews.map((r) => {
                                const displayName =
                                    r.customerName ?? "Pelanggan Nexara";
                                const initial = displayName
                                    .charAt(0)
                                    .toUpperCase();

                                return (
                                    <Card
                                        key={`${half}-${r.id}`}
                                        className="w-64 shrink-0 [--card-spacing:--spacing(3.5)] sm:w-72 md:w-80">
                                        <CardHeader className="pb-0">
                                            <div
                                                role="img"
                                                aria-label={`Rating ${r.rating} dari 5`}
                                                className="flex items-center gap-0.5">
                                                {Array.from(
                                                    { length: 5 },
                                                    (_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={cn(
                                                                "size-3",
                                                                i < r.rating
                                                                    ? "fill-current text-foreground"
                                                                    : "fill-transparent text-muted-foreground/40",
                                                            )}
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="min-h-18 flex-1">
                                            <p className="line-clamp-3 font-serif text-sm leading-relaxed italic">
                                                &ldquo;{r.comment}&rdquo;
                                            </p>
                                        </CardContent>

                                        <CardFooter className="gap-2 bg-transparent py-2.5">
                                            <span
                                                aria-hidden
                                                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                                                {initial}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-xs font-bold">
                                                    {displayName}
                                                </p>
                                                <p className="truncate text-[10px] text-muted-foreground">
                                                    {r.branchName
                                                        ? `Cabang ${r.branchName}`
                                                        : "Pelanggan terverifikasi"}
                                                </p>
                                            </div>
                                            <Quote
                                                aria-hidden
                                                className="size-3.5 shrink-0 opacity-20"
                                            />
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
