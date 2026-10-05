import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Palette, Shield, User, UserCog } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AccountFormSection } from "@/features/settings/components/account-form-section";
import { AppearanceFormSection } from "@/features/settings/components/appearance-form-section";
import { ProfileFormSection } from "@/features/settings/components/profile-form-section";
import { UsersFormSection } from "@/features/settings/components/users-form-section";
import { useUsers } from "@/features/settings/hooks/useSettingsQueries";
import type { SettingsUser } from "@/features/settings/types";
import { useSession } from "@/lib/auth-client";
import type { Role } from "@/lib/rbac";
import { cn } from "@/utils/cn";

type SectionRenderProps = {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        image: string | null;
    };
    users: SettingsUser[];
    currentRole: Role;
};

type SectionConfig = {
    title: string;
    desc: string;
    icon: ReactNode;
    adminOnly?: boolean;
    render: (props: SectionRenderProps) => ReactNode;
};

const SECTIONS: Record<string, SectionConfig> = {
    profile: {
        title: "Profile",
        desc: "This information will be displayed publicly so be careful what you share.",
        icon: <UserCog size={18} />,
        render: ({ user }) => <ProfileFormSection user={user} />,
    },
    account: {
        title: "Account",
        desc: "Update your account password and security settings.",
        icon: <User size={18} />,
        render: () => <AccountFormSection />,
    },
    appearance: {
        title: "Appearance",
        desc: "Customize the appearance of the dashboard. Switch between themes.",
        icon: <Palette size={18} />,
        render: () => <AppearanceFormSection />,
    },
    users: {
        title: "User Management",
        desc: "Manage user roles and access permissions.",
        icon: <Shield size={18} />,
        adminOnly: true,
        render: ({ users, currentRole }) => (
            <UsersFormSection users={users} currentRole={currentRole} />
        ),
    },
};

const routeApi = getRouteApi("/_dashboard/settings");

export const SettingsPage = () => {
    const { section } = routeApi.useSearch();
    const navigate = useNavigate();
    const { data: sessionData } = useSession();

    const currentRole = (sessionData?.user?.role as Role) ?? "visitor";
    const isAdminOrManager =
        currentRole === "super_admin" || currentRole === "branch_manager";

    const usersResponse = useUsers();
    const usersData = usersResponse.data;
    const users = usersData && usersData.success ? usersData.data : [];

    const activeSectionKey = section ?? "profile";

    const visibleSections = useMemo(() => {
        return Object.entries(SECTIONS).filter(
            ([, config]) => !config.adminOnly || isAdminOrManager,
        );
    }, [isAdminOrManager]);

    const activeConfig = SECTIONS[activeSectionKey] ?? SECTIONS.profile;

    const handleSectionSelect = (key: string) => {
        navigate({
            to: ".",
            search: (prev) => ({
                ...prev,
                section: key as "profile" | "account" | "appearance" | "users",
            }),
        });
    };

    if (!sessionData?.user) {
        return null;
    }

    const currentUser = {
        id: sessionData.user.id,
        name: sessionData.user.name ?? "",
        email: sessionData.user.email ?? "",
        role: sessionData.user.role ?? "visitor",
        image: sessionData.user.image ?? null,
    };

    return (
        <div className="space-y-6">
            <SectionHeader
                title="Settings"
                subtitle="Manage your account settings and set e-mail preferences."
            />

            <Separator className="my-4 lg:my-6" />

            <div className="flex flex-1 flex-col space-y-8 md:flex-row md:space-y-0 md:space-x-12">
                <aside className="md:w-48 lg:w-56">
                    <div className="p-1 md:hidden">
                        <Select
                            value={activeSectionKey}
                            onValueChange={(v) =>
                                handleSectionSelect(v ?? "profile")
                            }
                            items={Object.fromEntries(
                                visibleSections.map(([key, item]) => [
                                    key,
                                    item.title,
                                ]),
                            )}>
                            <SelectTrigger className="h-12 w-full">
                                <SelectValue placeholder="Select section" />
                            </SelectTrigger>
                            <SelectContent>
                                {visibleSections.map(([key, item]) => (
                                    <SelectItem key={key} value={key}>
                                        <div className="flex gap-x-4 px-2 py-1">
                                            <span className="scale-125">
                                                {item.icon}
                                            </span>
                                            <span className="text-md">
                                                {item.title}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <ScrollArea className="hidden w-full min-w-40 bg-background px-1 py-2 md:block">
                        <nav className="flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0">
                            {visibleSections.map(([key, item]) => {
                                const isActive = activeSectionKey === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleSectionSelect(key)}
                                        className={cn(
                                            "inline-flex items-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 justify-start w-full cursor-pointer",
                                            isActive
                                                ? "bg-muted hover:bg-accent"
                                                : "hover:bg-accent hover:underline",
                                        )}>
                                        <span className="me-2">
                                            {item.icon}
                                        </span>
                                        {item.title}
                                    </button>
                                );
                            })}
                        </nav>
                    </ScrollArea>
                </aside>

                <div className="flex-1">
                    <div className="flex-none">
                        <h3 className="text-lg font-medium">
                            {activeConfig.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {activeConfig.desc}
                        </p>
                    </div>
                    <Separator className="my-4 flex-none" />
                    <div className="w-full pe-4 pb-12">
                        <div
                            className={cn(
                                "w-full",
                                activeSectionKey !== "users" && "lg:max-w-xl",
                            )}>
                            {activeConfig.render({
                                user: currentUser,
                                users,
                                currentRole,
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
