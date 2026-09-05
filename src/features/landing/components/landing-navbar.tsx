import { Link } from "@tanstack/react-router";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANDING_COPY } from "@/features/landing/data";

const NAV_LINKS = [
    { href: "#fitur", label: "Fitur" },
    { href: "#menu", label: "Menu" },
    { href: "#cabang", label: "Cabang" },
    { href: "#testimoni", label: "Testimoni" },
];

export const LandingNavbar = () => {
    return (
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
                <a href="#atas" className="flex items-center gap-2 font-medium">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Coffee className="size-4" />
                    </span>
                    Nexara Coffee
                </a>
                <nav className="ml-6 hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((link) => (
                        <Button
                            key={link.href}
                            variant="ghost"
                            size="sm"
                            render={<a href={link.href}>{link.label}</a>}
                        />
                    ))}
                </nav>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        render={
                            <Link to="/login">{LANDING_COPY.loginCta}</Link>
                        }
                    />
                    <Button
                        size="sm"
                        render={
                            <Link to="/register">
                                {LANDING_COPY.registerCta}
                            </Link>
                        }
                    />
                </div>
            </div>
        </header>
    );
};
