import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { APIError } from "../errors";
import { ResponseCode, error } from "../utils/response";

/**
 * 全局错误处理中间件
 * 捕获并格式化所有应用程序错误
 */
export function errorHandler(err: Error, c: Context) {
  console.error(`Error occurred:`, err);
  
  // 处理自定义APIError
  if (err instanceof APIError) {
    return error(
      c, 
      err.message, 
      err.status, 
      err.status
    );
  }
  
  // 处理Hono的HTTPException
  if (err instanceof HTTPException) {
    return error(
      c, 
      err.message, 
      err.status, 
      err.status
    );
  }
  
  // 处理其他类型的错误
  return error(
    c, 
    '服务器内部错误', 
    ResponseCode.INTERNAL_ERROR, 
    500
  );
} 