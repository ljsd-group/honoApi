import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * 全局错误处理中间件
 * 处理应用中的各种异常并返回格式化的错误响应
 */
export async function errorHandler(err: Error, c: Context) {
  // 如果是Hono抛出的HTTP异常
  if (err instanceof HTTPException) {
    const status = err.status || 500;
    const message = err.message || '服务器内部错误';
    
    return c.json({
      success: false,
      code: status,
      message,
      data: null
    }, status);
  }
  
  // 处理其他类型的错误
  console.error('未处理的错误:', err);
  
  return c.json({
    success: false,
    code: 500,
    message: '服务器内部错误',
    data: null
  }, 500);
} 