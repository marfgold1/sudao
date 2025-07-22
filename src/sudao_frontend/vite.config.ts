import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";
import environment from "vite-plugin-environment";
import dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        emptyOutDir: true,
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
    optimizeDeps: {
        include: ["@dfinity/agent", "@dfinity/candid", "@dfinity/principal"],
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
        },
    },
    plugins: [
        react(),
        environment("all", { prefix: "CANISTER_" }),
        environment("all", { prefix: "DFX_" }),
    ],
    server: {
        host: true,
        strictPort: true,
        port: 3000,
        proxy: {
            "/api": {
                target: "http://127.0.0.1:4943",
                changeOrigin: true,
            },
        },
    },
    resolve: {
        alias: [
            {
                find: "declarations",
                replacement: fileURLToPath(
                    new URL("../declarations", import.meta.url)
                ),
            },
            {
                find: "@",
                replacement: path.resolve(__dirname, "./src"),
            },
        ],
        extensions: [".tsx", ".ts", ".jsx", ".js"],
        dedupe: ["@dfinity/agent"],
    },
});
