import { z } from "zod";
import { Str } from "chanfana";

/**
 * 用户对象模型
 */
export const User = z.object({
  id: z.string(),
  username: Str({ 
    description: "用户名", 
    example: "admin" 
  }),
  password: Str({ 
    description: "密码(哈希后)", 
    example: "$2a$10$..." 
  }),
  name: Str({ 
    description: "姓名", 
    example: "管理员" 
  }),
  role: z.enum(["admin", "user"]).default("user"),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/**
 * 登录请求模型
 */
export const LoginRequest = z.object({
  username: Str({ 
    description: "用户名", 
    example: "admin" 
  }),
  password: Str({ 
    description: "密码", 
    example: "password123" 
  }),
});

/**
 * 登录响应模型
 */
export const LoginResponse = z.object({
  token: z.string(),
  user: User.omit({ password: true }),
});

/**
 * JWT有效载荷类型
 */
export interface JwtPayload {
  sub: string;  // 用户ID
  username: string;
  role: string;
  exp?: number;  // 过期时间
  iat?: number;  // 签发时间
}

/**
 * 用户类型（排除密码）
 */
export type SafeUser = Omit<z.infer<typeof User>, 'password'>;

/**
 * 完整用户类型
 */
export type UserWithPassword = z.infer<typeof User>; 