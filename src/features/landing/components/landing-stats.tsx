import { LandingCountUp } from "@/features/landing/components/landing-countup";
import {
    Reveal,
    RevealItem,
    RevealStagger,
} from "@/features/landing/components/landing-reveal";
import { LANDING_EDITORIAL } from "@/features/landing/data";

interface LandingStatsProps {
    branchCount: number;
    menuCount: number;
    categoryCount: number;
}

export const LandingStats = ({
    branchCount,
    menuCount,
    categoryCount,
}: LandingStatsProps) => {
    const figures = [
        { value: branchCount, label: "Cabang di Palembang" },
        { value: menuCount, label: "Racikan di menu" },
        { value: categoryCount, label: "Keluarga rasa" },
    ];

    return (
        <section aria-label="Sekilas Nexara" className="border-b">
            <div className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
                <Reveal>
                    <h2 className="max-w-xl text-3xl font-bold tracking-tighter text-balance md:text-4xl">
                        {LANDING_EDITORIAL.heading}
                    </h2>
                    <p className="mt-3 max-w-[60ch] leading-relaxed text-muted-foreground">
                        {LANDING_EDITORIAL.body}
                    </p>
                </Reveal>
                <RevealStagger
                    className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3"
                    stagger={0.1}>
                    {figures.map((fig) => (
                        <RevealItem key={fig.label}>
                            <div className="border-t pt-5">
                                <p className="font-mono text-5xl font-semibold tracking-tight md:text-6xl">
                                    <LandingCountUp value={fig.value} />
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {fig.label}
                                </p>
                            </div>
                        </RevealItem>
                    ))}
                </RevealStagger>
            </div>
        </section>
    );
};
