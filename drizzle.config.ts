import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: 'postgres://pguser:123456@localhost:5432/honostudy',
  },
  // 只处理这3个表
  tablesFilter: [
    "accounts",
    "users",
    "applications"
  ],
  // 是否严格模式，严格模式会在执行迁移前进行更严格的检查
  strict: true,
  // 是否打印详细日志
  verbose: true,
} satisfies Config; 