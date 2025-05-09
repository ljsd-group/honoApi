/**
 * JWT配置
 */
export const JWT_CONFIG = {
  // JWT密钥（实际生产环境应该使用环境变量）
  SECRET: 'your-secret-key-change-in-production',
  
  // 过期时间（24小时）
  EXPIRES_IN: '24h',
  
  // JWT算法
  ALGORITHM: 'HS256'
};

/**
 * 路由白名单配置
 * 白名单中的路由不需要JWT鉴权
 */
export const AUTH_WHITELIST = [
  // 登录相关API不需要鉴权
  '/api/auth/login',
  '/api/auth/register',
  
  // 文档和健康检查API不需要鉴权
  '/',
  '/openapi.json',
  '/api/health',
  
  // 静态资源不需要鉴权
  /^\/assets\//,
  /^\/public\//,
  
  // 可以使用正则表达式匹配路径
  /^\/api\/public\/.*/
]; 