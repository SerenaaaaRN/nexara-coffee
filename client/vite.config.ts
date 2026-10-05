import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
    resolve: { tsconfigPaths: true },
    server: {
        proxy: {
            "/api": "http://localhost:3000",
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
