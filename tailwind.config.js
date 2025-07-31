/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Satoshi', 'system-ui', 'sans-serif'],
        'serif': ['Lora', 'Georgia', 'serif'],
      },
      letterSpacing: {
        'wide': '0.5px',
        'wider': '1px',
      }
    },
  },
  plugins: [],
};
