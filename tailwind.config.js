/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        makmex: {
          orange: "#FF6A00",
          ember: "#FF8A2A",
          bg: "rgb(var(--makmex-bg) / <alpha-value>)",
          surface: "rgb(var(--makmex-surface) / <alpha-value>)",
          panel: "rgb(var(--makmex-panel) / <alpha-value>)",
          border: "rgb(var(--makmex-border) / <alpha-value>)",
          text: "rgb(var(--makmex-text) / <alpha-value>)",
          muted: "rgb(var(--makmex-muted) / <alpha-value>)",
        },
      },
      boxShadow: {
        card: "0 8px 20px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

