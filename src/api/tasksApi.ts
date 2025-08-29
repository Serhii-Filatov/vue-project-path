import api from './axios'
import type { Task, CreateTaskRequest } from '@/types/task'

export const tasksApi = {
  async getTasks(): Promise<Task[]> {
    const response = await api.get('/tasks')
    return response.data
  },

  async getTasksByProject(projectId: string): Promise<Task[]> {
    const response = await api.get(`/tasks?projectId=${projectId}`)
    return response.data.sort((a: Task, b: Task) => a.order - b.order)
  },

  async getTask(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`)
    return response.data
  },

  async createTask(task: CreateTaskRequest): Promise<Task> {
    const existingTasks = await this.getTasksByProject(task.projectId)
    const maxOrder = existingTasks.length > 0 ? Math.max(...existingTasks.map((t) => t.order)) : 0

    const allTasks = await this.getTasks()
    const numericShortIds = allTasks
      .map((t) => String(t.id))
      .filter((id) => /^\d{1,3}$/.test(id))
      .map((id) => Number(id))
    const nextShortId = (numericShortIds.length > 0 ? Math.max(...numericShortIds) : 0) + 1

    const newTask = {
      ...task,
      id: nextShortId.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: maxOrder + 1,
    }
    const response = await api.post('/tasks', newTask)
    return response.data
  },

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const response = await api.patch(`/tasks/${id}`, {
      ...task,
      updatedAt: new Date().toISOString(),
    })
    return response.data
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`)
  },

  async updateTaskOrder(tasks: { id: string; order: number }[]): Promise<void> {
    const updatePromises = tasks.map((task) =>
      api.patch(`/tasks/${task.id}`, {
        order: task.order,
        updatedAt: new Date().toISOString(),
      }),
    )
    await Promise.all(updatePromises)
  },

  async updateTaskStatus(id: string, status: Task['status']): Promise<Task> {
    const response = await api.patch(`/tasks/${id}`, {
      status,
      updatedAt: new Date().toISOString(),
    })
    return response.data
  },
}
