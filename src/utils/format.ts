const SNAKE_SEP = /_/g;
const WORD_START = /\b\w/g;

/** snake_case / kebab-case → Title Case. */
export function formatLabel(value: string): string {
    return value
        .replace(SNAKE_SEP, " ")
        .replace(WORD_START, (c) => c.toUpperCase());
}

/** Format angka sebagai Rupiah (Rp 1.234.567). */
export function formatCurrency(v: number | string): string {
    const num = typeof v === "string" ? Number(v) : v;
    return `Rp ${num.toLocaleString("id-ID")}`;
}

/** Format tanggal locale id-ID. Terima string ISO atau Date. */
export function formatDate(
    date: string | Date,
    options?: Intl.DateTimeFormatOptions,
): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("id-ID", options);
}

/** Format tanggal + jam pendek: "1 Jan 2025, 14:30". */
export function formatDateTime(date: string | Date): string {
    return formatDate(date, {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/** Format jam saja: "14:30". */
export function formatTime(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/** Kapitalisasi huruf pertama. */
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Pilih singular/plural berdasarkan count. */
export function pluralize(
    count: number,
    singular: string,
    plural?: string,
): string {
    return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Waktu relatif verbose: "5 minutes ago", "Yesterday", "3 days ago". */
export function formatRelativeTime(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/** Waktu relatif kompak: "5m ago", "2h ago", "3d ago". */
export function timeAgo(date: string | Date): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    return d.toLocaleDateString("en-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/** Cek apakah date hari ini. */
function isToday(date: Date): boolean {
    const now = new Date();
    return date.toDateString() === now.toDateString();
}

/** Cek apakah date kemarin. */
function isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
}

/** Grup tanggal untuk section header: "Today", "Yesterday", "This Week", "Earlier". */
export function getDateGroup(date: Date): string {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    if (date >= startOfWeek) return "This Week";
    return "Earlier";
}

/** Separator tanggal untuk chat: "Today", "Yesterday", "12 Jan 2025". */
export function formatDateSeparator(date: Date): string {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";

    return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
