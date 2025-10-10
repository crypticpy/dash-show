/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./scripts/**/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Austin Public Health brand colors
        primary: {
          DEFAULT: '#44499C',  // Logo Blue
          content: '#ffffff',
        },
        secondary: {
          DEFAULT: '#009F4D',  // Logo Green
          content: '#ffffff',
        },
        accent: {
          DEFAULT: '#009CDE',  // Cyan
          content: '#ffffff',
        },
        neutral: {
          light: '#F7F6F5',   // Faded white
          dark: '#22254E',    // Dark blue
        },
        base: {
          100: '#F7F6F5',     // Light background
          200: '#ffffff',     // Light cards
          300: '#C6C5C4',     // Light borders
        },
        info: '#009CDE',
        success: '#008743',
        warning: '#FF8F00',
        error: '#F83125',
      },
    },
  },
  plugins: [],
  darkMode: ['class', '[data-theme="austinDark"]'],
}
