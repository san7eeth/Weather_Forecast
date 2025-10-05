import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@emotion/is-prop-valid': '@emotion/is-prop-valid/dist/is-prop-valid.esm.js'
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@emotion/is-prop-valid']
  },
  base: '/Weather_Forecast/'
});
