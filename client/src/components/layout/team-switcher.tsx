import { useLocation, useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown } from "lucide-react";
import { type ElementType, useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";

type Team = {
    name: string;
    logo: ElementType;
    plan: string;
    url?: string;
};

export function TeamSwitcher({ teams }: { teams: Team[] }) {
    const { isMobile } = useSidebar();
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;
    const [activeTeam, setActiveTeam] = useState(teams[0]);

    useEffect(() => {
        if (pathname.startsWith("/pos")) {
            const posTeam = teams.find((t) => t.url?.startsWith("/pos"));
            if (posTeam) setActiveTeam(posTeam);
        } else {
            const dashboardTeam = teams.find((t) => !t.url?.startsWith("/pos"));
            if (dashboardTeam) setActiveTeam(dashboardTeam);
        }
    }, [pathname, teams]);

    if (!activeTeam) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <SidebarMenuButton
                                size="lg"
                                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <activeTeam.logo className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {activeTeam.name}
                                    </span>
                                    <span className="truncate text-xs">
                                        {activeTeam.plan}
                                    </span>
                                </div>
                                <ChevronsUpDown className="ml-auto" />
                            </SidebarMenuButton>
                        }
                    />
                    <DropdownMenuContent
                        className="w-(--anchor-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Switch App
                        </DropdownMenuLabel>
                        {teams.map((team, index) => (
                            <DropdownMenuItem
                                key={team.name}
                                onClick={() => {
                                    setActiveTeam(team);
                                    if (team.url) navigate({ to: team.url });
                                }}
                                className="gap-2 p-2">
                                <div className="flex size-6 items-center justify-center rounded-md border">
                                    <team.logo className="size-3.5 shrink-0" />
                                </div>
                                <div className="flex flex-col">
                                    <span>{team.name}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {team.plan}
                                    </span>
                                </div>
                                <DropdownMenuShortcut>
                                    ⌘{index + 1}
                                </DropdownMenuShortcut>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
