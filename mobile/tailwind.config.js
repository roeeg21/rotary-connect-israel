/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Rotary Brand Colors
        primary: {
          DEFAULT: "#003366", // Rotary Royal Blue
          foreground: "#FFFFFF",
        },
        gold: {
          DEFAULT: "#C4A052", // Rotary Gold
          foreground: "#1A1A1A",
        },
        background: "#FAFAF8", // Warm off-white
        foreground: "#1A1A1A", // Deep charcoal
        muted: {
          DEFAULT: "#F4F4F2",
          foreground: "#737373",
        },
        border: "#E5E5E3",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
        },
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        hebrew: ["Heebo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
