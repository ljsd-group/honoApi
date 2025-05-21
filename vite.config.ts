import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import devServer from '@hono/vite-dev-server';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // 确保有默认的数据库连接字符串
  const databaseUrl = env.DATABASE_URL || env.VITE_DATABASE_URL;
  
  return {
    resolve: {
      alias: {
        '@': resolve(process.cwd(), './src')
      }
    },
    server: {
      port: 8080,
      host: '0.0.0.0',
    },
    plugins: [
      // Hono开发服务器插件
      devServer({
        entry: './src/vite.ts'
      }),
      // Node环境下的一些polyfills，用于解决一些兼容性问题
      nodePolyfills({
        include: ['buffer', 'crypto', 'util', 'stream', 'path', 'os'],
      })
    ],
    define: {
      // 安全地定义环境变量
      'process.env.DATABASE_URL': JSON.stringify(databaseUrl),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    build: {
      // 使用最新的ES标准，Cloudflare Workers支持最新的JS特性
      target: 'esnext',
      minify: true,
      // 指定构建入口点
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'honoapi',
        formats: ['es'],
        fileName: 'index'
      },
      // 确保不会打包node_modules中的依赖
      rollupOptions: {
        external: [
          'cloudflare:sockets',
          'pg-native',
          'pg',
          'dotenv',
          'dotenv/config',
          'drizzle-orm',
          'drizzle-kit',
          '@neondatabase/serverless',
          'postgres'
        ]
      }
    }
  }
}); 