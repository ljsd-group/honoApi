import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sign } from 'hono/jwt';
import { UserService } from '../../services/userService';
import { Env } from '../../types';
import { success, error, ResponseCode } from '../../utils/response';

// 定义登录验证模式
const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空'),
  password: z.string().min(1, '密码不能为空')
});

// 创建登录应用
const app = new Hono<{ Bindings: Env }>();

// 登录端点
app.post('/', zValidator('json', loginSchema), async (c) => {
  try {
    const { username, password } = c.req.valid('json');
    
    // 创建用户服务
    const userService = new UserService(c.env);
    
    // 验证用户
    const { valid, user } = await userService.validateUser(username, password);
    
    // 如果验证失败
    if (!valid || !user) {
      return error(c, "用户名或密码错误", ResponseCode.UNAUTHORIZED, 401);
    }
    
    // 生成JWT令牌
    const token = await sign({
      sub: String(user.id),
      username: user.username,
      role: user.role || 'user',
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24小时后过期
    }, c.env.JWT_SECRET || 'fallback-secret-key');
    
    // 返回成功响应
    return success(c, {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }, "登录成功", ResponseCode.SUCCESS);
  } catch (error) {
    console.error('登录失败:', error);
    return c.json({ 
      code: ResponseCode.INTERNAL_ERROR, 
      message: '登录处理失败' 
    }, 500);
  }
});

export default app; 