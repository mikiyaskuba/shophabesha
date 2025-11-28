/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6d28d9",    // Deep Purple
        accent: "#00d4ff",     // Neon Cyan
        surface: "#0f172a",    // Dark Slate
        card: "#1e293b",       // Card BG
        success: "#22c55e",
        danger: "#f43f5e",
      },
    },
  },
  plugins: [],
}