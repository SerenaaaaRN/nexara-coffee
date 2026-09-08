import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FALLBACK_MENU } from "@/features/landing/data";
import type { PublicMenuItem } from "@/features/landing/types";
import { formatCurrency } from "@/utils/format";

interface LandingMenuProps {
    items: PublicMenuItem[];
}

export const LandingMenu = ({ items }: LandingMenuProps) => {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const source = items.length > 0 ? items : FALLBACK_MENU;

    const categories = useMemo(
        () => [...new Set(source.map((item) => item.category.name))],
        [source],
    );

    const visible = activeCategory
        ? source.filter((item) => item.category.name === activeCategory)
        : source;

    return (
        <section id="menu" className="scroll-mt-20 border-t">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Menu Andalan
                    </h2>
                    <p className="text-muted-foreground">
                        Racikan favorit pelanggan, diseduh fresh setiap hari.
                    </p>
                </div>
                {categories.length > 0 ? (
                    <div className="mb-6 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant={
                                activeCategory === null ? "default" : "outline"
                            }
                            onClick={() => setActiveCategory(null)}>
                            Semua
                        </Button>
                        {categories.map((category) => (
                            <Button
                                key={category}
                                size="sm"
                                variant={
                                    activeCategory === category
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() => setActiveCategory(category)}>
                                {category}
                            </Button>
                        ))}
                    </div>
                ) : null}
                {visible.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {visible.slice(0, 8).map((item) => (
                            <Card key={item.id} className="pt-0">
                                {item.imageUrl ? (
                                    <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="aspect-[4/3] w-full object-cover"
                                        loading="lazy"
                                    />
                                ) : null}
                                <CardHeader>
                                    <div className="flex items-center justify-between gap-2">
                                        <Badge variant="secondary">
                                            {item.category.name}
                                        </Badge>
                                        <span className="text-sm font-bold">
                                            {formatCurrency(item.price)}
                                        </span>
                                    </div>
                                    <CardTitle>{item.name}</CardTitle>
                                    {item.description ? (
                                        <CardDescription className="line-clamp-2">
                                            {item.description}
                                        </CardDescription>
                                    ) : null}
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">
                        Menu sedang disiapkan, silakan cek lagi nanti.
                    </p>
                )}
            </div>
        </section>
    );
};
