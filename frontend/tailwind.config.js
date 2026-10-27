const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        ink: token("ink"),
        muted: token("muted"),
        line: token("line"),
        control: token("control"),
        brand: token("brand"),
        "on-brand": token("on-brand"),
        sun: token("sun"),
        mint: token("mint"),
        danger: token("danger"),
      },
      fontFamily: {
        display: ["Fraunces Variable", "Georgia", "serif"],
        sans: ["Figtree Variable", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "1.5rem", sheet: "1.75rem" },
      boxShadow: {
        card: "0 1px 2px rgb(var(--ink) / 0.05), 0 12px 28px -16px rgb(var(--ink) / 0.18)",
        pop: "0 20px 50px -20px rgb(var(--ink) / 0.35)",
      },
      screens: { xs: "420px" },
    },
  },
  plugins: [],
};
