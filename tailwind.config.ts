import type { Config } from "tailwindcss";
const { fontFamily } = require("tailwindcss/defaultTheme");

const config: Config = {
  darkMode: ["class"],
  // UPDATED CONTENT PATHS: Checks both ./src/ and ./ (root) folders
  content: [
    "./src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // 1. FONTS: Re-adding these so your text looks correct
      fontFamily: {
        display: ["'Instrument Serif'", "'Cormorant Garamond'", ...fontFamily.serif],
        serif: ["'Cormorant Garamond'", ...fontFamily.serif],
        body: ["'DM Sans'", ...fontFamily.sans],
        mono: ["'JetBrains Mono'", ...fontFamily.mono],
      },
      // 2. COLORS
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        score: {
          excellent: "#22c55e",
          veryGood: "#84cc16",
          good: "#eab308",
          fair: "#f97316",
          poor: "#ef4444",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // 3. ANIMATIONS: Re-adding these for the orbs/glow effects
      animation: {
        "pulse-subtle": "pulse-subtle 8s ease-in-out infinite",
        "blob-float": "blob-float 25s ease-in-out infinite",
        "shimmer": "shimmer 8s ease-in-out infinite",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "0.12" },
          "50%": { opacity: "0.2" },
        },
        "blob-float": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "25%": { transform: "translate(50px, -50px) scale(1.1)" },
          "50%": { transform: "translate(-30px, 30px) scale(0.9)" },
          "75%": { transform: "translate(-50px, -30px) scale(1.05)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;