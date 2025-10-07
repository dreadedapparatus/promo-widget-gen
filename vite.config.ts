import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The name of your repository.
// This is used to set the base path for the deployed application.
const GITHUB_PAGES_BASE_PATH = '/promo-widget-gen/';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // This is essential for GitHub Pages deployment
  base: GITHUB_PAGES_BASE_PATH,
})