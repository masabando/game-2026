import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({ base: '/game-2026/', plugins: [tailwindcss()] });
