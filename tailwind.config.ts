import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          bone: "#F2EFE9",
          stone: "#E4DFD7",
          border: "#C8C2B7",
          carbon: "#141413",
          orange: "#FF4F00",
          moss: "#1E4D2B",
          amber: "#D97706",
          darkbg: "#10100F",
          darkpanel: "#1A1A18",
          darkborder: "#2C2C28",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Space Grotesk", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SF Mono", "monospace"],
      },
      boxShadow: {
        tactile: "0 2px 0 0 #141413",
        "tactile-press": "0 0 0 0 #141413",
        "tactile-sm": "0 1px 0 0 #141413",
        "tactile-lg": "0 4px 0 0 #141413",
        "tactile-dark": "0 2px 0 0 #000000",
      },
    },
  },
  plugins: [],
};
export default config;
