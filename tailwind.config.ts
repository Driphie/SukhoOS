import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
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
          glow: "hsl(var(--accent-glow))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        "3xl": "1.75rem",
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-glow": "var(--gradient-glow)",
        "gradient-aurora": "var(--gradient-aurora)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        glow: "var(--shadow-glow)",
        "glow-blue": "var(--shadow-glow-blue)",
        neo: "var(--shadow-neo-light)",
        press: "var(--shadow-press)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-out": { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(.96)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "slide-up": { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "shimmer": { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 30px hsl(var(--primary) / .35)" },
          "50%": { boxShadow: "0 0 60px hsl(var(--primary) / .7)" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "wave": {
          "0%,100%": { transform: "scaleY(.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down .25s ease-out",
        "accordion-up": "accordion-up .25s ease-out",
        "fade-in": "fade-in .4s ease-out",
        "fade-out": "fade-out .25s ease-out",
        "scale-in": "scale-in .25s ease-out",
        "slide-up": "slide-up .5s cubic-bezier(.2,.8,.2,1)",
        "shimmer": "shimmer 2.5s linear infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "wave": "wave 1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
