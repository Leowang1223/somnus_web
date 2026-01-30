import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--color-bg)",
                foreground: "var(--color-text)",
                amber: {
                    DEFAULT: "#d8aa5b",
                    glow: "rgba(216, 170, 91, 0.4)",
                }
            },
            fontFamily: {
                display: ['var(--font-display)'],
                body: ['var(--font-body)'],
            },
            animation: {
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                }
            }
        },
    },
    plugins: [],
};
export default config;
