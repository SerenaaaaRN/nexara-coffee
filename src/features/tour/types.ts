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
    | "chat"
    | "settings"
    | "pos"
    | "portal"
    | "my-orders"
    | "my-member"
    | "my-account";

export type TourHandoffTarget =
    | "/orders"
    | "/kasir"
    | "/my/orders"
    | "/my/member"
    | "/my/account";

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
    | "chat"
    | "settings"
    | "pos"
    | "sambutan";

export interface TourDef {
    id: TourId;
    title: string;
    buildSteps: (role: Role) => TourStepDef[];
}
