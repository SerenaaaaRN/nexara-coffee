"use client";

import { ArrowDown, Clock, MapPin, Star } from "lucide-react";
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from "motion/react";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LANDING_COPY, LANDING_HERO_IMAGES } from "@/features/landing/data";
import { cn } from "@/utils/cn";

interface LandingHeroProps {
    branchCount: number;
    branchLine: string | null;
}

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

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

export const LandingHero = ({ branchCount, branchLine }: LandingHeroProps) => {
    const ref = useRef<HTMLElement>(null);
    const reduce = useReducedMotion();
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });
    const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
    const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

    const headline = `${LANDING_COPY.headlineA} ${LANDING_COPY.headlineB}`;

    return (
        <section
            id="atas"
            ref={ref}
            className="relative flex min-h-dvh items-end overflow-hidden">
            <motion.div
                aria-hidden
                style={reduce ? undefined : { y: imageY }}
                className="absolute inset-0">
                <motion.img
                    src={LANDING_HERO_IMAGES.main}
                    alt=""
                    initial={reduce ? false : { scale: 1.12 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.4, ease: EASE }}
                    className="h-full w-full object-cover"
                    loading="eager"
                />
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
                        {branchCount > 0 ? ` · ${branchCount} cabang` : null}
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
                    <div className="landing-float-slow flex items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3 shadow-lg backdrop-blur-xl">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Star className="size-4" />
                        </span>
                        <div>
                            <p className="text-sm font-bold">
                                4.9 dari pelanggan
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Ribuan cangkir tiap pekan
                            </p>
                        </div>
                    </div>
                    {branchLine ? (
                        <div className="landing-float-slower hidden items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3 shadow-lg backdrop-blur-xl sm:flex">
                            <span className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                                <Clock className="size-4" />
                            </span>
                            <div>
                                <p className="text-sm font-bold">
                                    {branchLine}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Cabang terdekat hari ini
                                </p>
                            </div>
                        </div>
                    ) : null}
                </div>
                <a
                    href="#ritual"
                    aria-label="Gulir ke bawah"
                    className="mt-10 inline-flex size-10 items-center justify-center rounded-full border bg-background/60 backdrop-blur-md">
                    <ArrowDown className="landing-steam size-4" />
                </a>
            </motion.div>
        </section>
    );
};
