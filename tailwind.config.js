/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./scripts/**/*.js"
  ],
  safelist: [
    {
      pattern: /(btn|card|badge|modal|drawer|navbar|hero|alert|divider|menu|input|select)/,
    },
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui').default || require('daisyui')],
  daisyui: {
    themes: [
      {
        austinDark: {
          "primary": "#44499C",           // Austin Public Health Logo Blue
          "secondary": "#009F4D",         // Austin Public Health Logo Green
          "accent": "#009CDE",            // Cyan from extended palette
          "neutral": "#22254E",           // Dark blue from supporting palette
          "base-100": "#1b1f2a",          // Background
          "base-200": "#22254E",          // Card variant (dark-blue)
          "base-300": "#283042",          // Border
          "info": "#009CDE",              // Cyan from extended palette
          "success": "#008743",           // Compliant green from supporting palette
          "warning": "#FF8F00",           // Orange from extended palette
          "error": "#F83125",             // Red from extended palette
        },
      },
      {
        austinLight: {
          "primary": "#44499C",           // Austin Public Health Logo Blue
          "secondary": "#009F4D",         // Austin Public Health Logo Green
          "accent": "#009CDE",            // Cyan from extended palette
          "neutral": "#F7F6F5",           // Faded white from official palette
          "base-100": "#F7F6F5",          // Background (faded-white)
          "base-200": "#ffffff",          // Card
          "base-300": "#C6C5C4",          // Border (light-gray from extended)
          "info": "#009CDE",              // Cyan from extended palette
          "success": "#008743",           // Compliant green from supporting palette
          "warning": "#FF8F00",           // Orange from extended palette
          "error": "#F83125",             // Red from extended palette
        },
      },
    ],
  },
}
