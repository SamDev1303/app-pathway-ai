/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        navy: "#1a2f6e",
        gold: "#c8941a",
        ivory: "#f6f7fb",
        cream: "#faf8f3",
        charcoal: "#1a1a1a"
      }
    }
  },
  plugins: []
};
