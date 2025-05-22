import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sign } from 'hono/jwt';
import { Env, User } from '../../types';
import { success, error, ResponseCode } from '../../utils/response';
import { AccountService } from '../../services/accountService';
import { DeviceService } from '../../services/deviceService';

// Auth0用户信息类型定义
interface Auth0UserInfo {
  sub: string;
  name?: string;
  nickname?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  [key: string]: any; // 其他可能的字段
}

// 登录类型枚举
const LOGIN_TYPE = {
  APPLE: 1,   // 苹果登录
  GOOGLE: 2,  // 谷歌登录
};

// 创建Auth0验证应用
const app = new Hono<{ Bindings: Env }>();

// 定义请求验证模式
const auth0VerifySchema = z.object({
  access_token: z.string(),
  idToken: z.string().optional(),
  loginType: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]).default(LOGIN_TYPE.APPLE),
  appId: z.union([
    z.number(),
    z.string().transform(val => Number(val))
  ]).optional()
});

// Base64 URL 解码函数
function base64UrlDecode(str: string): string {
  // 替换URL安全的字符，并添加缺失的填充
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  
  // 使用atob解码，兼容Cloudflare Workers
  return atob(padded);
}

/**
 * 检查字符串是否为ISO日期格式
 */
function isISODateString(str: string): boolean {
  if (typeof str !== 'string') return false;
  
  // ISO 8601日期格式的正则表达式
  const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[\+\-]\d{2}:\d{2})?$/;
  return isoDatePattern.test(str);
}

/**
 * 将UTC时间字符串转换为东八区(UTC+8)时间字符串
 */
function convertToUTC8(utcDateString: string): string {
  try {
    const date = new Date(utcDateString);
    const utcTimestamp = date.getTime();
    const beijingTimestamp = utcTimestamp + (8 * 60 * 60 * 1000);
    const beijingDate = new Date(beijingTimestamp);
    return beijingDate.toISOString();
  } catch (err) {
    console.error("时间转换错误:", err);
    return utcDateString;
  }
}

/**
 * 处理对象中的null值，将它们替换为空字符串，并调整日期时区
 */
function replaceNullWithEmptyString(obj: any): any {
  if (obj === null) return '';
  if (typeof obj !== 'object' || obj === undefined) return obj;
  
  if (obj instanceof Date) {
    return convertToUTC8(obj.toISOString());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => replaceNullWithEmptyString(item));
  }
  
  const result: any = {};
  
  for (const key in obj) {
    if (obj[key] === null) {
      result[key] = '';
    } else if (typeof obj[key] === 'string' && isISODateString(obj[key])) {
      result[key] = convertToUTC8(obj[key]);
    } else if (typeof obj[key] === 'object') {
      result[key] = replaceNullWithEmptyString(obj[key]);
    } else {
      result[key] = obj[key];
    }
  }
  
  return result;
}

