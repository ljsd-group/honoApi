import { Hono } from 'hono';
import { Env } from '../types';
import loginApp from '../endpoints/auth/login';

import auth0VerifyApp from '../endpoints/auth/auth0Verify';

// 创建认证路由器
const router = new Hono<{ Bindings: Env }>();

// 挂载登录端点
router.route('/login', loginApp);

// 挂载Auth0相关端点
router.route('/verify', auth0VerifyApp);

/**
 * 注册认证路由
 * @param app Hono应用实例
 */
export function registerAuthRoutes(app: Hono<{ Bindings: Env }>) {
  app.route('/api/auth', router);
}

export default router; 