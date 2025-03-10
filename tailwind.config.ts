import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/contexts/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#29567D",
        primarylight: "#E0E9F8",
        primarydark: "#132e45",
        accentlight: "#88C2C64D",
        accent: "#4CA8AE",
        accentdark: "#347175",
        darkest: "#1C2B35",
        midgray: "#5F758A",
        lightgray: "#C1C9D0",
        lightestgray: "#C1C9D033",
        error: "#CB6A81",
      },
      fontFamily: {
        sans: ["Helvetica Neue", "sans-serif"],
      },
      boxShadow: {
        "custom-light": "0 0 4px 0 rgba(0, 0, 0, 0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
