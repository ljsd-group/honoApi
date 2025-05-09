import { db } from '../config/database';
import { tasks } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { PaginationParams, paginate, PaginatedResult } from '../utils/pagination';

export interface Task {
  id?: number;
  title: string;
  description?: string;
  status?: string;
}

export class TaskService {
  // 获取所有任务（无分页）
  async getAllTasks() {
    try {
      return await db.select().from(tasks);
    } catch (error) {
      console.error('获取任务列表失败:', error);
      throw error;
    }
  }
  
  // 获取任务列表（带分页）
  async getTasksWithPagination(params: PaginationParams): Promise<PaginatedResult<Task>> {
    try {
      // 默认按创建时间倒序排列
      const orderByClause = desc(tasks.created_at);
      return await paginate<Task>(tasks, params, undefined, orderByClause);
    } catch (error) {
      console.error('获取分页任务列表失败:', error);
      throw error;
    }
  }
  
  // 按状态获取任务列表（带分页）
  async getTasksByStatus(status: string, params: PaginationParams): Promise<PaginatedResult<Task>> {
    try {
      const whereClause = eq(tasks.status, status);
      const orderByClause = desc(tasks.created_at);
      return await paginate<Task>(tasks, params, whereClause, orderByClause);
    } catch (error) {
      console.error(`获取状态为${status}的任务列表失败:`, error);
      throw error;
    }
  }

  // 根据ID获取任务
  async getTaskById(id: number) {
    try {
      const result = await db.select().from(tasks).where(eq(tasks.id, id));
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error(`获取任务ID=${id}失败:`, error);
      throw error;
    }
  }

  // 创建新任务
  async createTask(taskData: Task) {
    try {
      const result = await db.insert(tasks).values(taskData);
      return result;
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  }

  // 更新任务
  async updateTask(id: number, taskData: Partial<Task>) {
    try {
      await db.update(tasks)
        .set(taskData)
        .where(eq(tasks.id, id));
      return await this.getTaskById(id);
    } catch (error) {
      console.error(`更新任务ID=${id}失败:`, error);
      throw error;
    }
  }

  // 删除任务
  async deleteTask(id: number) {
    try {
      await db.delete(tasks).where(eq(tasks.id, id));
      return true;
    } catch (error) {
      console.error(`删除任务ID=${id}失败:`, error);
      throw error;
    }
  }
} 