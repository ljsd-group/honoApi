import { Hono } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import findSubscribeProxyApp from "../endpoints/proxy/findSubscribeProxy";

// 定义环境类型
type Env = {
  Bindings: any;
};

// 创建代理路由器
export const proxyRouter = new OpenAPIHono<Env>();

// 挂载图片订阅代理端点
proxyRouter.route('/find-subscribe', findSubscribeProxyApp);

/**
 * 注册代理相关路由
 * @param app Hono应用实例
 */
export function registerProxyRoutes(app: any) {
  // 挂载代理路由
  app.route('/api/proxy', proxyRouter);
} 