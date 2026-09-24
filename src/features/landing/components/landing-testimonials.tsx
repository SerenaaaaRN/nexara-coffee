"use client";

import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/features/landing/components/landing-reveal";
import { LANDING_TESTIMONIALS } from "@/features/landing/data";
import { cn } from "@/utils/cn";

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const LandingTestimonials = () => {
    const [index, setIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const reduce = useReducedMotion();
    const total = LANDING_TESTIMONIALS.length;
    const item = LANDING_TESTIMONIALS[index];

    const go = (dir: number) => {
        setDirection(dir);
        setIndex((i) => (i + dir + total) % total);
    };

    return (
        <section id="cerita" className="scroll-mt-24 border-t">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:items-start">
                    <Reveal>
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                            Kata mereka yang kembali
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Cerita hangat dari meja-meja Nexara.
                        </p>
                        <div className="mt-6 flex items-center gap-2">
                            <button
                                type="button"
                                aria-label="Testimoni sebelumnya"
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
                                aria-label="Testimoni berikutnya"
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
                                {index + 1} / {total}
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
                                key={item.name}
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
                                    &ldquo;{item.quote}&rdquo;
                                </blockquote>
                                <figcaption className="mt-6 flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                                        {item.name.slice(0, 1)}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.role}
                                        </p>
                                    </div>
                                </figcaption>
                            </motion.figure>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </section>
    );
};
