import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages에서는 `/리포지토리이름/`이 기본 경로이므로 이를 설정해야 합니다.
export default defineConfig({
  base: "/SmileWritingQuiz/", // GitHub Pages에서 올바른 경로를 찾도록 설정
  build: {
      outDir: "dist",
      assetsDir: "assets"
  }
});

