import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { Resource } from "@/lib/rbac";

const COLLAPSIBLE_KEY = "nexara-sidebar-collapsible";

export type NavSubItem = {
    title: string;
    url: string;
    resource?: Resource;
};

export type NavItem = {
    title: string;
    url: string;
    icon?: LucideIcon;
    resource?: Resource;
    items?: NavSubItem[];
};

type NavMainProps = {
    items: NavItem[];
};

export function NavMain({ items }: NavMainProps) {
    const location = useLocation();
    const pathname = location.pathname;
    const searchStr = location.searchStr;
    const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(COLLAPSIBLE_KEY);
            if (raw) setOpenStates(JSON.parse(raw));
        } catch {}
        setLoaded(true);
    }, []);

    const fullPath = useMemo(
        () => pathname + (searchStr ? `?${searchStr}` : ""),
        [pathname, searchStr],
    );

    const isGroupActive = useCallback(
        (item: NavItem) => {
            if (!item.items) return false;
            return item.items.some((sub) => {
                if (sub.url === "/") return pathname === "/";
                return (
                    fullPath === sub.url || fullPath.startsWith(`${sub.url}/`)
                );
            });
        },
        [fullPath, pathname],
    );

    function toggleGroup(title: string, open: boolean) {
        setOpenStates((prev) => {
            const next = { ...prev, [title]: open };
            try {
                localStorage.setItem(COLLAPSIBLE_KEY, JSON.stringify(next));
            } catch {}
            return next;
        });
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    if (item.items?.length) {
                        const groupActive = isGroupActive(item);
                        const open = loaded
                            ? (openStates[item.title] ?? groupActive)
                            : false;

                        return (
                            <Collapsible
                                key={item.title}
                                render={<SidebarMenuItem />}
                                open={open}
                                onOpenChange={(o: boolean) =>
                                    toggleGroup(item.title, o)
                                }
                                className="group/collapsible">
                                <CollapsibleTrigger
                                    render={
                                        <SidebarMenuButton
                                            tooltip={item.title}
                                            className="group">
                                            {item.icon ? <item.icon /> : null}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-panel-open:rotate-90" />
                                        </SidebarMenuButton>
                                    }
                                />
                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items.map((subItem) => {
                                            const isSubActive =
                                                subItem.url === "/"
                                                    ? pathname === "/"
                                                    : fullPath ===
                                                          subItem.url ||
                                                      fullPath.startsWith(
                                                          `${subItem.url}/`,
                                                      );

                                            return (
                                                <SidebarMenuSubItem
                                                    key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        render={
                                                            <Link
                                                                to={
                                                                    subItem.url
                                                                }>
                                                                <span>
                                                                    {
                                                                        subItem.title
                                                                    }
                                                                </span>
                                                            </Link>
                                                        }
                                                        isActive={isSubActive}
                                                    />
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    }

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                render={
                                    <Link to={item.url}>
                                        {item.icon ? <item.icon /> : null}
                                        <span>{item.title}</span>
                                    </Link>
                                }
                                tooltip={item.title}
                            />
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
