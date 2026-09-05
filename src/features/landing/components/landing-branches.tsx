import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FALLBACK_BRANCHES } from "@/features/landing/data";
import type { PublicBranch } from "@/features/landing/types";

interface LandingBranchesProps {
    branches: PublicBranch[];
}

const formatHours = (
    opening: string | null,
    closing: string | null,
): string | null => {
    if (!opening || !closing) return null;
    return `${opening.slice(0, 5)}–${closing.slice(0, 5)}`;
};

export const LandingBranches = ({ branches }: LandingBranchesProps) => {
    const source = branches.length > 0 ? branches : FALLBACK_BRANCHES;

    return (
        <section id="cabang" className="scroll-mt-20 border-t">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                            Cabang Kami
                        </h2>
                        <p className="text-muted-foreground">
                            Mampir ke gerai terdekat di kotamu.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        render={<Link to="/maps">Lihat Peta</Link>}
                    />
                </div>
                {source.length > 0 ? (
                    <div className="divide-y rounded-xl ring-1 ring-foreground/10">
                        {source.map((branch) => {
                            const hours = formatHours(
                                branch.openingTime,
                                branch.closingTime,
                            );
                            return (
                                <div
                                    key={branch.id}
                                    className="flex flex-col gap-2 p-4 md:flex-row md:items-center md:gap-4 md:px-6">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium">
                                                {branch.name}
                                            </p>
                                            <Badge variant="secondary">
                                                {branch.ownershipType ===
                                                "franchise"
                                                    ? "Mitra"
                                                    : "Pusat"}
                                            </Badge>
                                        </div>
                                        <p className="flex items-start gap-1 text-sm text-muted-foreground">
                                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                            {branch.address}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                        {hours ? (
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-3.5" />
                                                {hours}
                                            </span>
                                        ) : null}
                                        {branch.phone ? (
                                            <span className="flex items-center gap-1">
                                                <Phone className="size-3.5" />
                                                {branch.phone}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-muted-foreground">
                        Info cabang segera hadir, nantikan pembukaannya.
                    </p>
                )}
            </div>
        </section>
    );
};
