import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * 创建数据库客户端
 * @param connectionString 数据库连接字符串
 * @returns 数据库客户端
 */
export function createDbClient(connectionString: string) {
  console.log("初始化数据库连接...");

  // 针对Cloudflare Workers优化的连接配置
  const client = postgres(connectionString, {
    max: 1, // 单连接模式，避免在Workers环境中维护连接池
    idle_timeout: 5, // 进一步减少空闲超时（秒）
    connect_timeout: 3, // 进一步减少连接超时（秒）
    prepare: false, // 禁用prepared statements，减少连接复杂性
    types: {
      // 确保更简单的类型处理
      date: {
        to: 1184,
        from: [1082, 1083, 1114, 1184],
        serialize: (date: Date | unknown) => date instanceof Date ? date.toISOString() : date,
        parse: (str: string) => str // 简单返回字符串而不是创建Date对象
      }
    },
    transform: {
      undefined: null,
      ...{}, // 空转换规则，避免复杂处理
    },
    connection: {
      // 连接时的SQL语句，设置较短的语句超时
      statement_timeout: 3000, // 减少到3秒
      idle_in_transaction_session_timeout: 3000, // 减少到3秒
      // 添加其他连接设置
      options: `-c synchronous_commit=off` // 减少提交开销
    },
    debug: false, // 禁用调试以降低内存和CPU开销
    fetch_types: false, // 避免获取类型信息
  });

  // 初始化 Drizzle ORM
  return drizzle(client, { schema });
}

/**
 * 检查数据库连接
 * @param connectionString 数据库连接字符串
 * @returns 连接是否成功
 */
export async function checkDatabaseConnection(connectionString: string): Promise<boolean> {
  try {
    console.log("执行数据库连接测试...");
    
    // 设置更短的超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const client = postgres(connectionString, {
      max: 1,
      idle_timeout: 3,
      connect_timeout: 3,
      prepare: false,
    });
    
    try {
      const result = await client`SELECT 1 as connected`;
      clearTimeout(timeoutId);
      console.log("数据库连接测试结果:", result);
      return result[0]?.connected === 1;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    } finally {
      await client.end();
    }
  } catch (err) {
    console.error("数据库连接测试失败:", err instanceof Error ? err.message : String(err));
    return false;
  }
}

/**
 * 创建带有自定义选项的数据库客户端
 * @param connectionString 数据库连接字符串
 * @param options 自定义选项
 * @returns drizzle ORM 实例
 */
export function createDbClientWithOptions(connectionString: string, options: any) {
  // 创建postgres客户端，合并自定义选项
  const client = postgres(connectionString, {
    max: 1, // 在Workers中保持为1
    ssl: 'require',
    ...options
  });

  // 创建并返回drizzle ORM实例
  return drizzle(client, { schema });
} 