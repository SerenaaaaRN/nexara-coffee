import netlify from "@netlify/vite-plugin-tanstack-start";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
    resolve: { tsconfigPaths: true },
    server: {
        // NOTE(transisi): eksplisit per modul — /api/auth/* SENGAJA tidak
        // diproxy agar tetap ke handler Start sampai cutover Fase 2.
        proxy: {
            "/api/landing": "http://localhost:3000",
            "/api/maps": "http://localhost:3000",
            "/api/menu": "http://localhost:3000",
            "/api/branches": "http://localhost:3000",
            "/api/notifications": "http://localhost:3000",
            "/api/reviews": "http://localhost:3000",
            "/api/audit": "http://localhost:3000",
            "/api/transactions": "http://localhost:3000",
            "/api/payouts": "http://localhost:3000",
            "/api/employees": "http://localhost:3000",
            "/api/settings": "http://localhost:3000",
            "/api/orders": "http://localhost:3000",
            "/api/kasir": "http://localhost:3000",
            "/api/chat": "http://localhost:3000",
            "/api/my": "http://localhost:3000",
            "/api/overview": "http://localhost:3000",
            "/api/ably": "http://localhost:3000",
            "/openapi": "http://localhost:3000",
        },
    },
    plugins: [
        devtools(),
        tailwindcss(),
        tanstackStart({
            spa: {
                enabled: true,
            },
        }),
        ...(process.env.NODE_ENV === "production" ? [netlify()] : []),
        viteReact(),
        babel({ presets: [reactCompilerPreset()] }),
    ],
});

export default config;
