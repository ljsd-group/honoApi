import { Context } from "hono";

/**
 * 响应状态码
 */
export enum ResponseCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500
}

/**
 * 创建成功响应
 * @param data 响应数据
 * @param message 成功消息
 * @param code 状态码
 */
export function createSuccessResponse<T>(
  data: T, 
  message: string = "请求成功", 
  code: number = ResponseCode.SUCCESS
) {
  return {
    code,
    data,
    message
  };
}

/**
 * 创建错误响应
 * @param message 错误消息
 * @param code 状态码
 */
export function createErrorResponse(
  message: string = "请求失败", 
  code: number = ResponseCode.INTERNAL_ERROR
) {
  return {
    code,
    message
  };
}

/**
 * 返回成功响应
 */
export function success<T>(
  c: Context,
  data: T,
  message: string = "请求成功",
  code: number = ResponseCode.SUCCESS,
  httpStatus: number = 200
) {
  return c.json(createSuccessResponse(data, message, code), httpStatus as any);
}

/**
 * 返回错误响应
 */
export function error(
  c: Context,
  message: string = "请求失败",
  code: number = ResponseCode.INTERNAL_ERROR,
  httpStatus: number = 500
) {
  return c.json(createErrorResponse(message, code), httpStatus as any);
} 