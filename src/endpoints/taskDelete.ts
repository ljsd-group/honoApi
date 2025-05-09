import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { TaskService } from "../services/taskService";

const taskService = new TaskService();
const app = new OpenAPIHono();

app.openapi(
	{
		method: "delete",
		path: "/:id",
		request: {
			params: z.object({
				id: z.string().transform((val) => parseInt(val, 10))
			})
		},
		responses: {
			200: {
				description: "Task deleted successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							message: z.string()
						})
					}
				}
			},
			404: {
				description: "Task not found",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							error: z.string()
						})
					}
				}
			},
			500: {
				description: "Server error"
			}
		},
		tags: ["Tasks"]
	},
	async (c) => {
		try {
			const { id } = c.req.valid('param');
			
			// 检查任务是否存在
			const task = await taskService.getTaskById(id);
			if (!task) {
				return c.json({
					success: false,
					error: "Task not found"
				}, 404);
			}
			
			// 删除任务
			await taskService.deleteTask(id);
			
			return c.json({
				success: true,
				message: "Task deleted successfully"
			});
		} catch (error) {
			console.error(`Error deleting task:`, error);
			return c.json({
				success: false,
				error: "Failed to delete task"
			}, 500);
		}
	}
);

export default app;
