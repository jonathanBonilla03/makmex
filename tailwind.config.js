/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        makmex: {
          orange: "#FF6A00",
          ember: "#FF8A2A",
          bg: "#0B0B0D",
          surface: "#141418",
          panel: "#1A1B20",
          border: "#2A2C35",
          text: "#F4F4F6",
          muted: "#B7BAC6",
        },
      },
      boxShadow: {
        card: "0 8px 20px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};

