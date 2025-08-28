import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectsApi } from '@/api/projectsApi'
import type { Project, CreateProjectRequest, SortConfig, FilterConfig } from '@/types/project'
import { syncWithLocalStorage } from '@/utils/localStorageSync'

export const useProjectsStore = defineStore('projects', () => {
  // State
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const sortConfig = ref<SortConfig | null>(null)
  const filterConfig = ref<FilterConfig>({})

  // Computed
  const sortedAndFilteredProjects = computed(() => {
    let result = [...projects.value]

    // Фільтрація
    if (filterConfig.value.name) {
      result = result.filter((project) =>
        project.name.toLowerCase().includes(filterConfig.value.name!.toLowerCase()),
      )
    }

    if (filterConfig.value.status) {
      result = result.filter((project) => project.status === filterConfig.value.status)
    }

    // Сортування
    if (sortConfig.value) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.value!.key as keyof Project]
        const bValue = b[sortConfig.value!.key as keyof Project]

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.value!.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.value!.direction === 'asc' ? aValue - bValue : bValue - aValue
        }

        return 0
      })
    }

    return result
  })

  // Actions
  const fetchProjects = async () => {
    loading.value = true
    error.value = null
    // Reset filters
    filterConfig.value = {}
    sortConfig.value = null
    try {
      projects.value = await projectsApi.getProjects()
    } catch (err) {
      error.value = 'Помилка завантаження проектів'
      console.error('Error fetching projects:', err)
    } finally {
      loading.value = false
    }
  }

  const createProject = async (projectData: CreateProjectRequest) => {
    loading.value = true
    error.value = null
    try {
      const newProject = await projectsApi.createProject(projectData)
      projects.value.push(newProject)
      return newProject
    } catch (err) {
      error.value = 'Помилка створення проекту'
      console.error('Error creating project:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    loading.value = true
    error.value = null
    try {
      const updatedProject = await projectsApi.updateProject(id, projectData)
      const index = projects.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        projects.value[index] = updatedProject
      }
      return updatedProject
    } catch (err) {
      error.value = 'Помилка оновлення проекту'
      console.error('Error updating project:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteProject = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await projectsApi.deleteProject(id)
      projects.value = projects.value.filter((p) => p.id !== id)
    } catch (err) {
      error.value = 'Помилка видалення проекту'
      console.error('Error deleting project:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const setSortConfig = (config: SortConfig | null) => {
    sortConfig.value = config
  }

  const setFilterConfig = (config: FilterConfig) => {
    filterConfig.value = config
  }

  const clearError = () => {
    error.value = null
  }

  // Синхронізація з LocalStorage
  syncWithLocalStorage(projects, 'projects')
  syncWithLocalStorage(sortConfig, 'projectsSortConfig')
  syncWithLocalStorage(filterConfig, 'projectsFilterConfig')

  return {
    // State
    projects,
    loading,
    error,
    sortConfig,
    filterConfig,

    // Computed
    sortedAndFilteredProjects,

    // Actions
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setSortConfig,
    setFilterConfig,
    clearError,
  }
})
