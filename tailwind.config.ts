import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: ".5625rem",
        md: ".375rem",
        sm: ".1875rem",
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)",
        },
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
        terminal: {
          green: "hsl(var(--terminal-green) / <alpha-value>)",
          purple: "hsl(var(--terminal-purple) / <alpha-value>)",
          blue: "hsl(var(--terminal-blue) / <alpha-value>)",
          red: "hsl(var(--terminal-red) / <alpha-value>)",
          yellow: "hsl(var(--terminal-yellow) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glitch": {
          "0%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
          "100%": { transform: "translate(0)" },
        },
        "glitch-skew": {
          "0%": { transform: "skew(0deg)" },
          "20%": { transform: "skew(-1deg)" },
          "40%": { transform: "skew(1deg)" },
          "60%": { transform: "skew(-0.5deg)" },
          "80%": { transform: "skew(0.5deg)" },
          "100%": { transform: "skew(0deg)" },
        },
        "electric-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px hsl(var(--terminal-purple)), 0 0 10px hsl(var(--terminal-purple))" },
          "50%": { boxShadow: "0 0 20px hsl(var(--terminal-purple)), 0 0 40px hsl(var(--terminal-purple))" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.98" },
          "52%": { opacity: "1" },
          "54%": { opacity: "0.97" },
        },
        "typing": {
          "from": { width: "0" },
          "to": { width: "100%" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { 
            boxShadow: "0 0 5px hsl(var(--terminal-purple) / 0.5), inset 0 0 5px hsl(var(--terminal-purple) / 0.1)" 
          },
          "50%": { 
            boxShadow: "0 0 20px hsl(var(--terminal-purple) / 0.8), inset 0 0 10px hsl(var(--terminal-purple) / 0.2)" 
          },
        },
        "rgb-split": {
          "0%": { textShadow: "0 0 0 transparent" },
          "25%": { textShadow: "-2px 0 #ff0000, 2px 0 #00ffff" },
          "50%": { textShadow: "2px 0 #ff0000, -2px 0 #00ffff" },
          "75%": { textShadow: "-1px 0 #ff0000, 1px 0 #00ffff" },
          "100%": { textShadow: "0 0 0 transparent" },
        },
        "terminal-line": {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "spin-slow": {
          "from": { transform: "rotate(0deg)" },
          "to": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glitch": "glitch 0.2s ease-in-out",
        "glitch-skew": "glitch-skew 0.2s ease-in-out",
        "electric-pulse": "electric-pulse 2s ease-in-out infinite",
        "scanline": "scanline 3s linear infinite",
        "flicker": "flicker 8s linear infinite",
        "typing": "typing 2s steps(40, end)",
        "blink": "blink 0.53s step-end infinite",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 1.5s ease-in-out infinite",
        "rgb-split": "rgb-split 0.2s ease-in-out",
        "terminal-line": "terminal-line 0.3s ease-out",
        "spin-slow": "spin-slow 3s linear infinite",
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(hsl(var(--border) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.3) 1px, transparent 1px)",
        "scanline-overlay": "repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--terminal-purple) / 0.03) 2px, hsl(var(--terminal-purple) / 0.03) 4px)",
      },
      backgroundSize: {
        "grid": "20px 20px",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
