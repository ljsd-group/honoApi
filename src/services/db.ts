import { createDbClient } from '../db/config';

/**
 * 创建数据库客户端
 * @param env Cloudflare Workers环境对象
 * @returns Drizzle ORM客户端实例
 */
export function getDbClient(env: any) {
  if (!env.DATABASE_URL) {
    throw new Error('数据库连接字符串未定义，请在环境变量中设置DATABASE_URL');
  }
  
  return createDbClient(env.DATABASE_URL);
} 