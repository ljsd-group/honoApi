import { TaskCreate } from "../endpoints/taskCreate";
import { TaskDelete } from "../endpoints/taskDelete";
import { TaskFetch } from "../endpoints/taskFetch";
import { TaskList } from "../endpoints/taskList";
import { registerAuthRoutes } from "./authRoutes";

/**
 * 注册所有API路由
 * @param openapi OpenAPI实例
 */
export function registerApiRoutes(openapi: any) {
  // 注册认证路由
  registerAuthRoutes(openapi);
  
  // 任务相关API
  openapi.get("/api/tasks", TaskList);
  openapi.post("/api/tasks", TaskCreate);
  openapi.get("/api/tasks/:taskSlug", TaskFetch);
  openapi.delete("/api/tasks/:taskSlug", TaskDelete);
  
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