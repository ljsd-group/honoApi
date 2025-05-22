import { Hono } from 'hono';
import { Env } from '../types';
import findSubscribeProxyApp from '../endpoints/proxy/findSubscribeProxy';
import logoffProxyApp from '../endpoints/proxy/logoffProxy';
import comProxyApiApp from '../endpoints/proxy/comProxyApi';

// 创建代理路由器
const router = new Hono<{ Bindings: Env }>();

// 挂载查找订阅代理端点
router.route('/find-subscribe', findSubscribeProxyApp);

// 挂载退出登录代理端点
router.route('/logoff', logoffProxyApp);

// 挂载通用代理端点
router.route('/common', comProxyApiApp);

/**
 * 注册代理路由
 * @param app Hono应用实例
 */
export function registerProxyRoutes(app: Hono<{ Bindings: Env }>) {
  app.route('/api/proxy', router);
}

export default router; 