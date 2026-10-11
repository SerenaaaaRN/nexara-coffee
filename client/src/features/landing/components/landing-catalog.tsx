"use client";

import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, MapPin, Phone } from "lucide-react";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
    EASE,
    RevealItem,
    RevealStagger,
    SectionHeading,
} from "@/features/landing/components/landing-motion";
import { useMenuFilter } from "@/features/landing/hooks/useLandingInteraction";
import type { PublicBranch, PublicMenuItem } from "@/features/landing/types";
import { cn } from "@/utils/cn";
import { formatCurrency, formatHours } from "@/utils/format";

const MenuCard = ({
    item,
    hero = false,
    reduce,
}: {
    item: PublicMenuItem;
    hero?: boolean;
    reduce: boolean;
}) => {
    return (
        <motion.article
            whileHover={reduce ? undefined : { y: -6 }}
            transition={{ duration: 0.35, ease: EASE }}
            className={cn(
                "group h-full overflow-hidden rounded-3xl border bg-card shadow-sm",
                hero ? "sm:min-h-130" : "sm:min-h-64",
            )}>
            <div
                className={cn(
                    "relative overflow-hidden bg-muted",
                    hero
                        ? "aspect-16/10 sm:h-3/5 sm:aspect-auto"
                        : "aspect-video",
                )}>
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center font-serif text-4xl italic text-muted-foreground">
                        {item.name.slice(0, 1)}
                    </div>
                )}
                <Badge
                    variant="secondary"
                    className="absolute top-3 left-3 backdrop-blur-md">
                    {item.category.name}
                </Badge>
            </div>
            <div className="flex items-start justify-between gap-3 p-5">
                <div>
                    <h3
                        className={cn(
                            "font-bold tracking-tight",
                            hero ? "text-xl md:text-2xl" : "text-base",
                        )}>
                        {item.name}
                    </h3>
                    {item.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {item.description}
                        </p>
                    ) : null}
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold">
                    {formatCurrency(item.price)}
                </p>
            </div>
        </motion.article>
    );
};

const LandingMenu = ({ items }: { items: PublicMenuItem[] }) => {
    const reduce = useReducedMotion() ?? false;
    const { activeCategory, setActiveCategory, categories, visible } =
        useMenuFilter(items);
    const [hero, ...rest] = visible;

    return (
        <div id="menu" className="scroll-mt-24 border-t">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <SectionHeading
                    title="Menu andalan"
                    body="Diseduh fresh setiap hari, tidak pernah terburu-buru."
                    aside={
                        <a
                            href="#cabang"
                            className="text-sm font-medium underline underline-offset-4">
                            Cicipi di cabang terdekat
                        </a>
                    }
                />
                {categories.length > 0 ? (
                    <LayoutGroup>
                        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
                            {[null, ...categories].map((category) => {
                                const active = activeCategory === category;
                                return (
                                    <button
                                        key={category ?? "semua"}
                                        type="button"
                                        onClick={() =>
                                            setActiveCategory(category)
                                        }
                                        className={cn(
                                            "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-[0.97]",
                                            active
                                                ? "text-primary-foreground"
                                                : "border text-muted-foreground hover:text-foreground",
                                        )}>
                                        {active ? (
                                            <motion.span
                                                layoutId="menu-pill"
                                                transition={{
                                                    type: "spring",
                                                    stiffness: 500,
                                                    damping: 32,
                                                }}
                                                className="absolute inset-0 rounded-full bg-primary"
                                            />
                                        ) : null}
                                        <span className="relative z-10">
                                            {category ?? "Semua"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </LayoutGroup>
                ) : null}
                {hero ? (
                    <RevealStagger
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                        stagger={0.06}>
                        <RevealItem className="sm:col-span-2 sm:row-span-2">
                            <MenuCard item={hero} hero reduce={reduce} />
                        </RevealItem>
                        {rest.map((item) => (
                            <RevealItem key={item.id}>
                                <MenuCard item={item} reduce={reduce} />
                            </RevealItem>
                        ))}
                    </RevealStagger>
                ) : (
                    <p className="text-muted-foreground">
                        Menu sedang disiapkan, silakan cek lagi nanti.
                    </p>
                )}
            </div>
        </div>
    );
};

const LandingBranches = ({ branches }: { branches: PublicBranch[] }) => {
    const reduce = useReducedMotion() ?? false;

    return (
        <div id="cabang" className="scroll-mt-24 border-t">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <SectionHeading
                    title="Mampir ke gerai terdekat"
                    body="Tiap cabang punya jam dan karakternya sendiri."
                    aside={
                        <Link
                            to="/maps"
                            className={cn(
                                buttonVariants({ variant: "outline" }),
                                "rounded-2xl active:scale-[0.98]",
                            )}>
                            Lihat Peta
                            <ArrowUpRight className="size-4" />
                        </Link>
                    }
                />
                {branches.length > 0 ? (
                    <RevealStagger
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        stagger={0.07}>
                        {branches.slice(0, 6).map((branch) => {
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
        </div>
    );
};

export const LandingCatalog = ({
    menuItems,
    branches,
}: {
    menuItems: PublicMenuItem[];
    branches: PublicBranch[];
}) => {
    return (
        <section aria-label="Katalog Nexara">
            <LandingMenu items={menuItems} />
            <LandingBranches branches={branches} />
        </section>
    );
};
