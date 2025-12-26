/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        "display": ["Inter", "sans-serif"],
      },
      colors: {
        "primary": "#2b6cee",
        "primary-hover": "#2563eb",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        "surface-dark": "#1e293b",
        "border-dark": "#334155",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2b6cee", // Updated to Mindora Admin blue
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
    },
  },
  plugins: [
    function ({ addVariant, addUtilities }) {
      // Add high contrast variant
      addVariant('high-contrast', '&.high-contrast');

      // High contrast utility classes
      const highContrastUtilities = {
        '.high-contrast': {
          '--background': '0 0% 100%',
          '--foreground': '0 0% 0%',
          '--muted': '0 0% 96%',
          '--muted-foreground': '0 0% 45%',
          '--border': '0 0% 20%',
          '--input': '0 0% 20%',
          '--ring': '0 0% 0%',
          '--radius': '0.5rem',
        },
        '.high-contrast .bg-background': {
          'background-color': 'hsl(var(--background))',
          'color': 'hsl(var(--foreground))',
          '--tw-bg-opacity': '1',
        },
        '.high-contrast .text-foreground': {
          'color': 'hsl(var(--foreground))',
        },
        '.high-contrast .border': {
          'border-color': 'hsl(var(--border))',
          'border-width': '2px',
        },
        '.high-contrast button, .high-contrast [role="button"]': {
          'border': '2px solid hsl(var(--foreground))',
          'padding': '0.5rem 1rem',
        },
        '.high-contrast input, .high-contrast select, .high-contrast textarea': {
          'border': '2px solid hsl(var(--foreground))',
          'padding': '0.5rem',
        },
        '.high-contrast .focus-visible': {
          'outline': '4px solid hsl(var(--ring))',
          'outline-offset': '2px',
        },
      };

      addUtilities(highContrastUtilities, ['responsive', 'hover']);
    },
  ],
}
