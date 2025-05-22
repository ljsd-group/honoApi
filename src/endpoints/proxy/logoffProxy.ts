import { Hono } from 'hono';
import { Env } from '../../types';
import { AccountService } from '../../services/accountService';

// 创建注销代理应用
const app = new Hono<{ Bindings: Env }>();

// 定义应用名称常量
const APP_NAMES = {
  ALGENIUS_NEXT: 'AlgeniusNext',
  PICCHAT_BOX: 'PicchatBox',
  TRADE_TUTOR_VIDEO: 'TradeTutorVideo',
  AI_META_AID: 'AIMetaAid',
  WALLET_BACKSTAGE: 'Wallet-Backstage'
};

// 定义应用对应的API路径
const APP_API_PATHS = {
  [APP_NAMES.ALGENIUS_NEXT]: {
    dev: 'http://192.168.31.103:8080/adware/subscribe/delete',
    prod: 'https://ljsdstage.com/adware/subscribe/delete'
  },
  [APP_NAMES.PICCHAT_BOX]: {
    dev: 'http://192.168.31.103:8081/system/image/subscribe/delete',
    prod: 'https://ljsdstage.com/api/system/image/subscribe/delete'
  },
  [APP_NAMES.TRADE_TUTOR_VIDEO]: {
    dev: 'http://192.168.31.103:8083/system/image/subscribe/delete',
    prod: 'https://ljsdstage.com/video/system/image/subscribe/delete'
  },
  [APP_NAMES.AI_META_AID]: {
    dev: 'http://192.168.31.103:8084/system/image/subscribe/delete',
    prod: 'https://ljsdstage.com/aiMetaMid/system/image/subscribe/delete'
  },
  [APP_NAMES.WALLET_BACKSTAGE]: {
    dev: 'http://192.168.31.103:8085/system/image/subscribe/delete',
    prod: 'https://ljsdstage.com/wallet/system/image/subscribe/delete'
  }
};

// 注销代理端点
app.get('/', async (c) => {
  try {
    // 获取请求头
    const deviceNumber = c.req.header("deviceNumber")
    const phoneModel = c.req.header("phoneModel");
    const version = c.req.header("version");
    const appName = c.req.header("appName") || APP_NAMES.ALGENIUS_NEXT;

    // 检查授权 - 从中间件获取用户信息和JWT载荷
    const user = c.get("user") as any;
    const jwtPayload = c.get("jwtPayload") as any;
    
    // 确保有用户信息和auth0_sub
    if (!user || !user.auth0_sub) {
      return c.json({
        success: false,
        message: "用户信息获取失败，请确保授权有效"
      }, 401 as any);
    }

    // 根据应用名称和环境选择API路径
    const isProduction = c.env.ENVIRONMENT === 'production';
    console.log('env.ENVIRONMENT', c.env.ENVIRONMENT);
    const appPaths = APP_API_PATHS[appName] || APP_API_PATHS[APP_NAMES.ALGENIUS_NEXT];
    const apiUrl = isProduction ? appPaths.prod : appPaths.dev;

    // 构建请求URL
    const url = new URL(apiUrl);
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
    
    try {
      // 转发请求到第三方API
      const response = await fetch(url.toString(), {
        method: "get",
        headers: {
          phoneModel: phoneModel || "ios", // 默认为ios
          version: version || "",
          ...(deviceNumber ? { deviceNumber } : {})
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // 清除超时计时器
      
      // 获取响应数据
      const responseData = await response.json() as Record<string, any>;
      const responMessage = {
        code: responseData.code,
        message: responseData.msg,
      };
      
      // 如果代理请求成功，删除账户
      if (response.ok) {
        try {
          // 从JWT载荷中获取app_id
          const appId = jwtPayload?.app_id;
          
          if (user.auth0_sub && appId) {
            console.log(`删除auth0_sub=${user.auth0_sub}和appId=${appId}对应的账户`);
            const accountService = new AccountService(c.env);
            
            // 查找匹配的账户
            const account = await accountService.findAccountByAuth0SubAndAppId(user.auth0_sub, appId);
            
            if (account && account.id) {
              // 删除找到的账户
              const deleteResult = await accountService.deleteAccountById(account.id);
              console.log('删除账户结果:', deleteResult);
            } else {
              console.log('未找到匹配的账户，无需删除');
            }
          } else {
            console.error('缺少删除账户所需的参数:', { auth0_sub: user.auth0_sub, appId });
          }
        } catch (dbError) {
          console.error(`删除账户失败:`, dbError);
          // 数据库操作失败不影响API响应，但记录错误信息
        }
      }
      
      // 获取状态码
      const statusCode = response.status >= 200 && response.status < 600 ? response.status : 500;
      
      // 创建新的响应对象
      return c.json(responMessage, statusCode as any);
    } catch (fetchError: any) {
      console.error("第三方API请求失败:", fetchError);
      
      // 清除超时计时器
      clearTimeout(timeoutId);
      
      // 如果是超时错误
      if (fetchError.name === 'AbortError') {
        console.log('第三方API请求超时，继续处理本地账户删除');
        
        // 尝试删除本地账户
        try {
          const appId = jwtPayload?.app_id;
          
          if (user.auth0_sub && appId) {
            console.log(`删除auth0_sub=${user.auth0_sub}和appId=${appId}对应的账户`);
            const accountService = new AccountService(c.env);
            
            // 查找匹配的账户
            const account = await accountService.findAccountByAuth0SubAndAppId(user.auth0_sub, appId);
            
            if (account && account.id) {
              // 删除找到的账户
              const deleteResult = await accountService.deleteAccountById(account.id);
              console.log('删除账户结果:', deleteResult);
              
              // 返回成功响应
              return c.json({
                code: 200,
                message: "本地账户已删除（第三方API请求超时）"
              }, 200 as any);
            } else {
              console.log('未找到匹配的账户，无需删除');
              return c.json({
                code: 404,
                message: "未找到匹配的账户"
              }, 200 as any);
            }
          }
        } catch (dbError) {
          console.error(`删除账户失败:`, dbError);
        }
      }
      
      // 返回错误响应
      return c.json({
        code: 500,
        message: "第三方API请求失败: " + (fetchError.message || "未知错误")
      }, 500 as any);
    }
  } catch (err: any) {
    console.error("注销代理请求失败:", err);
    // 确保只返回一次响应
    return c.json(
      {
        code: 500,
        message: "注销处理失败: " + (err.message || "未知错误")
      },
      500 as any
    );
  }
});

export default app; 