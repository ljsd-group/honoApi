
import { Hono } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerAuthRoutes } from "./authRoutes";

// 定义环境类型
type Env = {
  Bindings: any;
};

// 创建API路由器
export const apiRouter = new OpenAPIHono<Env>();

// 注册任务相关API
const taskRouter = new OpenAPIHono<Env>();


/**
 * 注册所有API路由
 * @param app Hono应用实例
 */
export function registerApiRoutes(app: Hono<Env> | OpenAPIHono<Env>) {
  // 注册认证路由
  registerAuthRoutes(app);

  // 挂载API路由
  
  // 可以添加更多API分组
  // registerUserRoutes(openapi);
  // registerProductRoutes(openapi);
}

// 可以拆分成更多模块，例如：
// function registerUserRoutes(openapi: any) {
//   openapi.get("/api/users", UserList);
//   openapi.post("/api/users", UserCreate);
//   ...
// } 