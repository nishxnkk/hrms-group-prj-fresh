tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Critical: allows the 'dark' class on <html> to work
    theme: {
        extend: {
            colors: {
                brand: {
                    text: '#ddeeff',      // Main text (Lightest Frost)
                    primary: '#aaccff',   // Accent color
                    secondary: '#aaccff', // Secondary text
                    hover: '#88aaff',     // Hover effects
                    sidebar: '#2c50ab',   // Sidebar/Nav background
                },
                darkbg: {
                    page: '#020617',      // Deep dark background
                    card: '#0b1120',      // Card/Table background
                    border: '#1f2937',    // Subtle borders
                },
            },
        },
    },
    plugins: [],
}