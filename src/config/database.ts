import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DATABASE_CONFIG } from './auth';
// PostgreSQL连接配置
const poolOptions = {
  host: DATABASE_CONFIG.HOST,
  port: DATABASE_CONFIG.PORT,
  user: DATABASE_CONFIG.USER,
  password: DATABASE_CONFIG.PASSWORD,
  database: DATABASE_CONFIG.NAME, // 默认数据库名，如需修改请调整
  max: DATABASE_CONFIG.MAX_CONNECTIONS, // 最大连接数
  idleTimeoutMillis: DATABASE_CONFIG.IDLE_TIMEOUT // 空闲连接超时时间
};

// 创建连接池
const pool = new Pool(poolOptions);

// 创建Drizzle ORM实例
export const db = drizzle(pool);

// 导出连接池，以便在需要时使用原始查询
export const pgPool = pool; 