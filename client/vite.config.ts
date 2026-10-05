import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
    resolve: { tsconfigPaths: true },
    server: {
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
            "/api/auth": "http://localhost:3000",
            "/dashboard": "http://localhost:3000",
            "/openapi": "http://localhost:3000",
        },
    },
    plugins: [
        tailwindcss(),
        viteReact(),
        babel({ presets: [reactCompilerPreset()] }),
    ],
});

export default config;
