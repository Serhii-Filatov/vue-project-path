export type TaskStatus = 'to_do' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  assignee: string
  status: TaskStatus
  dueDate: string
  createdAt: string
  updatedAt: string
  order: number
}

export interface CreateTaskRequest {
  projectId: string
  title: string
  description: string
  assignee: string
  status: TaskStatus
  dueDate: string
}
