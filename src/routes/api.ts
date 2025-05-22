import { Hono } from 'hono';
import { registerAuthRoutes } from './authRoutes';
import { registerProxyRoutes } from './proxyRoutes';
import { registerDbTestRoutes } from './dbTestRoutes';
import { Env } from '../types';

/**
 * 注册所有API路由
 * @param app Hono应用实例
 */
export function registerApiRoutes(app: Hono<{ Bindings: Env }>) {
  // 注册认证路由
  registerAuthRoutes(app);
  
  // 注册代理路由
  registerProxyRoutes(app);
  
  // 注册数据库测试路由
  registerDbTestRoutes(app);
} 