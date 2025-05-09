import { Context, Next } from 'hono';
import { ResponseCode } from '../utils/response';

/**
 * 响应拦截器中间件
 * 将所有响应格式统一为：
 * 成功: { code: 状态码, data: 数据, message: '消息' }
 * 失败: { code: 错误码, message: '错误消息' }
 */
export async function responseMiddleware(c: Context, next: Next) {
  // 先执行后续中间件
  await next();
  
  // 获取响应
  const response = c.res;
  
  // 如果响应不是JSON格式，则不处理
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return;
  }
  
  try {
    // 获取原始响应
    const originalBody = await response.json();
    
    // 如果已经是标准格式，直接返回
    if (originalBody && typeof originalBody === 'object' && 'code' in originalBody) {
      return;
    }
    
    // 根据状态码判断是成功还是失败
    const status = response.status;
    if (status >= 200 && status < 300) {
      // 成功响应
      const newResponse = {
        code: ResponseCode.SUCCESS,
        data: originalBody,
        message: '请求成功'
      };
      
      // 创建新的响应
      c.res = new Response(JSON.stringify(newResponse), {
        status: status,
        headers: {
          'content-type': 'application/json'
        }
      });
    } else {
      // 错误响应
      const errorBody = originalBody as Record<string, unknown>;
      const message = 
        typeof errorBody.error === 'string' ? errorBody.error : 
        typeof errorBody.message === 'string' ? errorBody.message : 
        '请求失败';
      
      let code = ResponseCode.INTERNAL_ERROR;
      
      // 根据HTTP状态码选择适当的错误码
      switch(status) {
        case 400: code = ResponseCode.BAD_REQUEST; break;
        case 401: code = ResponseCode.UNAUTHORIZED; break;
        case 403: code = ResponseCode.FORBIDDEN; break;
        case 404: code = ResponseCode.NOT_FOUND; break;
        default: code = ResponseCode.INTERNAL_ERROR;
      }
      
      const newResponse = {
        code: code,
        message: message
      };
      
      // 创建新的响应
      c.res = new Response(JSON.stringify(newResponse), {
        status: status,
        headers: {
          'content-type': 'application/json'
        }
      });
    }
  } catch (error) {
    // 如果处理过程中出错，不修改原响应
    console.error('处理响应时出错:', error);
  }
} 