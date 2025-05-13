import { Context, Next } from 'hono';
import { ResponseCode } from '../utils/response';

/**
 * 响应拦截器中间件
 * 将所有响应格式统一为：
 * 成功: { code: 状态码, data: 数据, message: '消息' }
 * 失败: { code: 错误码, message: '错误消息' }
 */
export async function responseMiddleware(c: Context, next: Next) {
  // 保存原始json方法
  const originalJson = c.json;
  
  // 替换json方法以修改返回格式
  c.json = function(data: any, status?: number) {
    const responseStatus = status || 200;
    
    // 检查是否已经是标准格式
    if (data && typeof data === 'object' && 'code' in data) {
      return originalJson.call(c, data, responseStatus);
    }
    
    // 根据状态码判断是成功还是失败
    if (responseStatus >= 200 && responseStatus < 300) {
      // 成功响应
      return originalJson.call(c, {
        code: ResponseCode.SUCCESS,
        data: data,
        message: '请求成功'
      }, responseStatus);
    } else {
      // 错误响应
      const errorBody = typeof data === 'object' ? data : {};
      const message = 
        typeof errorBody.error === 'string' ? errorBody.error : 
        typeof errorBody.message === 'string' ? errorBody.message : 
        '请求失败';
      
      let code = ResponseCode.INTERNAL_ERROR;
      
      // 根据HTTP状态码选择适当的错误码
      switch(responseStatus) {
        case 400: code = ResponseCode.BAD_REQUEST; break;
        case 401: code = ResponseCode.UNAUTHORIZED; break;
        case 403: code = ResponseCode.FORBIDDEN; break;
        case 404: code = ResponseCode.NOT_FOUND; break;
        default: code = ResponseCode.INTERNAL_ERROR;
      }
      
      return originalJson.call(c, {
        code: code,
        message: message
      }, responseStatus);
    }
  };
  
  // 执行后续中间件
  await next();
} 