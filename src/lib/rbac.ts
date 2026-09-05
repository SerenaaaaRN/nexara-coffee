export const ROLES = {
    super_admin: 0,
    branch_manager: 1,
    franchise_owner: 2,
    cashier: 3,
    barista: 4,
    visitor: 5,
} as const;

export type Role = keyof typeof ROLES;

const ROLE_HIERARCHY: Record<Role, number> = ROLES;

export type Resource =
    | "menu"
    | "orders"
    | "users"
    | "branches"
    | "customers"
    | "reviews"
    | "finance"
    | "payouts"
    | "chat"
    | "system"
    | "ai"
    | "employee"
    | "reports"
    | "setoran"
    | "notifications"
    | "maps";

export type Action =
    | "create"
    | "read"
    | "update"
    | "delete"
    | "approve"
    | "manage"
    | "process";

type PermissionMap = Partial<Record<Resource, Action[]>>;

// Each role's permissions. Higher roles inherit from lower ones automatically.
const PERMISSIONS: Record<Role, PermissionMap> = {
    super_admin: {
        menu: ["manage"],
        orders: ["manage"],
        users: ["manage"],
        branches: ["manage"],
        customers: ["manage"],
        reviews: ["manage"],
        finance: ["manage"],
        payouts: ["manage"],
        chat: ["manage"],
        system: ["manage"],
        ai: ["manage"],
        employee: ["manage"],
        reports: ["manage"],
        notifications: ["manage"],
        maps: ["manage"],
    },
    branch_manager: {
        menu: ["create", "read", "update", "delete"],
        orders: ["read", "update", "process"],
        users: ["read", "update"],
        branches: ["read", "update"],
        customers: ["read"],
        reviews: ["read", "update", "approve"],
        finance: ["read"],
        chat: ["read", "create"],
        employee: ["create", "read", "update", "process"],
        reports: ["read"],
        setoran: ["create", "read", "update", "approve"],
        ai: ["read"],
        system: ["read"],
        notifications: ["read"],
        maps: ["read"],
    },
    franchise_owner: {
        orders: ["read", "process"],
        users: ["read", "update"],
        branches: ["read"],
        reviews: ["read"],
        finance: ["read"],
        payouts: ["create", "read"],
        chat: ["read", "create"],
        reports: ["read"],
        setoran: ["read"],
        notifications: ["read"],
        maps: ["read"],
    },
    cashier: {
        menu: ["read"],
        orders: ["create", "read"],
        customers: ["create", "read"],
        branches: ["read"],
        chat: ["read", "create"],
        setoran: ["create", "read", "delete"],
        reports: ["read"],
        notifications: ["read"],
        finance: ["create", "read"],
        users: ["read", "update"],
        maps: ["read"],
    },
    barista: {
        menu: ["read"],
        orders: ["read", "update", "process"],
        branches: ["read"],
        chat: ["read", "create"],
        reports: ["read"],
        notifications: ["read"],
        users: ["read", "update"],
        maps: ["read"],
    },
    visitor: {
        branches: ["read"],
        maps: ["read"],
        chat: ["read", "create"],
        users: ["read", "update"],
    },
};

export function can(role: Role, action: Action, resource: Resource): boolean {
    if (role === "super_admin") return true;

    const rolePerms = PERMISSIONS[role]?.[resource];
    if (!rolePerms) return false;

    return rolePerms.includes(action);
}

/**
 * Check if user's role is at or above a target role level.
 * E.g. canImpersonate("branch_manager", "cashier") → true
 *      canImpersonate("cashier", "branch_manager") → false
 */
export function hasLevel(role: Role, minRole: Role): boolean {
    return (ROLE_HIERARCHY[role] ?? 999) <= ROLE_HIERARCHY[minRole];
}
