import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import 'dotenv/config';

// 检查环境变量是否存在
if (!process.env.DATABASE_URL) {
  console.error('错误: 环境变量 DATABASE_URL 未定义');
  console.error('请在 .env 文件中设置 DATABASE_URL=postgres://用户名:密码@主机:端口/数据库名');
  // 在开发环境中可以抛出错误，但在生产环境中可能希望使用默认值或继续
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('数据库连接字符串未配置');
  }
}

// 创建 PostgreSQL 连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // 可选配置
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲连接超时时间
  connectionTimeoutMillis: 2000, // 连接超时时间
});

// 监听连接错误
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
});

// 初始化 Drizzle ORM
export const db = drizzle({ client: pool });

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