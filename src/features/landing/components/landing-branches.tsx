"use client";

import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, MapPin, Phone } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
    Reveal,
    RevealItem,
    RevealStagger,
} from "@/features/landing/components/landing-reveal";
import { FALLBACK_BRANCHES } from "@/features/landing/data";
import type { PublicBranch } from "@/features/landing/types";
import { cn } from "@/utils/cn";

interface LandingBranchesProps {
    branches: PublicBranch[];
}

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const formatHours = (
    opening: string | null,
    closing: string | null,
): string | null => {
    if (!opening || !closing) return null;
    return `${opening.slice(0, 5)}–${closing.slice(0, 5)}`;
};

export const LandingBranches = ({ branches }: LandingBranchesProps) => {
    const reduce = useReducedMotion();
    const source = branches.length > 0 ? branches : FALLBACK_BRANCHES;

    return (
        <section id="cabang" className="scroll-mt-24 border-t">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                            Mampir ke gerai terdekat
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Tiap cabang punya jam dan karakternya sendiri.
                        </p>
                    </div>
                    <Link
                        to="/maps"
                        className={cn(
                            buttonVariants({ variant: "outline" }),
                            "rounded-2xl active:scale-[0.98]",
                        )}>
                        Lihat Peta
                        <ArrowUpRight className="size-4" />
                    </Link>
                </Reveal>
                {source.length > 0 ? (
                    <RevealStagger
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        stagger={0.07}>
                        {source.slice(0, 6).map((branch) => {
                            const hours = formatHours(
                                branch.openingTime,
                                branch.closingTime,
                            );
                            return (
                                <RevealItem key={branch.id}>
                                    <motion.article
                                        whileHover={
                                            reduce ? undefined : { y: -6 }
                                        }
                                        transition={{
                                            duration: 0.35,
                                            ease: EASE,
                                        }}
                                        className="flex h-full flex-col overflow-hidden rounded-3xl border bg-card shadow-sm">
                                        <div className="relative flex h-28 items-end overflow-hidden bg-muted p-5">
                                            <span
                                                aria-hidden
                                                className="absolute -top-4 -right-1 font-serif text-[7rem] leading-none italic opacity-15 select-none">
                                                {branch.name.slice(0, 1)}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="relative backdrop-blur-md">
                                                {branch.ownershipType ===
                                                "franchise"
                                                    ? "Mitra"
                                                    : "Pusat"}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-1 flex-col gap-2 p-5">
                                            <h3 className="text-lg font-bold tracking-tight">
                                                {branch.name}
                                            </h3>
                                            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                                                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                                {branch.address}
                                            </p>
                                            <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-sm text-muted-foreground">
                                                {hours ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="size-3.5" />
                                                        {hours}
                                                    </span>
                                                ) : null}
                                                {branch.phone ? (
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone className="size-3.5" />
                                                        {branch.phone}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </motion.article>
                                </RevealItem>
                            );
                        })}
                    </RevealStagger>
                ) : (
                    <p className="text-muted-foreground">
                        Info cabang segera hadir, nantikan pembukaannya.
                    </p>
                )}
            </div>
        </section>
    );
};
