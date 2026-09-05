import {
    Coffee,
    CreditCard,
    Home,
    LayoutDashboard,
    MessageSquare,
    ScrollText,
    Settings,
    Shield,
    Store,
    Users,
} from "lucide-react";
import { type ComponentProps, useMemo } from "react";
import { type NavItem, NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import { TeamSwitcher } from "@/components/layout/team-switcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { can, type Role } from "@/lib/rbac";

const apps = [
    {
        name: "Dashboard",
        logo: LayoutDashboard,
        plan: "HQ & Management",
        url: "/overview",
    },
    {
        name: "Nexara POS",
        logo: Coffee,
        plan: "Kasir & Orders",
        url: "/pos",
    },
    {
        name: "Nexara Landing Page",
        logo: Home,
        plan: "Landing Page",
        url: "/",
    },
];

const navMain: NavItem[] = [
    {
        title: "Overview",
        url: "/overview",
        icon: LayoutDashboard,
        resource: "reports",
    },
    {
        title: "Operations",
        url: "/orders",
        icon: Coffee,
        items: [
            {
                title: "Orders",
                url: "/orders",
                resource: "orders",
            },
            {
                title: "Kasir & Setoran",
                url: "/kasir",
                resource: "setoran",
            },
            {
                title: "Menu",
                url: "/menu",
                resource: "menu",
            },
        ],
    },
    {
        title: "Network",
        url: "/branches",
        icon: Store,
        items: [
            {
                title: "Branches & Mitra",
                url: "/branches",
                resource: "branches",
            },
            {
                title: "Maps",
                url: "/maps",
                resource: "maps",
            },
        ],
    },
    {
        title: "Customers",
        url: "/customers",
        icon: Users,
        items: [
            {
                title: "Customers",
                url: "/customers",
                resource: "customers",
            },
            {
                title: "Reviews",
                url: "/reviews",
                resource: "reviews",
            },
        ],
    },
    {
        title: "Finance",
        url: "/transactions",
        icon: CreditCard,
        items: [
            {
                title: "Transactions",
                url: "/transactions",
                resource: "finance",
            },
            {
                title: "Payouts",
                url: "/payouts",
                resource: "payouts",
            },
        ],
    },
    {
        title: "Employee & Payroll",
        url: "/employee",
        icon: Shield,
        resource: "employee",
    },
    {
        title: "Chat",
        url: "/chat",
        icon: MessageSquare,
        resource: "chat",
    },
    {
        title: "System",
        url: "/audit",
        icon: ScrollText,
        items: [
            {
                title: "Audit Log",
                url: "/audit",
                resource: "system",
            },
            {
                title: "Notifications",
                url: "/notifications",
                resource: "notifications",
            },
        ],
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
        resource: "users",
        items: [
            {
                title: "Profile",
                url: "/settings?section=profile",
            },
            {
                title: "Account",
                url: "/settings?section=account",
            },
            {
                title: "Appearance",
                url: "/settings?section=appearance",
            },
        ],
    },
];

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
    const { data: session } = useSession();
    const role = (session?.user as { role?: Role } | undefined)?.role;

    const visibleItems = useMemo(() => {
        if (!role) return navMain;
        return navMain.flatMap((item) => {
            if (item.items) {
                const items = item.items.filter(
                    (sub) => !sub.resource || can(role, "read", sub.resource),
                );
                return items.length > 0 ? [{ ...item, items }] : [];
            }
            if (item.resource && !can(role, "read", item.resource)) return [];
            return [item];
        });
    }, [role]);

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={apps} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={visibleItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
