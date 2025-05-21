import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { getDatabaseUrl } from './src/config/database';

// 加载环境变量
dotenv.config();

export default {
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  "tablesFilter": [
        "accounts",
        "users",
        "devices",
        "device_accounts",
        "applications"
  ],
  // 可选: 指定迁移后是否要验证模式
  verbose: true,
  // 可选: 是否在控制台输出 SQL 语句
  strict: true,
} satisfies Config; 