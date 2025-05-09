import taskListApp from "../endpoints/taskList";
import taskCreateApp from "../endpoints/taskCreate";
import taskFetchApp from "../endpoints/taskFetch";
import taskDeleteApp from "../endpoints/taskDelete";
import { Hono } from "hono";
import { registerAuthRoutes } from "./authRoutes";

// 定义环境类型
type Env = {
  Bindings: any;
};

// 创建API路由器
export const apiRouter = new Hono<Env>();

// 注册任务相关API
const taskRouter = new Hono<Env>();
taskRouter.route('/', taskListApp);
taskRouter.route('/', taskCreateApp);
taskRouter.route('/:id', taskFetchApp);
taskRouter.route('/:id', taskDeleteApp);

// 挂载任务路由
apiRouter.route('/tasks', taskRouter);

/**
 * 注册所有API路由
 * @param app Hono应用实例
 */
export function registerApiRoutes(app: Hono<Env>) {
  // 注册认证路由
  registerAuthRoutes(app);
  
  // 挂载API路由
  app.route('/api', apiRouter);
  
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