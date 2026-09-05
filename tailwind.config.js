/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        matte: {
          bg: '#09090b',
          surface: '#111113',
          card: '#151518',
          subtle: '#1d1d21',
          border: '#27272a',
          hover: '#3f3f46',
        },
      },
    },
  },
  plugins: [],
};
