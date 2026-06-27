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
          bg: "#070709",
          panel: "#0e0e15",
          panel2: "#121220",
          border: "#23232f",
          purple: "#8b5cf6",
          purpleBright: "#a78bfa",
          purpleDim: "#4c4070",
          neon: "#7cff57",
          neonDim: "#3f6b34",
          fail: "#b794f4",
          text: "#e8e8f0",
          muted: "#8b8b9e",
        },
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
