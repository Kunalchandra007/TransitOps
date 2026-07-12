/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'bg-deep': 'var(--bg-deep)',
        'bg-panel': 'var(--bg-panel)',
        'bg-panel-alt': 'var(--bg-panel-alt)',
        'ink-hi': 'var(--ink-hi)',
        'ink-mid': 'var(--ink-mid)',
        'ink-low': 'var(--ink-low)',
        'accent': 'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        'status-good': 'var(--status-good)',
        'status-warn': 'var(--status-warn)',
        'status-bad': 'var(--status-bad)',
        'hairline': 'var(--hairline)',
      },
      fontFamily: {
        'display': ['"Space Grotesk"', 'sans-serif'],
        'body': ['"Inter"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      }
    }
  },
  plugins: []
};
