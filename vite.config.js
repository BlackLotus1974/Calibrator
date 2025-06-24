// frontend/vite.config.js

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Export the Vite configuration
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxying API requests to the backend server
      '/api': {
        target: 'http://localhost:5000', // Backend server URL
        changeOrigin: true,               // Changes the origin of the host header to the target URL
        secure: false,                    // Set to true if your backend uses HTTPS
        // Removed the rewrite rule to preserve '/api' prefix
        // rewrite: (path) => path.replace(/^\/api/, ''), // Removed
      },
    },
    // Optional: Define the port for the frontend server
    port: 5173, // Default Vite port; change if necessary
  },
  // Optional: Define build configurations
  build: {
    outDir: 'dist', // Output directory after build
  },
});
