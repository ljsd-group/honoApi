import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// 获取数据库连接字符串
const connectionString = "postgresql://postgres:bXBcKw2wWybAXDtE@150.109.112.155:5432/manage_test";

// 创建 PostgreSQL 连接池
const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 监听连接错误
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
});

// 初始化 Drizzle ORM
export const db = drizzle(pool, { schema });

// 导出 schema
export * from './schema';

/**
 * 使用示例:
 * 
 * 在其他文件中导入 db 对象：
 * 
 * ```
 * import { db, users } from './db';
 * 
 * // 查询用户
 * const allUsers = await db.select().from(users);
 * 
 * // 插入新用户
 * const newUser = await db.insert(users).values({
 *   username: 'test',
 *   password: 'password',
 *   email: 'test@example.com'
 * }).returning();
 * ```
 */ 