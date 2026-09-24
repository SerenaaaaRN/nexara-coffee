"use client";

import { ArrowDown, Clock, MapPin, Star } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { buttonVariants } from "@/components/ui/button";
import {
    EASE,
    Reveal,
    RevealItem,
    RevealStagger,
} from "@/features/landing/components/landing-motion";
import {
    LANDING_COPY,
    LANDING_EDITORIAL,
    LANDING_HERO_SLIDES,
} from "@/features/landing/data";
import {
    useCountUp,
    useSlideshow,
} from "@/features/landing/hooks/useLandingInteraction";
import { cn } from "@/utils/cn";

export interface LandingOpening {
    branchCount: number;
    menuCount: number;
    categoryCount: number;
    branchLine: string | null;
    ratingSummary: string | null;
}

const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const word = {
    hidden: { opacity: 0, y: 44 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, ease: EASE },
    },
};

const fade = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: EASE },
    },
};

const StatFigure = ({ value, label }: { value: number; label: string }) => {
    const { countRef, display } = useCountUp(value);
    return (
        <RevealItem>
            <div className="border-t pt-5">
                <p className="font-mono text-5xl font-semibold tracking-tight md:text-6xl">
                    <span ref={countRef}>{display}</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{label}</p>
            </div>
        </RevealItem>
    );
};

