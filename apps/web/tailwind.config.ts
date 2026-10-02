import type { Config } from "tailwindcss";
export default { content: ["./src/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#10211b", paper: "#f5f7f2", lime: "#c8f169", forest: "#1b4938", mint: "#dff4e8" }, boxShadow: { soft: "0 18px 50px rgba(16,33,27,.10)" }, borderRadius: { "4xl": "2rem" } } }, plugins: [] } satisfies Config;
