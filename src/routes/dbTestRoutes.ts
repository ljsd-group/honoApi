import { Hono } from 'hono';
import { getDbClient } from '../services/db';
import { checkDatabaseConnection } from '../db/config';
import { Env } from '../types';
import { sql } from 'drizzle-orm';

// 创建数据库测试路由
const router = new Hono<{ Bindings: Env }>();

// 测试数据库连接
router.get('/connection', async (c) => {
  try {
    // 使用环境变量中的连接字符串
    const connectionString = c.env.DATABASE_URL;
    
    // 检查连接
    const isConnected = await checkDatabaseConnection(connectionString);
    
    return c.json({
      success: isConnected,
      message: isConnected ? '数据库连接成功' : '数据库连接失败',
      timestamp: new Date().toISOString(),
      database: {
        host: connectionString.split('@')[1]?.split(':')[0] || '未知',
        name: connectionString.split('/').pop() || '未知'
      }
    });
  } catch (error) {
    console.error('数据库连接测试失败:', error);
    return c.json({
      success: false,
      message: '数据库连接测试失败',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 运行简单查询
router.get('/query', async (c) => {
  try {
    // 获取数据库客户端
    const db = getDbClient(c.env);
    
    // 执行简单查询
    const result = await db.execute(sql`SELECT current_timestamp as time, current_database() as database`);
    
    return c.json({
      success: true,
      data: result[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('数据库查询测试失败:', error);
    return c.json({
      success: false,
      message: '数据库查询测试失败',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// 导出路由器
export function registerDbTestRoutes(app: Hono<{ Bindings: Env }>) {
  app.route('/api/db-test', router);
}

export default router; 