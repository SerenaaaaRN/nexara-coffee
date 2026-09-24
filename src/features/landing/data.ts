import type {
    LandingTestimonial,
    PublicBranch,
    PublicMenuItem,
} from "@/features/landing/types";

export const LANDING_COPY = {
    eyebrow: "Rumah kopi Palembang",
    headlineA: "Seduh pelan,",
    headlineB: "rasa dalam.",
    subheadline:
        "Biji pilihan, sangrai presisi, dan ruang yang tenang di tiap cabang Nexara.",
    primaryCta: "Jelajahi Menu",
    secondaryCta: "Temukan Cabang",
    loginCta: "Masuk",
    registerCta: "Jadi Member",
    marquee: [
        "Seduh fresh setiap hari",
        "Biji pilihan Nusantara",
        "Palembang",
        "Ruang tenang",
        "Nexara Coffee",
    ],
} as const;

export interface LandingRitual {
    index: string;
    title: string;
    description: string;
    image: string;
}

export const LANDING_RITUALS: LandingRitual[] = [
    {
        index: "01",
        title: "Biji pilihan Nusantara",
        description:
            "Arabika dataran tinggi dan robusta Pezzotta, dikurasi tiap musim panen lalu diistirahatkan hingga titik manisnya.",
        image: "https://picsum.photos/seed/nexara-beans/1200/900",
    },
    {
        index: "02",
        title: "Sangrai dan seduh presisi",
        description:
            "Profil sangrai dikalibrasi harian. Suhu, grind, dan rasio ditimbang, bukan dikira-kira.",
        image: "https://picsum.photos/seed/nexara-brew/1200/900",
    },
    {
        index: "03",
        title: "Ruang untuk kembali",
        description:
            "Pencahayaan hangat, meja lapang, dan bar yang terbuka. Datang untuk kopi, tinggal untuk suasananya.",
        image: "https://picsum.photos/seed/nexara-space/1200/900",
    },
];

export const LANDING_EDITORIAL = {
    heading: "Kecil di jumlah, besar di rasa",
    body: "Kami tidak mengejar ratusan gerai. Tiap cabang dirawat seperti ruang tamu sendiri.",
} as const;

export const FALLBACK_BRANCHES: PublicBranch[] = [];

export const FALLBACK_MENU: PublicMenuItem[] = [];

export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
    {
        quote: "Es kopi susunya tidak pernah gagal. Tenang dan konsisten.",
        name: "Rani Pratama",
        role: "Pelanggan Setia, Cabang Basuki Rahmat",
    },
    {
        quote: "Tempat paling enak buat kerja lama tanpa merasa diusir.",
        name: "Bagas Aditya",
        role: "Freelancer, Cabang Demang",
    },
    {
        quote: "Baristanya hafal pesananku. Rasanya seperti rumah kedua.",
        name: "Sinta Maharani",
        role: "Member Gold, Cabang Veteran",
    },
];

export const LANDING_HERO_IMAGES = {
    main: "/caffe1.jpg",
    alt: "Bar Nexara Coffee saat seduh manual",
} as const;
