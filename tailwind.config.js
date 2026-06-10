/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        bg: {
          primary: "#0A1628",
          secondary: "#0F1F3A",
          tertiary: "#152A4A",
          glass: "rgba(10, 22, 40, 0.75)",
        },
        accent: {
          cyan: "#00E5FF",
          green: "#00C48C",
          orange: "#FF8C00",
          red: "#FF3D57",
          yellow: "#FFD93D",
          purple: "#7B61FF",
        },
      },
      fontFamily: {
        tech: ['Orbitron', 'system-ui', 'sans-serif'],
        body: ['"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 229, 255, 0.4), 0 0 40px rgba(0, 229, 255, 0.1)',
        'glow-green': '0 0 20px rgba(0, 196, 140, 0.4), 0 0 40px rgba(0, 196, 140, 0.1)',
        'glow-orange': '0 0 20px rgba(255, 140, 0, 0.5), 0 0 40px rgba(255, 140, 0, 0.2)',
        'glow-red': '0 0 20px rgba(255, 61, 87, 0.5), 0 0 40px rgba(255, 61, 87, 0.2)',
        'panel': '0 4px 30px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 2s linear infinite',
        'blink-orange': 'blinkOrange 1s ease-in-out infinite',
        'blink-red': 'blinkRed 0.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-flow': 'glowFlow 3s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        blinkOrange: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 140, 0, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(255, 140, 0, 0.9), 0 0 50px rgba(255, 140, 0, 0.5)' },
        },
        blinkRed: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 61, 87, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(255, 61, 87, 0.9), 0 0 50px rgba(255, 61, 87, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glowFlow: {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
