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
        proxy: {
            "/api/landing": "http://localhost:3000",
            "/api/maps": "http://localhost:3000",
            "/api/menu": "http://localhost:3000",
            "/api/branches": "http://localhost:3000",
            "/api/notifications": "http://localhost:3000",
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
