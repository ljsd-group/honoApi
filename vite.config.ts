import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import devServer from '@hono/vite-dev-server';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(process.cwd(), './src')
    }
  },
  server: {
    port: 8080,
    host: true, // 允许通过IP地址访问
  },
  plugins: [
    // Hono开发服务器插件
    devServer({
      entry: './src/vite.ts'
    }),
    // Node环境下的一些polyfills，用于解决一些兼容性问题
    nodePolyfills()
  ],
  build: {
    // 使用最新的ES标准，Cloudflare Workers支持最新的JS特性
    target: 'esnext',
    minify: true
  }
}); 