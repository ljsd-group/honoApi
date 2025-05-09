import { OpenAPIHono } from "@hono/zod-openapi";
import { TaskService } from "../services/taskService";

const taskService = new TaskService();

const app = new OpenAPIHono();

app.openapi(
	{
		method: "get",
		path: "/",
		responses: {
			200: {
				description: "Returns a list of tasks",
				content: {
					"application/json": {
						schema: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "number" },
									title: { type: "string" },
									description: { type: "string" },
									status: { type: "string" },
									created_at: { type: "string", format: "date-time" },
									updated_at: { type: "string", format: "date-time" },
								},
							},
						},
					},
				},
			},
			500: {
				description: "Server error",
			},
		},
		tags: ["Tasks"],
	},
	async (c) => {
		try {
			const tasks = await taskService.getAllTasks();
			return c.json(tasks);
		} catch (error) {
			console.error("Error fetching tasks:", error);
			return c.json({ error: "Failed to retrieve tasks" }, 500);
		}
	}
);

export default app;
