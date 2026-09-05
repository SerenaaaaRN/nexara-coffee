import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LANDING_COPY } from "@/features/landing/data";

interface LandingHeroProps {
    branchCount: number;
}

export const LandingHero = ({ branchCount }: LandingHeroProps) => {
    return (
        <section id="atas" className="scroll-mt-20">
            <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 md:px-6 md:py-20 lg:grid-cols-2">
                <div className="flex flex-col items-start gap-4">
                    <Badge variant="secondary">
                        <MapPin className="size-3" />
                        {LANDING_COPY.badge}
                        {branchCount > 0 ? ` · ${branchCount} cabang` : null}
                    </Badge>
                    <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                        {LANDING_COPY.headline}
                    </h1>
                    <p className="max-w-[65ch] text-base leading-relaxed text-muted-foreground">
                        {LANDING_COPY.subheadline}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <a href="#menu" className={buttonVariants()}>
                            {LANDING_COPY.primaryCta}
                        </a>
                        <a
                            href="#cabang"
                            className={buttonVariants({
                                variant: "outline",
                            })}>
                            {LANDING_COPY.secondaryCta}
                        </a>
                    </div>
                </div>
                <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
                    <img
                        src="/login.jpg"
                        alt="Suasana gerai Nexara Coffee"
                        className="aspect-4/3 w-full object-cover"
                        loading="eager"
                    />
                </div>
            </div>
        </section>
    );
};
