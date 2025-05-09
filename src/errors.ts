import { HTTPException } from 'hono/http-exception';

/**
 * 自定义API错误类，用于抛出带状态码的错误
 */
export class APIError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
  }
}

/**
 * 404错误 - 资源未找到
 */
export class NotFoundError extends APIError {
  constructor(message = '资源未找到') {
    super(404, message);
  }
}

/**
 * 400错误 - 请求错误
 */
export class BadRequestError extends APIError {
  constructor(message = '请求参数错误') {
    super(400, message);
  }
}

/**
 * 401错误 - 未授权
 */
export class UnauthorizedError extends APIError {
  constructor(message = '未授权，请先登录') {
    super(401, message);
  }
}

/**
 * 403错误 - 禁止访问
 */
export class ForbiddenError extends APIError {
  constructor(message = '禁止访问，权限不足') {
    super(403, message);
  }
}

/**
 * 500错误 - 服务器内部错误
 */
export class InternalServerError extends APIError {
  constructor(message = '服务器内部错误') {
    super(500, message);
  }
} 