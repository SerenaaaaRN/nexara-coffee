import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import {
    EASE,
    Reveal,
    SectionHeading,
} from "@/features/landing/components/landing-motion";
import { LANDING_RITUALS } from "@/features/landing/data";
import { useCarousel } from "@/features/landing/hooks/useLandingInteraction";
import type { PublicReview } from "@/features/landing/types";
import { cn } from "@/utils/cn";

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

const LandingTestimonials = ({ items }: { items: PublicReview[] }) => {
    const reduce = useReducedMotion();
    const { index, direction, go } = useCarousel(items.length);

    if (items.length === 0) return null;

    const item = items[index];
    const displayName = item.customerName ?? "Pelanggan Nexara";

    return (
        <div id="cerita" className="scroll-mt-24 border-t">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-start">
                    <Reveal>
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                            Kata mereka yang kembali
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Ulasan asli pelanggan, hanya yang lolos kurasi yang
                            tampil di sini.
                        </p>
                        <div className="mt-6 flex items-center gap-2">
                            <button
                                type="button"
                                aria-label="Ulasan sebelumnya"
                                onClick={() => go(-1)}
                                className={cn(
                                    buttonVariants({
                                        variant: "outline",
                                        size: "icon",
                                    }),
                                    "rounded-full active:scale-[0.95]",
                                )}>
                                <ArrowLeft className="size-4" />
                            </button>
                            <button
                                type="button"
                                aria-label="Ulasan berikutnya"
                                onClick={() => go(1)}
                                className={cn(
                                    buttonVariants({
                                        variant: "outline",
                                        size: "icon",
                                    }),
                                    "rounded-full active:scale-[0.95]",
                                )}>
                                <ArrowRight className="size-4" />
                            </button>
                            <span className="ml-2 font-mono text-xs text-muted-foreground">
                                {index + 1} / {items.length}
                            </span>
                        </div>
                    </Reveal>
                    <div className="relative min-h-64 overflow-hidden rounded-3xl border bg-card p-8 shadow-sm md:min-h-72 md:p-12">
                        <Quote
                            aria-hidden
                            className="absolute top-6 right-8 size-10 opacity-10"
                        />
                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.figure
                                key={item.id}
                                custom={direction}
                                initial={
                                    reduce
                                        ? false
                                        : { opacity: 0, x: 48 * direction }
                                }
                                animate={{ opacity: 1, x: 0 }}
                                exit={
                                    reduce
                                        ? { opacity: 0 }
                                        : { opacity: 0, x: -48 * direction }
                                }
                                transition={{ duration: 0.4, ease: EASE }}>
                                <blockquote className="max-w-[52ch] font-serif text-2xl leading-snug italic text-balance md:text-3xl">
                                    &ldquo;{item.comment}&rdquo;
                                </blockquote>
                                <figcaption className="mt-6 flex flex-wrap items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                                        {displayName.slice(0, 1).toUpperCase()}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold">
                                            {displayName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.branchName
                                                ? `Cabang ${item.branchName}`
                                                : "Pelanggan terverifikasi"}
                                        </p>
                                    </div>
                                    <span className="ml-auto flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs font-semibold">
                                        <Star className="size-3.5 fill-current" />
                                        {item.rating.toFixed(1)}
                                    </span>
                                </figcaption>
                            </motion.figure>
                        </AnimatePresence>
                    </div>
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
