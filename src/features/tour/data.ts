import type { TourStepDef } from "@/features/tour/types";
import { can } from "@/lib/rbac";

export const ALL_STEPS: TourStepDef[] = [
    {
        id: "intro",
        group: "intro",
        title: "Selamat datang di Nexara",
        description:
            "Ikuti tur singkat untuk mengenal dashboard operasional cafe: navigasi, cabang, ringkasan, orders, hingga setoran kasir.",
    },
    {
        id: "shell-team",
        group: "shell",
        element: '[data-tour="team-switcher"]',
        title: "Pindah aplikasi",
        description:
            "Ganti antara Dashboard, Nexara POS, dan Landing Page dari sini.",
        side: "right",
    },
    {
        id: "shell-nav",
        group: "shell",
        element: '[data-tour="sidebar-nav"]',
        title: "Menu navigasi",
        description:
            "Semua modul operasional ada di sini: Overview, Orders, Kasir, Menu, hingga Pengaturan. Menu menyesuaikan peran Anda.",
        side: "right",
    },
    {
        id: "shell-user",
        group: "shell",
        element: '[data-tour="nav-user"]',
        title: "Akun Anda",
        description: "Lihat profil dan keluar dari aplikasi lewat menu ini.",
        side: "right",
    },
    {
        id: "header-actions",
        group: "header",
        element: '[data-tour="header-actions"]',
        title: "Cabang aktif & tema",
        description:
            "Filter data per cabang atau lihat semua cabang sekaligus. Ikon palet di sebelahnya mengganti tema tampilan.",
        side: "bottom",
        align: "end",
    },
    {
        id: "overview-stats",
        group: "overview",
        element: '[data-tour="overview-stats"]',
        title: "Ringkasan kinerja",
        description:
            "Total omzet, order, cabang aktif, dan rata-rata nilai order jaringan cafe sekilas.",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "reports"),
    },
    {
        id: "overview-tabs",
        group: "overview",
        element: '[data-tour="overview-tabs"]',
        title: "Tab analisis",
        description:
            "Tiga tab — Revenue, Orders, Analytics — masing-masing berisi grafik berbeda.",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "reports"),
    },
    {
        id: "overview-revenue",
        group: "overview",
        element: '[data-tour="overview-revenue"]',
        title: "Tab Revenue",
        description:
            "Pendapatan per cabang dan komposisi metode bayar sekilas.",
        side: "top",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "reports"),
    },
    {
        id: "handoff-orders",
        group: "orders",
        element: '[data-tour="sidebar-nav"]',
        title: "Lanjut ke Orders",
        description:
            "Klik Lanjut untuk pindah ke halaman Orders dan melihat antrean order.",
        side: "right",
        navigateTo: "/orders",
        visibleFor: (role) => can(role, "read", "orders"),
    },
    {
        id: "orders-stats",
        group: "orders",
        element: '[data-tour="orders-stats"]',
        title: "Status order",
        description:
            "Pantau Total, Pending, Completed, dan Cancelled secara realtime.",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "orders"),
    },
    {
        id: "orders-toolbar",
        group: "orders",
        element: '[data-tour="orders-toolbar"]',
        title: "Cari & filter",
        description:
            "Cari order, filter kolom, dan ganti tampilan Tabel atau Board (kanban).",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "orders"),
    },
    {
        id: "handoff-kasir",
        group: "kasir",
        element: '[data-tour="sidebar-nav"]',
        title: "Lanjut ke Kasir",
        description:
            "Klik Lanjut untuk pindah ke halaman Kasir & Setoran harian.",
        side: "right",
        navigateTo: "/kasir",
        visibleFor: (role) => can(role, "read", "setoran"),
    },
    {
        id: "kasir-content",
        group: "kasir",
        element: '[data-tour="kasir-content"]',
        title: "Setoran harian",
        description:
            "Setoran adalah deklarasi kas fisik tiap cabang per hari, direkonsiliasi dengan hasil POS. Manager menyetujui atau menolak di sini.",
        side: "top",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "setoran"),
    },
    {
        id: "kasir-record",
        group: "kasir",
        element: '[data-tour="kasir-record"]',
        title: "Catat setoran",
        description:
            "Klik tombol ini setiap akhir hari untuk mencatat setoran. Nominal terisi otomatis dari total tunai POS.",
        side: "bottom",
        align: "end",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "create", "setoran"),
    },
    {
        id: "outro",
        group: "outro",
        title: "Tur selesai",
        description:
            "Anda siap mengoperasikan Nexara. Klik ikon bantuan di header kapan saja untuk mengulang tur ini.",
    },
    {
        id: "menu-stats",
        group: "menu",
        element: '[data-tour="menu-stats"]',
        title: "Ringkasan menu",
        description:
            "Total item, yang tersedia, yang disembunyikan, dan jumlah kategori sekilas.",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "menu"),
    },
    {
        id: "menu-tabs",
        group: "menu",
        element: '[data-tour="menu-tabs"]',
        title: "Tab kategori",
        description:
            "Filter item per kategori. Kelola daftar kategori lewat tombol Manage dan Add Category.",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "menu"),
    },
    {
        id: "menu-add",
        group: "menu",
        element: '[data-tour="menu-add"]',
        title: "Tambah item",
        description:
            "Tambahkan item baru lengkap dengan foto, harga, dan varian dari sini.",
        side: "bottom",
        align: "end",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "create", "menu"),
    },
    {
        id: "chat-inbox",
        group: "chat",
        element: '[data-tour="chat-inbox"]',
        title: "Kotak masuk",
        description:
            "Semua channel global, cabang, dan pesan langsung ada di sini. Cari percakapan lewat kolom search.",
        side: "right",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "chat"),
    },
    {
        id: "chat-conversation",
        group: "chat",
        element: '[data-tour="chat-conversation"]',
        title: "Ruang percakapan",
        description:
            "Baca dan ikuti diskusi channel yang sedang aktif di panel ini.",
        side: "left",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "read", "chat"),
    },
    {
        id: "chat-form",
        group: "chat",
        element: '[data-tour="chat-form"]',
        title: "Kirim pesan",
        description:
            "Ketik pesan di sini lalu tekan kirim â€” terkirim real-time ke semua anggota channel.",
        side: "top",
        waitForElement: 5000,
        visibleFor: (role) => can(role, "create", "chat"),
    },
    {
        id: "settings-nav",
        group: "settings",
        element: '[data-tour="settings-nav"]',
        title: "Bagian pengaturan",
        description:
            "Pindah antar bagian Profile, Account, Appearance, dan User Management.",
        side: "right",
        waitForElement: 5000,
    },
    {
        id: "settings-content",
        group: "settings",
        element: '[data-tour="settings-content"]',
        title: "Form pengaturan",
        description:
            "Kelola profil, password, dan tampilan akun kamu di sini. Pindah bagian lewat navigasi untuk melihat panduan tiap form.",
        side: "left",
        waitForElement: 5000,
    },
    {
        id: "settings-avatar",
        group: "settings",
        element: '[data-tour="settings-avatar"]',
        title: "Foto profil",
        description:
            "Klik avatar atau tombol kamera untuk memilih foto baru (JPEG, PNG, WebP, atau GIF, maks 5MB), lalu tekan Save Avatar.",
        side: "right",
        waitForElement: 5000,
    },
    {
        id: "settings-goto-account",
        group: "settings",
        element: '[data-tour="settings-goto-account"]',
        title: "Buka bagian Account",
        description:
            "Klik tombol Account untuk lanjut ke panduan ubah password.",
        side: "right",
        waitForElement: 5000,
        advanceOnClick: true,
    },
    {
        id: "settings-password",
        group: "settings",
        element: '[data-tour="settings-password"]',
        title: "Ubah password",
        description:
            "Isi password lama, password baru, dan konfirmasinya, lalu simpan.",
        side: "right",
        waitForElement: 5000,
    },
    {
        id: "settings-goto-appearance",
        group: "settings",
        element: '[data-tour="settings-goto-appearance"]',
        title: "Buka bagian Appearance",
        description:
            "Klik tombol Appearance untuk lanjut ke panduan ubah tema.",
        side: "right",
        waitForElement: 5000,
        advanceOnClick: true,
    },
    {
        id: "settings-theme",
        group: "settings",
        element: '[data-tour="settings-theme"]',
        title: "Ubah tema",
        description:
            "Pilih salah satu tema, atau tekan tombol D untuk berganti tema dengan cepat.",
        side: "top",
        waitForElement: 5000,
    },
    {
        id: "pos-catalog",
        group: "pos",
        element: '[data-tour="pos-catalog"]',
        title: "Katalog menu",
        description:
            "Cari menu dan filter per kategori, lalu klik kartu untuk menambah ke order.",
        side: "bottom",
        waitForElement: 5000,
        visibleFor: (role) =>
            role === "super_admin" ||
            role === "branch_manager" ||
            role === "cashier",
    },
    {
        id: "pos-cart",
        group: "pos",
        element: '[data-tour="pos-cart"]',
        title: "Order berjalan",
        description:
            "Item yang dipilih terkumpul di sini â€” atur jumlah atau hapus sebelum bayar.",
        side: "left",
        waitForElement: 5000,
        visibleFor: (role) =>
            role === "super_admin" ||
            role === "branch_manager" ||
            role === "cashier",
    },
    {
        id: "pos-charge",
        group: "pos",
        element: '[data-tour="pos-charge"]',
        title: "Bayar order",
        description:
            "Tekan tombol ini untuk memilih metode bayar dan mencatat nomor HP member.",
        side: "top",
        waitForElement: 5000,
        visibleFor: (role) =>
            role === "super_admin" ||
            role === "branch_manager" ||
            role === "cashier",
    },
    {
        id: "portal-intro",
        group: "portal",
        title: "Selamat datang di Nexara",
        description:
            "Ini portal member kamu: riwayat pesanan, poin loyalty, dan pengaturan akun. Ikuti tur singkat ini.",
    },
    {
        id: "portal-tabs",
        group: "portal",
        element: '[data-tour="my-tabs"]',
        title: "Navigasi portal",
        description:
            "Tiga tab — Pesananku, Member, Akun — untuk berpindah bagian portal.",
        side: "bottom",
        waitForElement: 5000,
    },
    {
        id: "my-orders-stats",
        group: "my-orders",
        element: '[data-tour="my-orders-stats"]',
        title: "Ringkasan pesanan",
        description: "Total pesanan dan yang sudah selesai sekilas.",
        side: "bottom",
        waitForElement: 5000,
    },
    {
        id: "my-orders-table",
        group: "my-orders",
        element: '[data-tour="my-orders-table"]',
        title: "Riwayat pesanan",
        description:
            "Semua pesanan kamu tercatat di sini, termasuk yang dicatat kasir di cabang. Pesanan selesai bisa diberi ulasan.",
        side: "top",
        waitForElement: 5000,
    },
    {
        id: "handoff-my-member",
        group: "my-orders",
        element: '[data-tour="my-tabs"]',
        title: "Lanjut ke Member",
        description:
            "Klik Lanjut untuk pindah ke tab Member dan melihat poin loyalty.",
        side: "bottom",
        waitForElement: 5000,
        navigateTo: "/my/member",
    },
    {
        id: "my-loyalty-stats",
        group: "my-member",
        element: '[data-tour="my-loyalty-stats"]',
        title: "Poin & segmen",
        description: "Poin loyalty, total order, dan segmen kamu saat ini.",
        side: "bottom",
        waitForElement: 5000,
    },
    {
        id: "my-loyalty-card",
        group: "my-member",
        element: '[data-tour="my-loyalty-card"]',
        title: "Kartu member",
        description:
            "Tier dan keuntungan yang kamu nikmati. Poin bertambah tiap pembelian selesai.",
        side: "top",
        waitForElement: 5000,
    },
    {
        id: "handoff-my-account",
        group: "my-member",
        element: '[data-tour="my-tabs"]',
        title: "Lanjut ke Akun",
        description:
            "Klik Lanjut untuk pindah ke tab Akun dan mengatur profil.",
        side: "bottom",
        waitForElement: 5000,
        navigateTo: "/my/account",
    },
    {
        id: "my-account-profile",
        group: "my-account",
        element: '[data-tour="my-account-profile"]',
        title: "Profil",
        description: "Ubah nama yang tampil di pesanan dan profil member kamu.",
        side: "top",
        waitForElement: 5000,
    },
    {
        id: "my-account-password",
        group: "my-account",
        element: '[data-tour="my-account-password"]',
        title: "Password",
        description: "Perbarui password untuk keamanan akun kamu.",
        side: "top",
        waitForElement: 5000,
    },
    {
        id: "portal-outro",
        group: "portal",
        title: "Selesai",
        description:
            "Itu dia portal member Nexara. Buka tur ini lagi kapan saja lewat tombol bantuan di atas.",
    },
];
