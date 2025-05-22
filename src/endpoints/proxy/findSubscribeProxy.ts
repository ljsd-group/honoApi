import { Hono } from 'hono';
import { Env } from '../../types';

// 创建查找订阅代理应用
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
    dev: 'http://192.168.31.100:8080/adware/subscribe/find',
    prod: 'https://ljsdstage.com/adware/subscribe/find'
  },
  [APP_NAMES.PICCHAT_BOX]: {
    dev: 'http://192.168.31.100:8081/system/image/subscribe/find',
    prod: 'https://ljsdstage.com/api/system/image/subscribe/find'
  },
  [APP_NAMES.TRADE_TUTOR_VIDEO]: {
    dev: 'http://192.168.31.100:8083/system/image/subscribe/find',
    prod: 'https://ljsdstage.com/video/system/image/subscribe/find'
  },
  [APP_NAMES.AI_META_AID]: {
    dev: 'http://192.168.31.100:8084/system/image/subscribe/find',
    prod: 'https://ljsdstage.com/aiMetaMid/system/image/subscribe/find'
  },
  [APP_NAMES.WALLET_BACKSTAGE]: {
    dev: 'http://192.168.31.100:8085/system/image/subscribe/find',
    prod: 'https://ljsdstage.com/wallet/system/image/subscribe/find'
  }
};

// 查找订阅代理端点
app.get('/', async (c) => {
  try {
    // 获取请求头
    const deviceNumber = c.req.header("deviceNumber");
    const phoneModel = c.req.header("phoneModel");
    const version = c.req.header("version");

    // 获取查询参数
    const queryParams = c.req.query();
    const appName = queryParams.appName || APP_NAMES.ALGENIUS_NEXT; // 默认为AlgeniusNext

    // 根据应用名称和环境选择API路径
    const isProduction = c.env.ENVIRONMENT === 'production';
    const appPaths = APP_API_PATHS[appName] || APP_API_PATHS[APP_NAMES.ALGENIUS_NEXT];
    const apiUrl = isProduction ? appPaths.prod : appPaths.dev;

    // 构建请求URL
    const url = new URL(apiUrl);

    // 转发请求到第三方API
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        deviceNumber: deviceNumber || "",
        phoneModel: phoneModel || "ios", // 默认为ios
        version: version || "",
      },
    });

    // 获取响应数据
    const responseData = await response.json() as Record<string, any>;

    // 获取状态码
    const statusCode = response.status >= 200 && response.status < 600 ? response.status : 500;
    
    // 格式化响应
    const formattedResponse = {
      code: responseData.code || response.status,
      message: responseData.msg || responseData.message || "操作完成",
      data: responseData.data || responseData
    };
    
    // 返回处理后的结果
    return c.json(formattedResponse, statusCode as any);
  } catch (error) {
    console.error("查找订阅代理错误:", error);
    return c.json(
      {
        code: 500,
        message: "查找订阅处理失败",
        data: null
      },
      500 as any
    );
  }
});

export default app; 