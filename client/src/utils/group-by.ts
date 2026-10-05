import { getDateGroup } from "@/utils/format";

/**
 * Group items by status. Pre-init semua bucket dari `statuses`, lalu push item ke bucket sesuai `item.status`.
 * Dipakai oleh kanban board (orders, kasir).
 */
export function groupByStatus<T extends { status: string }>(
    items: T[],
    statuses: readonly string[],
): Record<string, T[]> {
    const grouped: Record<string, T[]> = {};
    for (const s of statuses) grouped[s] = [];
    for (const item of items) {
        if (grouped[item.status]) grouped[item.status].push(item);
    }
    return grouped;
}

/**
 * Group items by date menggunakan `getDateGroup()`. Output diurutkan:
 * Today → Yesterday → This Week → Earlier.
 * Dipakai oleh audit timeline dan notifications list.
 */
export function groupByDate<T extends { createdAt: string | Date }>(
    items: T[],
): { label: string; items: T[] }[] {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
        const group = getDateGroup(new Date(item.createdAt));
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
    }
    const order = ["Today", "Yesterday", "This Week", "Earlier"];
    return order
        .filter((g) => groups[g])
        .map((g) => ({ label: g, items: groups[g] }));
}
