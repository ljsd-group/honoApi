import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

// 获取数据库连接字符串
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('数据库连接字符串未配置');
}

// 创建数据库连接池
const pool = new Pool({
  connectionString,
});

// 创建数据库实例
export const db = drizzle(pool, { schema });

// 导出连接池，以便在需要时使用原始查询
export const pgPool = pool;

/**
 * 初始化数据库连接
 * 用于应用启动时测试数据库连接是否正常
 */
export async function initDatabase() {
  try {
    // 测试数据库连接
    const client = await pool.connect();
    console.log('数据库连接成功');
    client.release();
    
    // 可以在这里添加其他初始化逻辑
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
} 