import { Search, Shield, UserCog } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useChangeUserRole } from "@/features/settings/hooks/useSettingsMutations";
import type { SettingsUser } from "@/features/settings/types";
import { ROLES, type Role } from "@/lib/rbac";
import { formatLabel } from "@/utils/format";

type UsersFormSectionProps = {
    users: SettingsUser[];
    currentRole: Role;
};

const getRoleBadgeVariant = (role: string) =>
    role === "super_admin"
        ? "default"
        : role === "branch_manager"
          ? "secondary"
          : "outline";

export const UsersFormSection = ({
    users,
    currentRole,
}: UsersFormSectionProps) => {
    const [search, setSearch] = useState("");
    const changeUserRole = useChangeUserRole();
    const [selectedUser, setSelectedUser] = useState<SettingsUser | null>(null);
    const [newRole, setNewRole] = useState<string>("");

    const myLevel = ROLES[currentRole] ?? 999;

    const assignableRoles = useMemo(() => {
        return Object.keys(ROLES).filter((r) => {
            const level = ROLES[r as Role] ?? 999;
            if (currentRole === "branch_manager") {
                return ["cashier", "barista"].includes(r);
            }
            return level > myLevel;
        });
    }, [currentRole, myLevel]);

    const filteredUsers = useMemo(() => {
        if (!search.trim()) return users;
        const q = search.toLowerCase();
        return users.filter(
            (u) =>
                u.name?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q) ||
                u.role?.toLowerCase().includes(q),
        );
    }, [users, search]);

    const handleOpenRoleModal = (user: SettingsUser) => {
        setSelectedUser(user);
        setNewRole(user.role);
    };

    const handleSaveRole = async () => {
        if (!selectedUser || !newRole) return;
        const res = await changeUserRole.mutateAsync({
            userId: selectedUser.id,
            role: newRole as Role,
        });
        if (res.success) {
            setSelectedUser(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search user by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-lg bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b">
                            <TableHead className="w-70">User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-35">Role</TableHead>
                            <TableHead className="w-30 text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-1.5">
                                        <UserCog className="h-8 w-8 text-muted-foreground/50" />
                                        <p className="font-medium text-sm">
                                            No users found
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Try searching with another keyword.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => {
                                const userLevel =
                                    ROLES[user.role as Role] ?? 999;
                                const canManage = userLevel > myLevel;

                                return (
                                    <TableRow
                                        key={user.id}
                                        className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    {user.image ? (
                                                        <AvatarImage
                                                            src={user.image}
                                                            alt={user.name}
                                                            className="object-cover"
                                                        />
                                                    ) : null}
                                                    <AvatarFallback className="bg-muted font-medium text-xs">
                                                        {user.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase() ??
                                                            "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium text-sm text-foreground">
                                                    {user.name}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-sm text-muted-foreground">
                                            {user.email}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant={getRoleBadgeVariant(
                                                    user.role,
                                                )}
                                                className="capitalize font-normal text-xs">
                                                {formatLabel(user.role)}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {canManage ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleOpenRoleModal(
                                                            user,
                                                        )
                                                    }>
                                                    Change Role
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                    Protected
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedUser ? (
                <Dialog
                    open={Boolean(selectedUser)}
                    onOpenChange={(open) => {
                        if (!open) setSelectedUser(null);
                    }}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Change User Role
                            </DialogTitle>
                            <DialogDescription>
                                Update role for{" "}
                                <span className="font-semibold text-foreground">
                                    {selectedUser.name}
                                </span>{" "}
                                (current: {formatLabel(selectedUser.role)}).
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-2">
                            <span className="text-sm font-medium text-foreground block">
                                Select New Role
                            </span>
                            <Select
                                value={newRole}
                                onValueChange={(v) =>
                                    setNewRole(v ?? selectedUser.role)
                                }
                                items={Object.fromEntries(
                                    assignableRoles.map((role) => [
                                        role,
                                        formatLabel(role),
                                    ]),
                                )}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {assignableRoles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {formatLabel(role)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedUser(null)}
                                disabled={changeUserRole.isPending}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSaveRole}
                                disabled={
                                    changeUserRole.isPending ||
                                    newRole === selectedUser.role
                                }>
                                {changeUserRole.isPending
                                    ? "Saving..."
                                    : "Change Role"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}
        </div>
    );
};
