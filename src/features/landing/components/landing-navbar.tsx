"use client";

import { Link } from "@tanstack/react-router";
import { Coffee, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { LANDING_COPY } from "@/features/landing/data";
import { cn } from "@/utils/cn";

const NAV_LINKS = [
    { href: "#ritual", label: "Ritual" },
    { href: "#menu", label: "Menu" },
    { href: "#cabang", label: "Cabang" },
    { href: "#cerita", label: "Cerita" },
];

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const LandingNavbar = () => {
    const [open, setOpen] = useState(false);
    const reduce = useReducedMotion();

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
                    {NAV_LINKS.map((link) => (
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
                        {NAV_LINKS.map((link) => (
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
