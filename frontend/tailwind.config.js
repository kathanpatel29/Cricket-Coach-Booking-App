/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0077b6",
          dark: "#005b8e",
          light: "#0096e3",
          50: "#e6f3f9",
          100: "#b3dbef",
          200: "#80c4e4",
          300: "#4dacda",
          400: "#1a94cf",
          500: "#0077b6",
          600: "#005b8e",
          700: "#004066",
          800: "#00253d",
          900: "#000b15"
        },
        secondary: {
          DEFAULT: "#f77f00",
          dark: "#c66600",
          light: "#ff9933"
        },
        surface: {
          DEFAULT: "#ffffff",
          secondary: "#f8f9fa"
        },
        text: {
          primary: "#2d3748",
          secondary: "#4a5568"
        },
        background: "#f8f9fa",
        foreground: "#212529",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif']
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'sm': '0px 1px 3px rgba(0, 0, 0, 0.05)',
        'md': '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.05)',
        'lg': '0px 4px 6px rgba(0, 0, 0, 0.05), 0px 10px 15px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [
    require('tailwindcss-animate')
  ],
  // Ensure Tailwind doesn't conflict with MUI
  important: '#root',
  corePlugins: {
    preflight: false,
  }
}

