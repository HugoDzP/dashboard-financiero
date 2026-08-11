/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1220",
          900: "#101A2E",
          800: "#182541",
          700: "#233257",
        },
        paper: {
          100: "#F7F4EC",
          200: "#F0ECE0",
          300: "#E4DFCE",
        },
        teal: {
          500: "#0F5E56",
          600: "#0C4A44",
        },
        gold: {
          400: "#C9A15A",
          500: "#B08C46",
        },
        brick: {
          400: "#C1564E",
          500: "#B5433D",
        },
        slate: {
          400: "#8B93A7",
          500: "#6B7386",
        },
      },
      fontFamily: {
        display: ["Newsreader", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
