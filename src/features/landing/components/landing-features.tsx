"use client";

import { motion, useReducedMotion } from "motion/react";
import { Reveal } from "@/features/landing/components/landing-reveal";
import { LANDING_RITUALS } from "@/features/landing/data";
import { cn } from "@/utils/cn";

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const LandingFeatures = () => {
    const reduce = useReducedMotion();

    return (
        <section id="ritual" className="scroll-mt-24">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <Reveal className="mb-10 max-w-2xl">
                    <h2 className="text-3xl font-bold tracking-tighter text-balance md:text-4xl">
                        Ritual di balik tiap cangkir
                    </h2>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                        Tiga langkah yang tidak pernah kami singkat, dari kebun
                        sampai ke tanganmu.
                    </p>
                </Reveal>
                <div className="relative">
                    {LANDING_RITUALS.map((ritual, i) => (
                        <motion.article
                            key={ritual.index}
                            initial={reduce ? false : { opacity: 0, y: 48 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.6, ease: EASE }}
                            style={{ top: `${6 + i * 1.5}rem` }}
                            className={cn(
                                "sticky mb-6 overflow-hidden rounded-3xl border bg-card shadow-xl",
                            )}>
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
        </section>
    );
};
