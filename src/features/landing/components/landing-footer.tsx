import { Link } from "@tanstack/react-router";
import { Coffee } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const LandingFooter = () => {
    return (
        <>
            <section className="border-t">
                <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-12 md:px-6 md:py-16">
                    <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Mampir, seruput, balik lagi.
                    </h2>
                    <p className="max-w-[65ch] text-muted-foreground">
                        Temukan cabang Nexara Coffee terdekat di kotamu.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <a href="#cabang" className={buttonVariants()}>
                            Kunjungi Cabang
                        </a>
                    </div>
                </div>
            </section>
            <footer className="border-t">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:px-6">
                    <div className="flex items-center gap-2 font-medium">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Coffee className="size-4" />
                        </span>
                        Nexara Coffee
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Jaringan kopi Palembang. Buka setiap hari mengikuti jam
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
                            to="/login"
                            className={buttonVariants({
                                variant: "ghost",
                                size: "sm",
                            })}>
                            Masuk
                        </Link>
                    </nav>
                </div>
            </footer>
        </>
    );
};
