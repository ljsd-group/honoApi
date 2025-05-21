import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../db/schema';

// 获取数据库连接字符串
const connectionString = 'postgresql://postgres:bXBcKw2wWybAXDtE@150.109.112.155:5432/manage_test';

// 创建postgres连接（不使用连接池）
const sql = postgres(connectionString, {
  max: 10, // 最大连接数
  idle_timeout: 20, // 空闲连接超时（秒）
  connect_timeout: 10, // 连接超时（秒）
  onnotice: () => {}, // 忽略通知
  debug: false // 在生产环境中禁用调试
});

// 创建数据库实例
export const db = drizzle(sql, { schema });

// 导出SQL实例，以便在需要时使用原始查询
export const pgSql = sql;

/**
 * 初始化数据库连接
 * 用于应用启动时测试数据库连接是否正常
 */
export async function initDatabase() {
  try {
    // 测试数据库连接
    await sql`SELECT 1`;
    console.log('数据库连接成功');
    
    // 可以在这里添加其他初始化逻辑
    return true;
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
} 