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
        display: ["Bricolage Grotesque Variable", "Trebuchet MS", "sans-serif"],
        sans: ["Figtree Variable", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "1.25rem" },
    },
  },
  plugins: [],
};
