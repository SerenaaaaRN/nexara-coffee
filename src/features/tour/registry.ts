import type {
    TourDef,
    TourGroup,
    TourId,
    TourStepDef,
} from "@/features/tour/types";
import type { Role } from "@/lib/rbac";
import { ALL_STEPS } from "./data";

/**
 * Ambil langkah dari grup tertentu. Tur per-halaman membuang langkah handoff
 * (tak perlu pindah halaman); tur pengenalan memakai semuanya.
 */
const stepsFor = (
    role: Role,
    groups: TourGroup[],
    excludeHandoff: boolean,
): TourStepDef[] =>
    ALL_STEPS.filter(
        (step) =>
            groups.includes(step.group) &&
            (!excludeHandoff || !step.navigateTo) &&
            (step.visibleFor?.(role) ?? true),
    );

/** Registry tur: pengenalan multi-halaman + tur pendek per halaman. */
export const TOURS: Record<TourId, TourDef> = {
    pengenalan: {
        id: "pengenalan",
        title: "Tur Pengenalan Nexara",
        buildSteps: (role) =>
            stepsFor(
                role,
                [
                    "intro",
                    "shell",
                    "header",
                    "overview",
                    "orders",
                    "kasir",
                    "outro",
                ],
                false,
            ),
    },
    overview: {
        id: "overview",
        title: "Tur Halaman Overview",
        buildSteps: (role) => stepsFor(role, ["overview"], true),
    },
    orders: {
        id: "orders",
        title: "Tur Halaman Orders",
        buildSteps: (role) => stepsFor(role, ["orders"], true),
    },
    kasir: {
        id: "kasir",
        title: "Tur Halaman Kasir",
        buildSteps: (role) => stepsFor(role, ["kasir"], true),
    },
    menu: {
        id: "menu",
        title: "Tur Halaman Menu",
        buildSteps: (role) => stepsFor(role, ["menu"], true),
    },
    chat: {
        id: "chat",
        title: "Tur Halaman Chat",
        buildSteps: (role) => stepsFor(role, ["chat"], true),
    },
    settings: {
        id: "settings",
        title: "Tur Halaman Settings",
        buildSteps: (role) => stepsFor(role, ["settings"], true),
    },
    pos: {
        id: "pos",
        title: "Tur Halaman POS",
        buildSteps: (role) => stepsFor(role, ["pos"], true),
    },
    sambutan: {
        id: "sambutan",
        title: "Tur Portal Member",
        buildSteps: (role) =>
            stepsFor(
                role,
                ["portal", "my-orders", "my-member", "my-account"],
                false,
            ),
    },
};

const ROUTE_OVERRIDES: Partial<Record<TourId, string>> = {
    sambutan: "/my",
};

/**
 * Mapping route → tur, diderivasi dari TOURS (single source of truth).
 */
const routeTourMap: [string, TourId][] = (Object.keys(TOURS) as TourId[])
    .filter((id) => id !== "pengenalan")
    .map((id) => [ROUTE_OVERRIDES[id] ?? `/${id}`, id] as [string, TourId])
    .sort((a, b) => b[0].length - a[0].length);

/** Petakan pathname aktif ke tur per-halaman; default tur pengenalan. */
export const tourForPathname = (pathname: string): TourId =>
    routeTourMap.find(([prefix]) => pathname.startsWith(prefix))?.[1] ??
    "pengenalan";

export const isKnownTourId = (value: string): value is TourId => value in TOURS;
