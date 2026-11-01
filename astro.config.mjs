// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import pdfExport from './scripts/pdf/index.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://cv.example.com',
  integrations: [pdfExport()],
  i18n: {
    locales: ['es', 'en'],
    defaultLocale: 'es',
    routing: {
      prefixDefaultLocale: true,
    },
  },
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'STIX Two Text',
      cssVariable: '--font-primary',
      weights: [400, 700],
      styles: ['normal', 'italic'],
      subsets: ['latin', 'latin-ext'],
      fallbacks: ['serif'],
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
