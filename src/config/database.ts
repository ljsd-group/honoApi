import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

// PostgreSQL连接配置
const poolOptions = {
  host: 'localhost',
  port: 5432,
  user: 'pguser',
  password: '123456',
  database: 'honostudy', // 默认数据库名，如需修改请调整
  max: 10, // 最大连接数
  idleTimeoutMillis: 30000 // 空闲连接超时时间
};

// 创建连接池
const pool = new Pool(poolOptions);

// 创建Drizzle ORM实例
export const db = drizzle(pool);

// 导出连接池，以便在需要时使用原始查询
export const pgPool = pool; 