import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // Vibrant Tech Colors
                neon: {
                    blue: '#00D9FF',
                    purple: '#B066FF',
                    pink: '#FF6BD9',
                    green: '#00FF94',
                    orange: '#FF6B35',
                    yellow: '#FFD93D',
                },
                cyber: {
                    dark: '#0A0E27',
                    darker: '#060818',
                    gray: '#1A1F3A',
                    light: '#2D3250',
                },
                electric: {
                    50: '#E6F0FF',
                    100: '#CCE0FF',
                    200: '#99C2FF',
                    300: '#66A3FF',
                    400: '#3385FF',
                    500: '#0066FF',
                    600: '#0052CC',
                    700: '#003D99',
                    800: '#002966',
                    900: '#001433',
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'cyber-grid': "linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)",
                'neon-glow': 'radial-gradient(circle at center, rgba(0, 217, 255, 0.3), transparent 70%)',
            },
            boxShadow: {
                'neon-blue': '0 0 20px rgba(0, 217, 255, 0.5), 0 0 40px rgba(0, 217, 255, 0.3)',
                'neon-purple': '0 0 20px rgba(176, 102, 255, 0.5), 0 0 40px rgba(176, 102, 255, 0.3)',
                'neon-pink': '0 0 20px rgba(255, 107, 217, 0.5), 0 0 40px rgba(255, 107, 217, 0.3)',
                'neon-green': '0 0 20px rgba(0, 255, 148, 0.5), 0 0 40px rgba(0, 255, 148, 0.3)',
                'cyber': '0 4px 30px rgba(0, 217, 255, 0.2)',
                'cyber-lg': '0 10px 60px rgba(0, 217, 255, 0.3)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite',
                'slide-up': 'slideUp 0.5s ease-out',
                'float': 'float 6s ease-in-out infinite',
                'grid-flow': 'gridFlow 20s linear infinite',
                'text-shimmer': 'textShimmer 3s ease-in-out infinite',
            },
            keyframes: {
                glow: {
                    '0%, 100%': {
                        boxShadow: '0 0 20px rgba(0, 217, 255, 0.5), 0 0 40px rgba(0, 217, 255, 0.3)',
                    },
                    '50%': {
                        boxShadow: '0 0 30px rgba(0, 217, 255, 0.8), 0 0 60px rgba(0, 217, 255, 0.5)',
                    },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                gridFlow: {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '50px 50px' },
                },
                textShimmer: {
                    '0%, 100%': {
                        backgroundPosition: '0% 50%',
                    },
                    '50%': {
                        backgroundPosition: '100% 50%',
                    },
                },
            },
            backdropBlur: {
                xs: '2px',
            },
            fontSize: {
                '2xs': '0.625rem',
            },
        },
    },
    plugins: [],
};
export default config;