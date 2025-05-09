import { LoginHandler } from "../endpoints/auth/login";

/**
 * 注册认证相关路由
 * @param openapi OpenAPI实例
 */
export function registerAuthRoutes(openapi: any) {
  // 登录接口
  openapi.post("/api/auth/login", LoginHandler);
  
  // 这里可以添加更多认证相关接口
  // openapi.post("/api/auth/register", RegisterHandler);
  // openapi.post("/api/auth/refresh-token", RefreshTokenHandler);
  // openapi.post("/api/auth/logout", LogoutHandler);
} 