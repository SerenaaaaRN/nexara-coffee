"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Reveal,
    RevealItem,
    RevealStagger,
} from "@/features/landing/components/landing-reveal";
import { FALLBACK_MENU } from "@/features/landing/data";
import type { PublicMenuItem } from "@/features/landing/types";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";

interface LandingMenuProps {
    items: PublicMenuItem[];
}

const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const LandingMenu = ({ items }: LandingMenuProps) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const reduce = useReducedMotion();

    const source = items.length > 0 ? items : FALLBACK_MENU;

    const categories = useMemo(
        () => [...new Set(source.map((item) => item.category.name))],
        [source],
    );

    const visible = useMemo(
        () =>
            (activeCategory
                ? source.filter((item) => item.category.name === activeCategory)
                : source
            ).slice(0, 7),
        [source, activeCategory],
    );

    const [hero, ...rest] = visible;

    return (
        <section id="menu" className="scroll-mt-24 border-t">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                            Menu andalan
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Diseduh fresh setiap hari, tidak pernah
                            terburu-buru.
                        </p>
                    </div>
                    <a
                        href="#cabang"
                        className="text-sm font-medium underline underline-offset-4">
                        Cicipi di cabang terdekat
                    </a>
                </Reveal>
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
        </section>
    );
};

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
                        ? "aspect-[16/10] sm:h-3/5 sm:aspect-auto"
                        : "aspect-[16/9]",
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
