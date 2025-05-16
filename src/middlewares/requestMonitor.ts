import { Context, MiddlewareHandler, Next } from "hono";
import { ENV } from "../config/env";

/**
 * 通用请求监控中间件
 * 
 * 功能：
 * 1. 监控所有请求的详细信息
 * 2. 记录请求头、请求体等信息
 * 3. 通过环境变量控制是否启用
 * 
 * 使用方法：
 * 1. 在 .env 文件中设置 REQUEST_MONITOR_ENABLED=true 启用监控
 * 2. 可选配置 REQUEST_MONITOR_LOG_BODY、REQUEST_MONITOR_PARSE_JSON 等参数
 */
export const requestMonitor: MiddlewareHandler = async (c: Context, next: Next) => {
  // 如果监控未启用，直接跳过
  if (!ENV.REQUEST_MONITOR.ENABLED) {
    return next();
  }

  // 检查路径是否匹配监控模式
  const currentPath = c.req.path;
  const shouldMonitor = ENV.REQUEST_MONITOR.PATH_PATTERNS.some(pattern => {
    if (pattern === '*') return true;
    if (pattern.endsWith('/*')) {
      const basePath = pattern.slice(0, -2);
      return currentPath.startsWith(basePath);
    }
    return currentPath === pattern;
  });

  if (!shouldMonitor) {
    return next();
  }

  // 开始输出请求信息
  console.log(`\n======= 请求监控 [${new Date().toLocaleString()}] =======`);
  console.log('请求方法:', c.req.method);
  console.log('请求路径:', c.req.path);
  console.log('内容类型:', c.req.header('Content-Type'));
  
  // 记录所有请求头
  console.log('--- 请求头 ---');
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
    // 过滤掉敏感信息，如授权令牌，只显示部分
    if (key.toLowerCase() === 'authorization' && value.length > 10) {
      console.log(`${key}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`${key}: ${value}`);
    }
  });

  // 记录请求体
  if (ENV.REQUEST_MONITOR.LOG_BODY) {
    try {
      // 克隆请求以不影响原始请求
      const clonedReq = c.req.raw.clone();
      const rawBody = await clonedReq.text();
      
      console.log('--- 请求体 ---');
      if (rawBody) {
        console.log('原始请求体:', rawBody.length > 1000 ? `${rawBody.substring(0, 1000)}... (截断，共${rawBody.length}字符)` : rawBody);
        
        // 尝试解析JSON
        if (ENV.REQUEST_MONITOR.PARSE_JSON) {
          try {
            const jsonBody = JSON.parse(rawBody);
            console.log('解析后的JSON:', jsonBody);
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            console.log('请求体不是有效的JSON:', error.message);
          }
        }
      } else {
        console.log('请求体为空');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.log('无法读取请求体:', error.message);
    }
  }
  
  console.log('======= 请求监控结束 =======\n');
  
  // 继续执行下一个中间件
  return next();
}; 