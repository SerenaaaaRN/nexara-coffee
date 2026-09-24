import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Coffee } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/features/landing/components/landing-reveal";
import { cn } from "@/utils/cn";

export const LandingFooter = () => {
    return (
        <>
            <section className="border-t">
                <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
                    <Reveal className="flex flex-col items-start gap-6">
                        <h2 className="max-w-2xl text-4xl font-bold tracking-tighter text-balance md:text-6xl">
                            Mampir, seruput, balik lagi.
                        </h2>
                        <p className="max-w-[52ch] leading-relaxed text-muted-foreground">
                            Temukan cabang Nexara Coffee terdekat dan rasakan
                            ritualnya langsung.
                        </p>
                        <a
                            href="#cabang"
                            className={cn(
                                buttonVariants({ size: "lg" }),
                                "rounded-2xl active:scale-[0.98]",
                            )}>
                            Temukan Cabang
                            <ArrowUpRight className="size-4" />
                        </a>
                    </Reveal>
                </div>
            </section>
            <footer className="border-t">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:px-6">
                    <div className="flex items-center gap-2 font-medium">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Coffee className="size-4" />
                        </span>
                        Nexara Coffee
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Rumah kopi Palembang. Buka setiap hari mengikuti jam
                        tiap cabang.
                    </p>
                    <nav className="flex flex-wrap gap-1 md:ml-auto">
                        <a
                            href="#menu"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}>
                            Menu
                        </a>
                        <a
                            href="#cabang"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}>
                            Cabang
                        </a>
                        <Link
                            to="/register"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}>
                            Jadi Member
                        </Link>
                    </nav>
                </div>
            </footer>
        </>
    );
};
