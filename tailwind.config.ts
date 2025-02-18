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
        primary: "#087A87",
        primarydark: "#014851",
        accentlight: "#B3D2A34d",
        accent: "#B3D2A3",
        darkest: "#1C2B35",
        midgray: "#5F758A",
        lightgray: "#C1C9D0",
        lightgraytransparent: "#C1C9D063",
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
