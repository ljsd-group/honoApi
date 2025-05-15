import { Context, Next } from 'hono';
import { ResponseCode } from '../utils/response';

/**
 * 响应拦截器中间件
 * 将所有响应格式统一为：
 * 成功: { code: 状态码, data: 数据, message: '消息' }
 * 失败: { code: 错误码, message: '错误消息' }
 */
export async function responseMiddleware(c: Context, next: Next) {
  // 保留原始方法
  const originalJson = c.json.bind(c);
  
  // 重写json方法
  c.json = (data: any, init?: any) => {
    // 检查是否已经是标准格式
    if (data && typeof data === 'object' && 'code' in data) {
      return originalJson(data, init);
    }
    
    // 获取状态码
    const status = typeof init === 'number' 
      ? init 
      : (init && typeof init === 'object' && 'status' in init) 
        ? init.status 
        : 200;
    
    // 根据状态码判断是成功还是失败
    if (status >= 200 && status < 300) {
      // 成功响应
      return originalJson({
        code: ResponseCode.SUCCESS,
        data: data,
        message: '请求成功'
      }, init);
    } else {
      // 错误响应
      const errorBody = data && typeof data === 'object' ? data : {};
      const message = 
        (errorBody && 'error' in errorBody && typeof errorBody.error === 'string') 
          ? errorBody.error 
          : (errorBody && 'message' in errorBody && typeof errorBody.message === 'string') 
            ? errorBody.message 
            : '请求失败';
      
      let code = ResponseCode.INTERNAL_ERROR;
      
      // 根据HTTP状态码选择适当的错误码
      switch(status) {
        case 400: code = ResponseCode.BAD_REQUEST; break;
        case 401: code = ResponseCode.UNAUTHORIZED; break;
        case 403: code = ResponseCode.FORBIDDEN; break;
        case 404: code = ResponseCode.NOT_FOUND; break;
        default: code = ResponseCode.INTERNAL_ERROR;
      }
      
      return originalJson({
        code: code,
        message: message
      }, init);
    }
  };
  
  await next();
} 