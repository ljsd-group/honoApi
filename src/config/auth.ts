import { ENV } from './env';

/**
 * JWT配置
 */
export const JWT_CONFIG = {
  // JWT密钥（从环境变量中获取）
  SECRET: ENV.JWT.SECRET,
  
  // 过期时间
  EXPIRES_IN: ENV.JWT.EXPIRES_IN,
  
  // JWT算法
  ALGORITHM: ENV.JWT.ALGORITHM
};

/**
 * Auth0 配置
 */
export const AUTH0_CONFIG = {
  // Auth0 域名
  DOMAIN: ENV.AUTH0.DOMAIN,
  
  // 客户端ID
  CLIENT_ID: ENV.AUTH0.CLIENT_ID,
  
  // 客户端密钥
  CLIENT_SECRET: ENV.AUTH0.CLIENT_SECRET,
  
  // 回调URL
  REDIRECT_URI: ENV.AUTH0.REDIRECT_URI
};

/**
 * 路由白名单配置
 * 白名单中的路由不需要JWT鉴权
 */
export const AUTH_WHITELIST = [
  // 登录相关API不需要鉴权
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/callback',  // Auth0 回调端点
  '/api/auth/auth0',     // Auth0 登录端点
  '/api/auth/verify',    // Auth0 令牌验证端点
  '/api/auth/apple-app-site-association',
  
  // 文档和健康检查API不需要鉴权
  '/',
  '/openapi.json',
  '/api/health',
  '/api/doc',
  
  // 静态资源不需要鉴权
  /^\/assets\//,
  /^\/public\//,
  
  // 可以使用正则表达式匹配路径
  /^\/api\/public\/.*/
  
  // 注意：/api/proxy/find-subscribe 不在白名单中，需要JWT认证
]; 