// Auth0验证端点
app.post('/', zValidator('json', auth0VerifySchema), async (c) => {
  try {
    // 获取请求体
    const { access_token, loginType = LOGIN_TYPE.APPLE, appId } = c.req.valid('json');
    
    // 从请求头获取设备相关信息
    const phone_model = c.req.header("phoneModel");
    const country_code = c.req.header("countryCode");
    const version = c.req.header("version");
    
    if (!access_token) {
      return error(c, "访问令牌不能为空", ResponseCode.UNAUTHORIZED, 401);
    }

    // 验证appId是否存在并转换为数字
    if (!appId) {
      return error(c, "应用ID不能为空", ResponseCode.INTERNAL_ERROR, 200);
    }
    const appIdNumber = Number(appId);
    if (isNaN(appIdNumber)) {
      return error(c, "无效的应用ID格式", ResponseCode.INTERNAL_ERROR, 200);
    }

    // 从数据库获取应用信息和Auth0域名
    let appDomain;
    try {
      console.log("开始查询应用信息，appId:", appIdNumber);
      
      // 导入数据库和表
      const { createDbClient } = await import('../../db/config');
      const db = createDbClient(c.env.DATABASE_URL);
      const { applications } = await import('../../db/schema');
      const { eq } = await import('drizzle-orm');
      
      // 查询应用记录
      const results = await db.select()
        .from(applications)
        .where(eq(applications.id, appIdNumber))
        .limit(1);
      
      const appRecord = results.length > 0 ? results[0] : null;
      
      if (!appRecord) {
        console.log("未找到应用记录");
        return error(c, "无效的应用ID", ResponseCode.INTERNAL_ERROR, 200);
      }
      
      appDomain = appRecord.domain;
      console.log("获取到应用域名:", appDomain);
    } catch (err) {
      console.error("查询应用信息失败:", err);
      return error(c, "查询应用信息时发生错误", ResponseCode.INTERNAL_ERROR, 500);
    }
    
    // 获取用户信息
    const userInfoResponse = await fetch(`https://${appDomain}/userinfo`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text().catch(() => '未知错误');
      return error(c, `无效的访问令牌: ${errorText}`, ResponseCode.UNAUTHORIZED, 401);
    }

    const userInfo = await userInfoResponse.json() as Auth0UserInfo;
    
    // 查找或创建Auth0账户
    const accountService = new AccountService(c.env);
    
    // 创建账户数据对象
    const accountData = {
      auth0_sub: userInfo.sub,
      name: userInfo.name,
      nickname: userInfo.nickname,
      email: userInfo.email,
      email_verified: userInfo.email_verified,
      picture: userInfo.picture,
      app_id: appIdNumber,
      login_type: loginType,
      phone_model: phone_model,
      country_code: country_code,
      version: version
    };
    
    let account;
    
    // 检查auth0_sub和appId是否都存在
    if (userInfo.sub && appIdNumber) {
      // 查找匹配的账户（匹配auth0_sub和appId）
      account = await accountService.findAccountByAuth0SubAndAppId(userInfo.sub, appIdNumber);
      
      if (account) {
        // 账户存在，更新账户信息
        console.log('找到匹配的账户，更新账户信息');
        if (account.id) {
          account = await accountService.updateAccount({
            id: account.id,
            ...accountData
          });
        }
      } else {
        // 不存在匹配的账户，直接创建新账户
        console.log('不存在匹配的账户，创建新账户');
        account = await accountService.createAccount(accountData);
      }
    } else {
      // 缺少必要参数，无法进行匹配
      if (userInfo.sub) {
        // 创建新账户
        console.log('缺少应用ID，创建新账户');
        account = await accountService.createAccount(accountData);
      } else {
        // 没有auth0_sub，无法创建账户
        console.log('没有auth0_sub，无法创建账户');
        return error(c, "缺少必要的用户信息", ResponseCode.INTERNAL_ERROR, 400);
      }
    }

    // 生成JWT令牌
    const token = await sign({
      sub: account ? String(account.id) : userInfo.sub,
      auth0_sub: userInfo.sub,
      name: userInfo.name || '',
      email: userInfo.email || '',
      app_id: appIdNumber,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 * 30, // 30天后过期
    }, c.env.JWT_SECRET || 'fallback-secret-key');

    // 处理null值，替换为空字符串
    const processedAccount = account ? replaceNullWithEmptyString(account) : null;
    
    // 返回用户信息、账户信息和JWT令牌
    return success(c, {
      token,
      user: {
        sub: userInfo.sub,
        name: userInfo.name || '',
        email: userInfo.email || '',
        picture: userInfo.picture || ''
      },
      account: processedAccount
    }, "令牌验证成功", ResponseCode.SUCCESS);
  } catch (err) {
    console.error("Auth0验证错误:", err);
    return error(c, "验证访问令牌时发生错误", ResponseCode.INTERNAL_ERROR, 500);
  }
});

export default app; 