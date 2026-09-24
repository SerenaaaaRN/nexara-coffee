import { Quote, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import {
    EASE,
    SectionHeading,
} from "@/features/landing/components/landing-motion";
import { LANDING_RITUALS } from "@/features/landing/data";
import type { PublicReview } from "@/features/landing/types";

const LandingRitual = () => {
    const reduce = useReducedMotion();

    return (
        <div id="ritual" className="scroll-mt-24">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <SectionHeading
                    title="Ritual di balik tiap cangkir"
                    body="Tiga langkah yang tidak pernah kami singkat, dari kebun sampai ke tanganmu."
                />
                <div className="relative">
                    {LANDING_RITUALS.map((ritual, i) => (
                        <motion.article
                            key={ritual.index}
                            initial={reduce ? false : { opacity: 0, y: 48 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.6, ease: EASE }}
                            style={{ top: `${6 + i * 1.5}rem` }}
                            className="sticky mb-6 overflow-hidden rounded-3xl border bg-card shadow-xl">
                            <div className="grid md:grid-cols-2">
                                <div className="relative min-h-64 overflow-hidden md:min-h-105">
                                    <img
                                        src={ritual.image}
                                        alt={ritual.title}
                                        loading="lazy"
                                        className="absolute inset-0 h-full w-full object-cover"
                                    />
                                    <span className="absolute top-4 left-4 rounded-full border bg-background/70 px-3 py-1 font-mono text-xs font-semibold backdrop-blur-md">
                                        {ritual.index}
                                    </span>
                                </div>
                                <div className="flex flex-col justify-center gap-3 p-7 md:p-10">
                                    <p className="font-mono text-sm text-muted-foreground">
                                        Langkah {ritual.index}
                                    </p>
                                    <h3 className="text-2xl font-bold tracking-tight text-balance md:text-3xl">
                                        {ritual.title}
                                    </h3>
                                    <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
                                        {ritual.description}
                                    </p>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ReviewCard = ({ item }: { item: PublicReview }) => {
    const displayName = item.customerName ?? "Pelanggan Nexara";
    return (
        <article className="flex h-60 w-72 shrink-0 flex-col rounded-3xl border bg-card p-5 shadow-sm md:w-80">
            <div
                role="img"
                aria-label={`Rating ${item.rating} dari 5`}
                className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                    <Star
                        key={i}
                        className={
                            i < item.rating
                                ? "size-3.5 fill-current text-foreground"
                                : "size-3.5 text-muted-foreground/40"
                        }
                    />
                ))}
            </div>
            <p className="mt-3 line-clamp-4 flex-1 font-serif text-base leading-relaxed italic">
                &ldquo;{item.comment}&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-2.5 border-t pt-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {displayName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {item.branchName
                            ? `Cabang ${item.branchName}`
                            : "Pelanggan terverifikasi"}
                    </p>
                </div>
                <Quote
                    aria-hidden
                    className="ml-auto size-4 shrink-0 opacity-20"
                />
            </div>
        </article>
    );
};

const LandingTestimonials = ({ items }: { items: PublicReview[] }) => {
    if (items.length === 0) return null;

    return (
        <div id="cerita" className="scroll-mt-24 border-t">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <SectionHeading
                    title="Kata mereka yang kembali"
                    body="Ulasan asli pelanggan, hanya yang lolos kurasi yang tampil di sini."
                />
            </div>
            <div className="overflow-hidden pb-14 md:pb-20 mask-[linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                <div className="landing-review-track flex w-max items-stretch gap-4">
                    {[0, 1].map((half) => (
                        <div
                            key={half}
                            aria-hidden={half === 1 ? true : undefined}
                            className="flex w-max shrink-0 items-stretch gap-4 pr-4">
                            {items.map((item) => (
                                <ReviewCard
                                    key={`${half}-${item.id}`}
                                    item={item}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const LandingStory = ({ reviews }: { reviews: PublicReview[] }) => {
    return (
        <section aria-label="Cerita Nexara">
            <LandingRitual />
            <LandingTestimonials items={reviews} />
        </section>
    );
};
