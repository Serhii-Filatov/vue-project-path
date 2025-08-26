export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'cancelled' | 'archived'

export interface Project {
  id: string
  name: string
  description: string
  status: ProjectStatus
  taskCount: number
  completedTaskCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectRequest {
  name: string
  description: string
}

export interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  width?: number
  minWidth?: number
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  [key: string]: string
}
