import { defineConfig } from 'vite';

// base: './' 让产物既可本地 file:// 打开，也可部署到任意子路径（本地演示/ Pages 通用）
export default defineConfig({
  base: './',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    target: 'es2018'
  }
});
