import { Building2, Receipt, Wallet } from "lucide-react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LANDING_FEATURES } from "@/features/landing/data";

const FEATURE_ICONS = {
    Wallet,
    Receipt,
    Building2,
} as const;

export const LandingFeatures = () => {
    return (
        <section id="fitur" className="scroll-mt-20">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Kenapa Nexara Coffee?
                    </h2>
                    <p className="text-muted-foreground">
                        Operasional rapi di balik layar, pengalaman hangat di
                        depan cangkir.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {LANDING_FEATURES.map((feature) => {
                        const Icon =
                            FEATURE_ICONS[
                                feature.icon as keyof typeof FEATURE_ICONS
                            ];
                        return (
                            <Card key={feature.title}>
                                <CardHeader>
                                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary-foreground">
                                        <Icon className="size-4" />
                                    </span>
                                    <CardTitle>{feature.title}</CardTitle>
                                    <CardDescription>
                                        {feature.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
