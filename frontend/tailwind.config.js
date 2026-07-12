/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-base": "#0B0E14",
        "bg-panel": "#131824",
        "bg-panel-raised": "#1A2130",
        "accent-signal": "#F5A623",
        "accent-live": "#2DD4BF",
        "text-primary": "#E7EAF0",
        "text-muted": "#9AA3B8",
        "border-hairline": "#232B3B"
      },
      fontFamily: {
        display: ['"Outfit"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        hero: ['"Archivo Black"', 'sans-serif'],
        land: ['"Space Grotesk"', 'sans-serif'],
        tag: ['"JetBrains Mono"', 'monospace'],
      }
    }
  },
  plugins: []
};
