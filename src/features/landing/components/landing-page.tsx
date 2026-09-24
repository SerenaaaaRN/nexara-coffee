"use client";

import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Coffee, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LandingCatalog } from "@/features/landing/components/landing-catalog";
import { LandingHero } from "@/features/landing/components/landing-hero";
import { EASE, Reveal } from "@/features/landing/components/landing-motion";
import { LandingStory } from "@/features/landing/components/landing-story";
import { LANDING_COPY } from "@/features/landing/data";
import {
    usePublicBranches,
    usePublicMenu,
    usePublicReviews,
} from "@/features/landing/hooks/useLandingQueries";
import { cn } from "@/utils/cn";
import { formatHours } from "@/utils/format";

const NAV_LINKS = [
    { href: "#ritual", label: "Ritual" },
    { href: "#menu", label: "Menu" },
    { href: "#cabang", label: "Cabang" },
];

const storyLink = { href: "#cerita", label: "Cerita" };

const LandingNavbar = ({ showStories }: { showStories: boolean }) => {
    const [open, setOpen] = useState(false);
    const reduce = useReducedMotion();
    const links = showStories ? [...NAV_LINKS, storyLink] : NAV_LINKS;

    return (
        <motion.header
            initial={reduce ? false : { y: -32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="fixed inset-x-0 top-3 z-40 px-4 md:top-5">
            <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 rounded-2xl border bg-background/70 py-2 pr-2 pl-4 shadow-lg backdrop-blur-xl md:h-16">
                <a href="#atas" className="flex items-center gap-2 font-medium">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Coffee className="size-4" />
                    </span>
                    <span className="tracking-tight">Nexara</span>
                </a>
                <nav className="ml-2 hidden items-center gap-1 md:flex">
                    {links.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}>
                            {link.label}
                        </a>
                    ))}
                </nav>
                <div className="ml-auto hidden items-center gap-2 md:flex">
                    <Link
                        to="/login"
                        className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                        })}>
                        {LANDING_COPY.loginCta}
                    </Link>
                    <Link
                        to="/register"
                        className={cn(
                            buttonVariants({ size: "sm" }),
                            "rounded-xl",
                        )}>
                        {LANDING_COPY.registerCta}
                    </Link>
                </div>
                <button
                    type="button"
                    aria-label={open ? "Tutup menu" : "Buka menu"}
                    onClick={() => setOpen((v) => !v)}
                    className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "ml-auto md:hidden",
                    )}>
                    {open ? (
                        <X className="size-4" />
                    ) : (
                        <Menu className="size-4" />
                    )}
                </button>
            </div>
            <AnimatePresence>
                {open ? (
                    <motion.nav
                        initial={reduce ? false : { opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: EASE }}
                        className="mx-auto mt-2 max-w-3xl rounded-2xl border bg-background/95 p-2 shadow-xl backdrop-blur-xl md:hidden">
                        {links.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "w-full justify-start",
                                )}>
                                {link.label}
                            </a>
                        ))}
                        <div className="mt-1 flex gap-2 border-t pt-2">
                            <Link
                                to="/login"
                                className={cn(
                                    buttonVariants({ variant: "outline" }),
                                    "flex-1",
                                )}>
                                {LANDING_COPY.loginCta}
                            </Link>
                            <Link
                                to="/register"
                                className={cn(buttonVariants(), "flex-1")}>
                                {LANDING_COPY.registerCta}
                            </Link>
                        </div>
                    </motion.nav>
                ) : null}
            </AnimatePresence>
        </motion.header>
    );
};

const LandingFooter = () => {
    return (
        <>
            <section className="border-t">
                <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
                    <Reveal className="flex flex-col items-start gap-6">
                        <h2 className="max-w-2xl text-4xl font-bold tracking-tighter text-balance md:text-6xl">
                            Mampir, seruput, balik lagi.
                        </h2>
                        <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
                            Temukan cabang Nexara Coffee terdekat dan rasakan
                            ritualnya langsung.
                        </p>
                        <a
                            href="#cabang"
                            className={cn(
                                buttonVariants({ size: "lg" }),
                                "rounded-2xl active:scale-[0.98]",
                            )}>
                            Temukan Cabang
                            <ArrowUpRight className="size-4" />
                        </a>
                    </Reveal>
                </div>
            </section>
            <footer className="border-t">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:px-6">
                    <div className="flex items-center gap-2 font-medium">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Coffee className="size-4" />
                        </span>
                        Nexara Coffee
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Rumah kopi Palembang. Buka setiap hari mengikuti jam
                        tiap cabang.
                    </p>
                    <nav className="flex flex-wrap gap-1 md:ml-auto">
                        <a
                            href="#menu"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}>
                            Menu
                        </a>
                        <a
                            href="#cabang"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}>
                            Cabang
                        </a>
                        <Link
                            to="/register"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}>
                            Jadi Member
                        </Link>
                    </nav>
                </div>
            </footer>
        </>
    );
};

export const LandingPage = () => {
    const branchesQuery = usePublicBranches();
    const menuQuery = usePublicMenu();
    const reviewsQuery = usePublicReviews();

    const branches =
        branchesQuery.data.success === true ? branchesQuery.data.data : [];
    const menuItems =
        menuQuery.data.success === true ? menuQuery.data.data : [];
    const reviews =
        reviewsQuery.data.success === true ? reviewsQuery.data.data : [];

    const first = branches[0];
    const hours =
        first != null
            ? formatHours(first.openingTime, first.closingTime)
            : null;

    return (
        <div className="landing-grain min-h-svh bg-background text-foreground">
            <LandingNavbar showStories={reviews.length > 0} />
            <main>
                <LandingHero
                    summary={{
                        branchCount: branches.length,
                        menuCount: menuItems.length,
                        categoryCount: new Set(
                            menuItems.map((item) => item.categoryId),
                        ).size,
                        branchLine:
                            first != null
                                ? `${first.name}${hours ? ` · ${hours}` : ""}`
                                : null,
                        ratingSummary:
                            reviews.length > 0
                                ? `${(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} dari ${reviews.length} ulasan`
                                : null,
                    }}
                />
                <LandingCatalog menuItems={menuItems} branches={branches} />
                <LandingStory reviews={reviews} />
            </main>
            <LandingFooter />
        </div>
    );
};
