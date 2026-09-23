import type { Alignment, Side } from "driver.js";
import type { Role } from "@/lib/rbac";

export type TourGroup =
    | "intro"
    | "shell"
    | "header"
    | "overview"
    | "orders"
    | "kasir"
    | "outro"
    | "menu"
    | "transactions"
    | "branches"
    | "maps"
    | "customers"
    | "reviews"
    | "employee"
    | "payouts"
    | "chat"
    | "audit"
    | "notifications"
    | "settings"
    | "pos";

export type TourHandoffTarget = "/orders" | "/kasir";

export interface TourStepDef {
    id: string;
    group: TourGroup;
    element?: string;
    title: string;
    description: string;
    side?: Side;
    align?: Alignment;
    waitForElement?: number;
    navigateTo?: TourHandoffTarget;
    visibleFor?: (role: Role) => boolean;
    advanceOnClick?: boolean;
}

export type TourId =
    | "pengenalan"
    | "overview"
    | "orders"
    | "kasir"
    | "menu"
    | "transactions"
    | "branches"
    | "maps"
    | "customers"
    | "reviews"
    | "employee"
    | "payouts"
    | "chat"
    | "audit"
    | "notifications"
    | "settings"
    | "pos";

export interface TourDef {
    id: TourId;
    title: string;
    buildSteps: (role: Role) => TourStepDef[];
}
