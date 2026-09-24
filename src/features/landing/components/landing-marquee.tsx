"use client";

import { LANDING_COPY } from "@/features/landing/data";

export const LandingMarquee = () => {
    const items = LANDING_COPY.marquee;
    return (
        <section
            aria-label="Sorotan Nexara"
            className="overflow-hidden border-y">
            <div className="landing-marquee-track flex w-max items-center gap-0 py-4">
                {[0, 1].map((half) => (
                    <div
                        key={half}
                        aria-hidden={half === 1 ? true : undefined}
                        className="flex w-max shrink-0 items-center">
                        {items.map((item, i) => (
                            <span
                                key={`${half}-${i}`}
                                className="flex items-center gap-6 pr-6">
                                <span className="font-serif text-lg italic tracking-wide text-foreground md:text-xl">
                                    {item}
                                </span>
                                <span
                                    aria-hidden
                                    className="size-1.5 rounded-full bg-primary"
                                />
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </section>
    );
};
