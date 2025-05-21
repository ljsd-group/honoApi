import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DATABASE_CONFIG } from './auth';
import * as schema from '../db/schema';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 构建连接字符串，支持多种配置方式
export const getDatabaseUrl = (): string => {
  // 尝试获取浏览器环境中的 VITE_DATABASE_URL
  try {
    // @ts-ignore - 忽略类型检查以支持 Vite 环境
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DATABASE_URL) {
      // @ts-ignore
      return import.meta.env.VITE_DATABASE_URL;
    }
  } catch (e) {
    // 忽略错误，继续尝试其他方式
  }
  
  // 检查 Node 环境中的 DATABASE_URL
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // 检查 Node 环境中的 VITE_DATABASE_URL
  if (process.env.VITE_DATABASE_URL) {
    return process.env.VITE_DATABASE_URL;
  }
  
  // 否则使用单独的配置参数构建连接字符串
  return `postgres://${DATABASE_CONFIG.USER}:${encodeURIComponent(DATABASE_CONFIG.PASSWORD)}@${DATABASE_CONFIG.HOST}:${DATABASE_CONFIG.PORT}/${DATABASE_CONFIG.NAME}`;
};

// PostgreSQL连接配置
const poolOptions = {
  connectionString: getDatabaseUrl(),
  max: DATABASE_CONFIG.MAX_CONNECTIONS || 10, // 最大连接数
  idleTimeoutMillis: DATABASE_CONFIG.IDLE_TIMEOUT || 30000 // 空闲连接超时时间
};

// 创建连接池
const pool = new Pool(poolOptions);

// 连接错误处理
pool.on('error', (err) => {
  console.error('数据库连接池错误:', err);
  // 在生产环境中可能需要额外的错误处理逻辑
});

// 创建Drizzle ORM实例，并传入模式
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