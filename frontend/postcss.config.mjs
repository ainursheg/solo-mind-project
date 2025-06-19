// frontend/postcss.config.mjs
const config = {
  plugins: {
    '@tailwindcss/postcss': {
      // Указываем Tailwind v4, где искать используемые классы
      content: [
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      ],
    },
  },
};
export default config;