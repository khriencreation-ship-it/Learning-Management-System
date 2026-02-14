import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "#934ab3",
      },
      fontFamily: {
        sans: ["var(--font-bricolage)", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
} satisfies Config;
