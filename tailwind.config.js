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
      colors: {
        // Your existing colors
      },
    },
  },
  plugins: [
    function({ addVariant, addUtilities }) {
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
