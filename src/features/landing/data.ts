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

export const LANDING_HERO_SLIDES = [
    {
        src: "/caffe1.jpg",
        alt: "Suasana hangat gerai Nexara Coffee",
    },
    {
        src: "/caffe2.jpg",
        alt: "Bar Nexara Coffee saat seduh manual",
    },
] as const;
