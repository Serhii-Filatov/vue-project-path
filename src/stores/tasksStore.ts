import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tasksApi } from '@/api/tasksApi'
import type { Task, CreateTaskRequest, TaskStatus } from '@/types/task'
import { syncWithLocalStorage } from '@/utils/localStorageSync'

export const useTasksStore = defineStore('tasks', () => {
  // State
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentProjectId = ref<string | null>(null)

  // Computed
  const tasksByProject = computed(() => {
    if (!currentProjectId.value) return []
    return tasks.value
      .filter((task) => task.projectId === currentProjectId.value)
      .sort((a, b) => a.order - b.order)
  })

  const tasksByStatus = computed(() => {
    const result = {
      to_do: [] as Task[],
      in_progress: [] as Task[],
      done: [] as Task[],
    }

    tasksByProject.value.forEach((task) => {
      result[task.status].push(task)
    })

    return result
  })

  const assignees = computed(() => {
    const uniqueAssignees = new Set(tasksByProject.value.map((task) => task.assignee))
    return Array.from(uniqueAssignees).sort()
  })

  // Actions
  const fetchTasksByProject = async (projectId: string) => {
    loading.value = true
    error.value = null
    currentProjectId.value = projectId
    try {
      const projectTasks = await tasksApi.getTasksByProject(projectId)
      // Оновлюємо тільки завдання для поточного проекту
      tasks.value = tasks.value.filter((task) => task.projectId !== projectId)
      tasks.value.push(...projectTasks)
    } catch (err) {
      error.value = 'Помилка завантаження завдань'
      console.error('Error fetching tasks:', err)
    } finally {
      loading.value = false
    }
  }

  const createTask = async (taskData: CreateTaskRequest) => {
    loading.value = true
    error.value = null
    try {
      const newTask = await tasksApi.createTask(taskData)
      tasks.value.push(newTask)
      return newTask
    } catch (err) {
      error.value = 'Помилка створення завдання'
      console.error('Error creating task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTask = async (id: string, taskData: Partial<Task>) => {
    loading.value = true
    error.value = null
    try {
      const updatedTask = await tasksApi.updateTask(id, taskData)
      const index = tasks.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
      return updatedTask
    } catch (err) {
      error.value = 'Помилка оновлення завдання'
      console.error('Error updating task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteTask = async (id: string) => {
    loading.value = true
    error.value = null
    try {
      await tasksApi.deleteTask(id)
      tasks.value = tasks.value.filter((t) => t.id !== id)
    } catch (err) {
      error.value = 'Помилка видалення завдання'
      console.error('Error deleting task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTaskOrder = async (reorderedTasks: Task[]) => {
    loading.value = true
    error.value = null
    try {
      const orderUpdates = reorderedTasks.map((task, index) => ({
        id: task.id,
        order: index + 1,
      }))

      await tasksApi.updateTaskOrder(orderUpdates)

      // Оновлюємо локальний стан
      reorderedTasks.forEach((task, index) => {
        const taskIndex = tasks.value.findIndex((t) => t.id === task.id)
        if (taskIndex !== -1) {
          tasks.value[taskIndex].order = index + 1
        }
      })
    } catch (err) {
      error.value = 'Помилка оновлення порядку завдань'
      console.error('Error updating task order:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    loading.value = true
    error.value = null
    try {
      const updatedTask = await tasksApi.updateTaskStatus(id, status)
      const index = tasks.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tasks.value[index] = updatedTask
      }
      return updatedTask
    } catch (err) {
      error.value = 'Помилка оновлення статусу завдання'
      console.error('Error updating task status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const moveTaskBetweenStatuses = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.value.find((t) => t.id === taskId)
    if (!task) return

    // Отримуємо максимальний порядок для нового статусу
    const tasksInNewStatus = tasksByProject.value.filter((t) => t.status === newStatus)
    const maxOrder =
      tasksInNewStatus.length > 0 ? Math.max(...tasksInNewStatus.map((t) => t.order)) : 0

    await updateTask(taskId, {
      status: newStatus,
      order: maxOrder + 1,
    })
  }

  const clearError = () => {
    error.value = null
  }

  const clearCurrentProject = () => {
    currentProjectId.value = null
  }

  // Синхронізація з LocalStorage
  syncWithLocalStorage(tasks, 'tasks')

  return {
    // State
    tasks,
    loading,
    error,
    currentProjectId,

    // Computed
    tasksByProject,
    tasksByStatus,
    assignees,

    // Actions
    fetchTasksByProject,
    createTask,
    updateTask,
    deleteTask,
    updateTaskOrder,
    updateTaskStatus,
    moveTaskBetweenStatuses,
    clearError,
    clearCurrentProject,
  }
})
