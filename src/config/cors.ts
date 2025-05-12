/**
 * CORS配置
 */
import { ENV } from './env';

/**
 * CORS 配置对象
 * 使用环境变量中的值，如果环境变量不存在则使用默认值
 */
export const CORS_CONFIG = {
  // 允许的来源
  origin: ENV.CORS.ORIGINS,
  
  // 允许的HTTP方法
  allowMethods: ENV.CORS.METHODS,
  
  // 允许的请求头
  allowHeaders: ENV.CORS.HEADERS,
  
  // 暴露的响应头
  exposeHeaders: ENV.CORS.EXPOSE_HEADERS,
  
  // 预检请求结果的缓存时间（秒）
  maxAge: ENV.CORS.MAX_AGE,
  
  // 是否允许携带凭证（cookies等）
  credentials: ENV.CORS.CREDENTIALS,
}; 