import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./lib/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#19352f", forest: "#21493d", sage: "#dcebdd", lime: "#c6ee78", paper: "#f7f7f2", muted: "#6e7e75" }, fontFamily: { sans: ["Arial", "Helvetica Neue", "sans-serif"] }, boxShadow: { soft: "0 16px 60px rgba(27, 51, 44, .08)" } } },
  plugins: [],
};
export default config;
