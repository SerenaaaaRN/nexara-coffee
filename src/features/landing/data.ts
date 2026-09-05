import type {
    LandingTestimonial,
    PublicBranch,
    PublicMenuItem,
} from "@/features/landing/types";

export const LANDING_COPY = {
    badge: "Jaringan kopi Palembang",
    headline: "Kopi favorit Palembang, dari hulu sampai cangkir",
    subheadline:
        "Jelajahi menu andalan dan cabang Nexara Coffee terdekat dari rumahmu.",
    primaryCta: "Lihat Menu",
    secondaryCta: "Cari Cabang",
    loginCta: "Masuk",
    registerCta: "Daftar",
} as const;

export const LANDING_FEATURES = [
    {
        icon: "Wallet",
        title: "Setoran Harian Transparan",
        description:
            "Setiap rupiah tercatat rapi di tiap cabang, bisa dipantau kapan saja.",
    },
    {
        icon: "Receipt",
        title: "Pesanan Terpantau",
        description:
            "Status pesanan dapur sampai kasir selalu sinkron dan terpantau.",
    },
    {
        icon: "Building2",
        title: "Cabang Dekat Kamu",
        description:
            "Belasan titik di Palembang, tinggal pilih yang paling dekat.",
    },
] as const;

export const FALLBACK_BRANCHES: PublicBranch[] = [];

export const FALLBACK_MENU: PublicMenuItem[] = [];

export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
    {
        quote: "Kopinya konsisten, tempatnya nyaman buat kerja.",
        name: "Rani",
        role: "Pelanggan",
    },
    {
        quote: "Pelayanan cepat, menu favorit selalu tersedia.",
        name: "Bagas",
        role: "Pelanggan",
    },
    {
        quote: "Cabang dekat rumah, jadi langganan tiap pagi.",
        name: "Sinta",
        role: "Pelanggan",
    },
];
