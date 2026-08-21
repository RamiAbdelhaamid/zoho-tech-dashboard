/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "'Segoe UI'", "Tahoma", "Arial", "sans-serif"],
        mono: ["'IBM Plex Mono'", "'SFMono-Regular'", "Consolas", "monospace"],
      },
      boxShadow: {
        glow: "0 18px 50px -32px rgb(14 165 233 / 0.7)",
        panel: "0 18px 45px -30px rgb(15 23 42 / 0.35)",
      },
    },
  },
  plugins: [],
};
