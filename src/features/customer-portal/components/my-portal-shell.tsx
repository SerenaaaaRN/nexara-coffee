import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
    Coffee,
    ExternalLink,
    LogOut,
    Medal,
    ReceiptText,
    UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TourLauncher } from "@/features/tour/components/tour-launcher";
import { signOut, useSession } from "@/lib/auth-client";
import { cn } from "@/utils/cn";

const TABS = [
    { to: "/my/orders", label: "Pesananku", icon: ReceiptText },
    { to: "/my/member", label: "Member", icon: Medal },
    { to: "/my/account", label: "Akun", icon: UserRound },
] as const;

export function MyPortalShell() {
    const { data: session } = useSession();
    const navigate = useNavigate();

    async function handleLogout() {
        await signOut();
        navigate({ to: "/login" });
    }

    return (
        <div className="min-h-svh bg-background">
            <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4 md:px-6">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Coffee className="size-4" />
                    </span>
                    <span className="font-medium">Nexara Coffee</span>
                    <span className="ml-1 hidden text-sm text-muted-foreground sm:inline">
                        {session?.user?.name ? `· ${session.user.name}` : null}
                    </span>
                    <div className="ml-auto">
                        <TourLauncher />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}>
                            <LogOut className="size-4" />
                            Keluar
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            render={
                                <Link to="/">
                                    <ExternalLink className="size-4" />
                                    To Site
                                </Link>
                            }></Button>
                    </div>
                </div>
            </header>
            <div className="mx-auto max-w-5xl px-4 md:px-6">
                <nav className="flex gap-1 py-4" data-tour="my-tabs">
                    {TABS.map((tab) => (
                        <Link
                            key={tab.to}
                            to={tab.to}
                            activeProps={{
                                className:
                                    "bg-muted text-foreground hover:bg-accent",
                            }}
                            className={cn(
                                "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                            )}>
                            <tab.icon className="size-4" />
                            {tab.label}
                        </Link>
                    ))}
                </nav>
                <Separator />
                <main className="py-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
