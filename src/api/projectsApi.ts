import api from './axios'
import type { Project, CreateProjectRequest } from '@/types/project'

export const projectsApi = {
  async getProjects(): Promise<Project[]> {
    const response = await api.get('/projects')
    return response.data
  },

  async getProject(id: string): Promise<Project> {
    const response = await api.get(`/projects/${id}`)
    return response.data
  },

  async createProject(project: CreateProjectRequest): Promise<Project> {
    const existing = await this.getProjects()
    const numericShortIds = existing
      .map((p) => String(p.id))
      .filter((id) => /^\d{1,3}$/.test(id))
      .map((id) => Number(id))

    const maxShortId = numericShortIds.length > 0 ? Math.max(...numericShortIds) : 0
    const nextId = (maxShortId + 1).toString()

    const newProject = {
      ...project,
      id: nextId,
      status: 'active' as const,
      taskCount: 0,
      completedTaskCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const response = await api.post('/projects', newProject)
    return response.data
  },

  async updateProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await api.patch(`/projects/${id}`, {
      ...project,
      updatedAt: new Date().toISOString(),
    })
    return response.data
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  },
}
