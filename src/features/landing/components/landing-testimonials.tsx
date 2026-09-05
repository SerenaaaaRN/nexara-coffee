import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LANDING_TESTIMONIALS } from "@/features/landing/data";

export const LandingTestimonials = () => {
    return (
        <section id="testimoni" className="scroll-mt-20 border-t">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Kata Pelanggan
                    </h2>
                    <p className="text-muted-foreground">
                        Cerita hangat dari meja-meja Nexara.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {LANDING_TESTIMONIALS.map((item) => (
                        <Card key={item.name}>
                            <CardHeader>
                                <CardDescription className="text-base text-foreground">
                                    “{item.quote}”
                                </CardDescription>
                                <div className="flex items-center gap-2 pt-2">
                                    <Avatar>
                                        <AvatarFallback>
                                            {item.name.slice(0, 1)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle>{item.name}</CardTitle>
                                        <p className="text-xs text-muted-foreground">
                                            {item.role}
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};
