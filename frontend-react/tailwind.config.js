/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nepal flag crimson red (PMS 485C ≈ #DC143C)
        crimson: {
          50: "#fff1f2",
          100: "#ffe0e4",
          200: "#ffc6cd",
          300: "#ff9daa",
          400: "#ff6d83",
          500: "#f23359",
          600: "#dc143c",
          700: "#b90a30",
          800: "#9b0d2e",
          900: "#84102f",
          950: "#490211",
        },
        // Nepal flag royal blue (outer border ≈ #003893)
        royal: {
          50: "#eef4ff",
          100: "#dce8fe",
          200: "#c0d6fe",
          300: "#94bafd",
          400: "#6193fa",
          500: "#3d6ef6",
          600: "#274cea",
          700: "#1f39d7",
          800: "#1e30ae",
          900: "#1e2f89",
          950: "#0a1a40",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', '"Noto Serif Devanagari"', "Georgia", "serif"],
      },
    },
  },
  plugins: [],
}