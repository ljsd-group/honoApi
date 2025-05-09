import { Context, Next } from "hono";

/**
 * 请求日志中间件
 * 记录所有请求的方法、路径、状态码和响应时间
 */
export async function logger(c: Context, next: Next) {
  const startTime = Date.now();
  
  // 记录请求信息
  console.log(`--> ${c.req.method} ${c.req.url}`);
  
  await next();
  
  // 计算响应时间
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  // 记录响应信息
  console.log(`<-- ${c.req.method} ${c.req.url} ${c.res.status} (${responseTime}ms)`);
} 