import { jwt } from 'hono/jwt';

// Cloudflare Workers环境类型定义
export interface Env {
  // 数据库连接
  DATABASE_URL: string;
  
  // 认证相关
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID?: string;
  AUTH0_CLIENT_SECRET?: string;
  JWT_SECRET?: string;
  
  // 环境
  ENVIRONMENT?: string;
}

// 用户类型定义
export interface User {
  auth0_sub: string;
  [key: string]: any;
}

// 扩展Hono类型
declare module 'hono' {
  interface ContextVariableMap {
    user: User;
    jwtPayload: any;
  }
} 