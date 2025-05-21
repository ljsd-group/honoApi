import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 先尝试加载生产环境配置文件
const result = dotenv.config({ path: '.env.production' });

if (result.error) {
  console.warn('无法加载 .env.production 文件，将尝试使用环境变量');
}

// 获取生产环境数据库连接
const getProdDatabaseUrl = (): string => {
  // 首先使用VITE_DATABASE_URL（项目中已配置的环境变量）
  if (process.env.VITE_DATABASE_URL) {
    console.log('✓ 使用 VITE_DATABASE_URL 环境变量');
    return process.env.VITE_DATABASE_URL;
  }
  
  // 其次使用PROD_DATABASE_URL
  if (process.env.PROD_DATABASE_URL) {
    console.log('✓ 使用 PROD_DATABASE_URL 环境变量');
    return process.env.PROD_DATABASE_URL;
  }
  
  // 最后尝试DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('✓ 使用 DATABASE_URL 环境变量');
    return process.env.DATABASE_URL;
  }

  throw new Error('未设置数据库URL。请设置VITE_DATABASE_URL环境变量');
};

export default {
  schema: './src/db/schema.ts',
  out: './migrations-prod', // 生产环境迁移文件单独放置
  dialect: 'postgresql',
  dbCredentials: {
    url: getProdDatabaseUrl(),
  },
  // 生产环境迁移需要谨慎，建议先检查SQL
  verbose: true,
  strict: true,
} satisfies Config; 