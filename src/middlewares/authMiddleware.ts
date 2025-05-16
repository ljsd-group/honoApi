import { Context, Next } from "hono";
import { jwt, verify } from "hono/jwt";
import { findUserById } from "../services/userService";
import { AUTH_WHITELIST } from "../config/auth";
import { ResponseCode, error } from "../utils/response";
import { JWT_CONFIG } from "../config/auth";
import { AccountService } from "../services/accountService";

/**
 * 声明增强的Context类型，包含用户信息
 */
declare module 'hono' {
  interface ContextVariables {
    user?: {
      id: number;
      username?: string;
      role?: string;
      email?: string;
      auth0_sub?: string;
      device_number?: string;
      isAuth0User?: boolean;
    };
    jwtPayload?: any;
  }
}

// 创建AccountService实例
const accountService = new AccountService();

/**
 * 判断路径是否在白名单中
 * @param path 请求路径
 * @returns 是否在白名单中
 */
function isPathInWhitelist(path: string): boolean {
  return AUTH_WHITELIST.some(item => {
    // 如果是正则表达式
    if (item instanceof RegExp) {
      return item.test(path);
    }
    // 如果是字符串，直接比较
    return item === path;
  });
}

/**
 * 从Auth头中提取JWT令牌
 * @param c Hono上下文
 * @returns 令牌字符串或undefined
 */
function extractJwtFromAuthHeader(c: Context): string | undefined {
  const authHeader = c.req.header('Auth');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return authHeader.substring(7); // 移除'Bearer '前缀
}

/**
 * 创建JWT中间件，验证Auth头部的Bearer令牌
 */
export const jwtMiddleware = jwt({
  secret: JWT_CONFIG.SECRET,
  // Hono的jwt中间件默认从Authorization头提取令牌
  // 我们将在自定义中间件中处理Auth头提取
});

/**
 * JWT验证中间件，含白名单逻辑和自定义错误处理
 * 使用自定义的Auth头字段而非标准的Authorization
 */
export async function authJwtMiddleware(c: Context, next: Next) {
  // 如果路径在白名单中，跳过JWT验证
  if (isPathInWhitelist(c.req.path)) {
    return next();
  }
  
  // 检查Auth头是否存在
  const authHeader = c.req.header('Auth');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(c, '请求中未包含授权信息', ResponseCode.UNAUTHORIZED, 401);
  }
  
  try {
    // 从Auth头提取令牌
    const token = extractJwtFromAuthHeader(c);
    
    if (!token) {
      return error(c, '请求中未包含有效的令牌', ResponseCode.UNAUTHORIZED, 401);
    }
    
    // 使用verify函数验证JWT
    let payload: any = {};
    if (JWT_CONFIG.SECRET) {
      payload = await verify(token, JWT_CONFIG.SECRET);
    }
    
    // 将解析的载荷设置到上下文中
    c.set('jwtPayload', payload);
    
    return next();
  } catch (err: any) {
    // 捕获JWT验证错误并返回中文错误消息
    if (err.message === 'invalid token') {
      return error(c, '无效的访问令牌', ResponseCode.UNAUTHORIZED, 401);
    } else if (err.message === 'jwt expired') {
      return error(c, '访问令牌已过期', ResponseCode.UNAUTHORIZED, 401);
    } else if (err.message === 'no authorization included in request') {
      return error(c, '请求中未包含授权信息', ResponseCode.UNAUTHORIZED, 401);
    } else {
      return error(c, '授权验证失败', ResponseCode.UNAUTHORIZED, 401);
    }
  }
}

/**
 * 用户信息中间件
 * 将JWT负载中的用户信息注入到Context中
 * 支持两种类型的用户：普通用户(users表)和Auth0用户(accounts表)
 */
export async function userMiddleware(c: Context, next: Next) {
  // 如果路径在白名单中，跳过处理
  if (isPathInWhitelist(c.req.path)) {
    return next();
  }
  
  try {
    // 获取JWT负载（由JWT中间件解析并放入上下文）
    const payload = c.get('jwtPayload');
    
    if (!payload || !payload.sub) {
      return next();
    }
    
    // 判断是Auth0用户还是普通用户
    const isAuth0User = !!payload.auth0_sub;
    console.log("payload.sub:", payload);
    if (isAuth0User) {
      // 处理Auth0用户 - payload.sub是accounts表的ID
      const account = await accountService.findAccountById(Number(payload.sub));
      
      if (account) {
        // 将Auth0用户信息注入到Context中
        const userInfo = {
          id: account.id, // accounts表的ID
          email: account.email,
          auth0_sub: account.auth0_sub,
          device_number: payload.device_number,
          isAuth0User: true,
          role: 'user' // 默认角色
        };
        
        c.set('user', userInfo);
      } else {
        return error(c, 'Auth0账户不存在', ResponseCode.UNAUTHORIZED, 401);
      }
    } else {
      // 处理普通用户 - payload.sub是users表的ID
      const user = await findUserById(payload.sub);
      
      if (user) {
        // 将用户信息注入到Context中
        const userInfo = {
          id: user.id,
          username: user.username,
          role: 'user', // 默认角色为user
          email: user.email,
          isAuth0User: false
        };
        
        c.set('user', userInfo);
      } else {
        return error(c, '用户不存在', ResponseCode.UNAUTHORIZED, 401);
      }
    }
    
    return next();
  } catch (err) {
    console.error('用户中间件处理错误:', err);
    // 如果出现错误，继续执行
    return next();
  }
}

/**
 * 组合身份验证中间件
 * 正确处理异步操作的顺序执行
 */
export async function authMiddleware(c: Context, next: Next) {
  // 如果路径在白名单中，跳过处理
  if (isPathInWhitelist(c.req.path)) {
    return next();
  }
  
  // 先执行JWT验证中间件，但是不继续执行后续中间件
  const jwtResult = await authJwtMiddleware(c, async () => {});
  
  // 如果JWT验证返回了结果，表示验证失败，直接返回错误
  if (jwtResult) {
    return jwtResult;
  }
  
  // JWT验证成功，执行用户中间件，同样不继续执行后续中间件
  const userResult = await userMiddleware(c, async () => {});
  
  // 如果用户中间件返回了结果，表示用户验证失败，直接返回错误
  if (userResult) {
    return userResult;
  }
  
  // 所有中间件验证成功，继续执行后续中间件
  return next();
} 