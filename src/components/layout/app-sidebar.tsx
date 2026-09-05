import {
    Coffee,
    CreditCard,
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
];

const navMain: NavItem[] = [
    {
        title: "Overview",
        url: "/overview",
        icon: LayoutDashboard,
        hideFrom: ["visitor"],
    },
    {
        title: "Operations",
        url: "/orders",
        icon: Coffee,
        hideFrom: ["visitor"],
        items: [
            {
                title: "Orders",
                url: "/orders",
            },
            {
                title: "Kasir & Setoran",
                url: "/kasir",
            },
            {
                title: "Menu",
                url: "/menu",
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
            },
            {
                title: "Maps",
                url: "/maps",
            },
        ],
    },
    {
        title: "Customers",
        url: "/customers",
        icon: Users,
        hideFrom: ["visitor"],
        items: [
            {
                title: "Customers",
                url: "/customers",
            },
            {
                title: "Reviews",
                url: "/reviews",
            },
        ],
    },
    {
        title: "Finance",
        url: "/transactions",
        icon: CreditCard,
        hideFrom: ["visitor"],
        items: [
            {
                title: "Transactions",
                url: "/transactions",
            },
            {
                title: "Payouts",
                url: "/payouts",
            },
        ],
    },
    {
        title: "Employee & Payroll",
        url: "/employee",
        icon: Shield,
        hideFrom: ["visitor"],
    },
    {
        title: "Chat",
        url: "/chat",
        icon: MessageSquare,
    },
    {
        title: "System",
        url: "/audit",
        icon: ScrollText,
        hideFrom: ["visitor"],
        items: [
            {
                title: "Audit Log",
                url: "/audit",
            },
            {
                title: "Notifications",
                url: "/notifications",
            },
        ],
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
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
    const role = (session?.user as { role?: string } | undefined)?.role;

    const visibleItems = useMemo(
        () =>
            role
                ? navMain.filter((item) => !item.hideFrom?.includes(role))
                : navMain,
        [role],
    );

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
