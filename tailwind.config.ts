import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#0a0a0f",
          panel: "#13131d",
          border: "#262633",
          win: "#22d3a8",
          lose: "#f43f5e",
          accent: "#8b5cf6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
