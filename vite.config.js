import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/SmileWritingQuiz/', // GitHub Pages의 레포지토리 이름
});
