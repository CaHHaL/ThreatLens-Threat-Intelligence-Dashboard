/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            colors: {
                brand: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    900: '#0c4a6e',
                },
            },
            animation: {
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
                'rotate-slow': 'rotate-slow 12s linear infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'blink': 'blink 1s step-end infinite',
                'fade-in': 'fadeIn 0.4s ease forwards',
                'slide-right': 'slideInRight 0.4s ease forwards',
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glow-sky': '0 0 20px rgba(14, 165, 233, 0.2)',
                'glow-red': '0 0 20px rgba(248, 113, 113, 0.2)',
                'glow-green': '0 0 20px rgba(52, 211, 153, 0.2)',
            },
        },
    },
    plugins: [],
}
