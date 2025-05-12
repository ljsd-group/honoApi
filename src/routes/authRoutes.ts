import { Hono } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import loginApp from "../endpoints/auth/login";

// 定义环境类型
type Env = {
  Bindings: any;
};

// 创建认证路由器
export const authRouter = new OpenAPIHono<Env>();

// 挂载登录端点
authRouter.route('/login', loginApp);

/**
 * 注册认证相关路由
 * @param app Hono应用实例
 */
export function registerAuthRoutes(app: any) {
  // 挂载认证路由
  app.route('/api/auth', authRouter);
} 