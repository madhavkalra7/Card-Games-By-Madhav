import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "380px",
      },
      colors: {
        table: {
          darkest: "#051a10",
          dark: "#08331f",
          felt: "#0F5132",
          light: "#157347",
          rim: "#1d8a57",
        },
        wood: {
          shadow: "#120a06",
          dark: "#24160d",
          walnut: "#382012",
          light: "#52331c",
          grain: "#6e4425",
        },
        gold: {
          dark: "#8c6b04",
          DEFAULT: "#d4af37",
          bright: "#f59e0b",
          light: "#fef08a",
          shimmer: "#fffbeb",
        },
        card: {
          cream: "#fbfaf5",
          red: "#dc2626",
          black: "#18181b",
        }
      },
      boxShadow: {
        "poker-felt": "inset 0 0 120px rgba(0, 0, 0, 0.8), 0 25px 50px -12px rgba(0, 0, 0, 0.7)",
        "walnut-rail": "0 20px 40px -15px rgba(0, 0, 0, 0.9), inset 0 2px 4px rgba(255, 255, 255, 0.1), inset 0 -6px 12px rgba(0, 0, 0, 0.8)",
        "gold-glow": "0 0 25px rgba(212, 175, 55, 0.45)",
        "card": "0 4px 12px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.2)",
        "card-hover": "0 14px 28px rgba(0,0,0,0.4), 0 6px 10px rgba(0,0,0,0.3)",
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
        anton: ["Anton", "sans-serif"],
        inter: ["Inter", "sans-serif"],
      },
      keyframes: {
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(212, 175, 55, 0.3)" },
          "50%": { boxShadow: "0 0 35px rgba(212, 175, 55, 0.75)" },
        },
        floatCard: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        }
      },
      animation: {
        "pulse-gold": "pulseGold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-card": "floatCard 2.5s ease-in-out infinite",
      }
    },
  },
  plugins: [],
};
export default config;
