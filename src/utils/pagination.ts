import { Context } from 'hono';
import { SQL, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { PgTable } from 'drizzle-orm/pg-core';

// 分页参数接口
export interface PaginationParams {
  pageNum?: number;
  pageSize?: number;
}

// 分页结果接口
export interface PaginatedResult<T> {
  list: T[];
  total: number;
  pageNum: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 从请求中获取分页参数
 * @param c Hono上下文
 * @returns 分页参数
 */
export function getPaginationParams(c: Context): PaginationParams {
  const query = c.req.query();
  
  // 获取页码和每页大小，设置默认值和最小值
  let pageNum = Number(query.pageNum || query.page || 1);
  let pageSize = Number(query.pageSize || query.limit || 10);
  
  // 确保值是有效的
  pageNum = Math.max(1, isNaN(pageNum) ? 1 : pageNum);
  pageSize = Math.min(100, Math.max(1, isNaN(pageSize) ? 10 : pageSize));
  
  return { pageNum, pageSize };
}

/**
 * 执行带分页的查询
 * @param table 表对象
 * @param params 分页参数
 * @param whereClause 可选的WHERE条件
 * @returns 分页结果
 */
export async function paginate<T extends Record<string, any>>(
  table: PgTable<any>,
  params: PaginationParams,
  whereClause?: SQL<unknown>,
  orderByClause?: SQL<unknown>
): Promise<PaginatedResult<T>> {
  const { pageNum = 1, pageSize = 10 } = params;
  
  // 计算偏移量
  const offset = (pageNum - 1) * pageSize;
  
  try {
    // 构建查询和执行，使用any绕过类型检查的复杂性
    const query: any = db.select().from(table);
    
    if (whereClause) {
      query.where(whereClause);
    }
    
    if (orderByClause) {
      query.orderBy(orderByClause);
    }
    
    // 添加分页并执行
    const items = await query.limit(pageSize).offset(offset) as T[];
    
    // 获取总记录数
    const countQuery: any = db.select({ 
      count: sql<number>`count(*)`
    }).from(table);
    
    if (whereClause) {
      countQuery.where(whereClause);
    }
    
    const countResult = await countQuery;
    const total = Number(countResult[0]?.count || 0);
    
    // 计算总页数
    const totalPages = Math.ceil(total / pageSize);
    
    // 返回分页结果
    return {
      list: items,
      total,
      pageNum,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error('分页查询失败:', error);
    throw error;
  }
} 