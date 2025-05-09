import { createPool } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

// MySQL连接配置
const poolOptions = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'honostudy', // 默认数据库名，如需修改请调整
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
const pool = createPool(poolOptions);

// 创建Drizzle ORM实例
export const db = drizzle(pool);

// 导出连接池，以便在需要时使用原始查询
export const mysqlPool = pool; 