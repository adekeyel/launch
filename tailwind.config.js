/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B2420",
        paper: "#FAF4EC",
        card: "#FFFFFF",
        charcoal: "#2A2A28",
        marigold: {
          DEFAULT: "#E2A233",
          dark: "#B97F1F",
          soft: "#FBEBCB",
        },
        chili: {
          DEFAULT: "#C1442D",
          soft: "#F7DAD3",
        },
        basil: {
          DEFAULT: "#2F6B4F",
          soft: "#DCEAE1",
        },
        line: "#E7DFD0",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        ticket: "0 1px 0 0 rgba(27,36,32,0.06), 0 12px 30px -14px rgba(27,36,32,0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