export const LandingHero = ({ summary }: { summary: LandingOpening }) => {
    const reduce = useReducedMotion();
    const { sectionRef, slide, setSlide, imageY, contentOpacity } =
        useSlideshow();

    const headline = `${LANDING_COPY.headlineA} ${LANDING_COPY.headlineB}`;
    const figures = [
        { value: summary.branchCount, label: "Cabang di Palembang" },
        { value: summary.menuCount, label: "Racikan di menu" },
        { value: summary.categoryCount, label: "Keluarga rasa" },
    ];

    return (
        <>
            <section
                id="atas"
                ref={sectionRef}
                className="relative flex min-h-dvh items-end overflow-hidden">
                <motion.div
                    aria-hidden
                    style={reduce ? undefined : { y: imageY }}
                    className="absolute inset-0">
                    <AnimatePresence initial={false}>
                        <motion.img
                            key={LANDING_HERO_SLIDES[slide].src}
                            src={LANDING_HERO_SLIDES[slide].src}
                            alt=""
                            initial={
                                reduce ? false : { opacity: 0, scale: 1.08 }
                            }
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={
                                reduce
                                    ? undefined
                                    : { opacity: { duration: 1.2, ease: EASE } }
                            }
                            className="absolute inset-0 h-full w-full object-cover"
                            loading={slide === 0 ? "eager" : "lazy"}
                        />
                    </AnimatePresence>
                </motion.div>
                <div
                    aria-hidden
                    className="absolute inset-0 bg-linear-to-t from-background via-background/55 to-background/15"
                />
                <motion.div
                    style={reduce ? undefined : { opacity: contentOpacity }}
                    className="relative mx-auto w-full max-w-7xl px-4 pt-32 pb-14 md:px-6 md:pb-20">
                    <motion.div
                        variants={container}
                        initial={reduce ? "visible" : "hidden"}
                        animate="visible">
                        <motion.p
                            variants={fade}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium tracking-widest uppercase backdrop-blur-md">
                            <MapPin className="size-3" />
                            {LANDING_COPY.eyebrow}
                            {summary.branchCount > 0
                                ? ` · ${summary.branchCount} cabang`
                                : null}
                        </motion.p>
                        <h1 className="max-w-3xl text-5xl leading-[1.02] font-bold tracking-tighter text-balance md:text-7xl">
                            {headline.split(" ").map((w, i) => (
                                <motion.span
                                    key={i}
                                    variants={word}
                                    className="mr-[0.24em] inline-block last:mr-0">
                                    {w}
                                </motion.span>
                            ))}
                        </h1>
                        <motion.p
                            variants={fade}
                            className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground md:text-lg">
                            {LANDING_COPY.subheadline}
                        </motion.p>
                        <motion.div
                            variants={fade}
                            className="mt-7 flex flex-wrap items-center gap-3">
                            <a
                                href="#menu"
                                className={cn(
                                    buttonVariants({ size: "lg" }),
                                    "rounded-2xl active:scale-[0.98]",
                                )}>
                                {LANDING_COPY.primaryCta}
                            </a>
                            <a
                                href="#cabang"
                                className={cn(
                                    buttonVariants({
                                        size: "lg",
                                        variant: "outline",
                                    }),
                                    "rounded-2xl bg-background/60 backdrop-blur-md active:scale-[0.98]",
                                )}>
                                {LANDING_COPY.secondaryCta}
                            </a>
                        </motion.div>
                    </motion.div>
                    <div className="mt-10 flex flex-wrap gap-3">
                        {summary.ratingSummary ? (
                            <div className="landing-float-slow flex items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3 shadow-lg backdrop-blur-xl">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                    <Star className="size-4" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold">
                                        {summary.ratingSummary}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Dari ulasan terverifikasi
                                    </p>
                                </div>
                            </div>
                        ) : null}
                        {summary.branchLine ? (
                            <div className="landing-float-slower hidden items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3 shadow-lg backdrop-blur-xl sm:flex">
                                <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                                    <Clock className="size-4" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold">
                                        {summary.branchLine}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Cabang terdekat hari ini
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                    <div className="mt-10 flex items-center gap-4">
                        <a
                            href="#ritual"
                            aria-label="Gulir ke bawah"
                            className="inline-flex size-10 items-center justify-center rounded-full border bg-background/60 backdrop-blur-md">
                            <ArrowDown className="landing-steam size-4" />
                        </a>
                        <div
                            className="flex items-center gap-2"
                            role="tablist"
                            aria-label="Pilih foto hero">
                            {LANDING_HERO_SLIDES.map((item, i) => (
                                <button
                                    key={item.src}
                                    type="button"
                                    role="tab"
                                    aria-selected={i === slide}
                                    aria-label={`Foto ${i + 1}`}
                                    onClick={() => setSlide(i)}
                                    className="group p-1">
                                    <motion.span
                                        animate={
                                            i === slide
                                                ? { width: 28, opacity: 1 }
                                                : { width: 8, opacity: 0.5 }
                                        }
                                        transition={{
                                            duration: 0.35,
                                            ease: EASE,
                                        }}
                                        className="block h-1.5 rounded-full bg-foreground group-active:scale-95"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            <section
                aria-label="Sorotan Nexara"
                className="overflow-hidden border-y">
                <div className="landing-marquee-track flex w-max items-center gap-0 py-4">
                    {[0, 1].map((half) => (
                        <div
                            key={half}
                            aria-hidden={half === 1 ? true : undefined}
                            className="flex w-max shrink-0 items-center">
                            {LANDING_COPY.marquee.map((item, i) => (
                                <span
                                    key={`${half}-${i}`}
                                    className="flex items-center gap-6 pr-6">
                                    <span className="font-serif text-lg italic tracking-wide text-foreground md:text-xl">
                                        {item}
                                    </span>
                                    <span
                                        aria-hidden
                                        className="size-1.5 rounded-full bg-primary"
                                    />
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </section>

            <section aria-label="Sekilas Nexara" className="border-b">
                <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                    <Reveal>
                        <h2 className="max-w-xl text-3xl font-bold tracking-tighter text-balance md:text-4xl">
                            {LANDING_EDITORIAL.heading}
                        </h2>
                        <p className="mt-3 max-w-[60ch] leading-relaxed text-muted-foreground">
                            {LANDING_EDITORIAL.body}
                        </p>
                    </Reveal>
                    <RevealStagger
                        className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3"
                        stagger={0.1}>
                        {figures.map((fig) => (
                            <StatFigure
                                key={fig.label}
                                value={fig.value}
                                label={fig.label}
                            />
                        ))}
                    </RevealStagger>
                </div>
            </section>
        </>
    );
};
