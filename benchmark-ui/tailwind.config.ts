import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "./landing/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "ui-sans-serif", "system-ui"],
        serif: ["'Faculty Glyphic'", "ui-serif", "serif"],
        body: ["'Zalando Sans'", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
} satisfies Config;
