import { Hono } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerAuthRoutes } from "./authRoutes";
import { registerProxyRoutes } from "./proxyRoutes";

// 定义环境类型
type Env = {
  Bindings: any;
};

// 创建API路由器
export const apiRouter = new OpenAPIHono<Env>();

/**
 * 注册所有API路由
 * @param app Hono应用实例
 */
export function registerApiRoutes(app: Hono<Env> | OpenAPIHono<Env>) {
  // 注册认证路由
  registerAuthRoutes(app);
  
  // 注册代理路由
  registerProxyRoutes(app);
  // 挂载API路由
  // registerUserRoutes(openapi);
}
