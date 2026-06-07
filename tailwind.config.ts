import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Moje finance barvna paleta
        brand: {
          50:  "#EBF4FF",
          100: "#B5D4F4",
          500: "#378ADD",
          600: "#185FA5",
          700: "#0C447C",
          900: "#042C53",
        },
        income: {
          50:  "#E1F5EE",
          500: "#1D9E75",
          700: "#0F6E56",
        },
        expense: {
          50:  "#FAECE7",
          500: "#D85A30",
          700: "#993C1D",
        },
        warn: {
          50:  "#FAEEDA",
          500: "#EF9F27",
          700: "#854F0B",
        },
        neutral: {
          50:  "#F1EFE8",
          100: "#D3D1C7",
          200: "#B4B2A9",
          300: "#9E9C95",
          400: "#888780",
          600: "#5F5E5A",
          700: "#524F4C",
          800: "#444441",
          900: "#2C2C2A",
          950: "#1C1C1A",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
