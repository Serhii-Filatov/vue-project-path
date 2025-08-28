<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projectsStore'
import { useTasksStore } from '@/stores/tasksStore'
import type { ProjectStatus } from '@/types/project'
import BaseButton from '@/components/ui/BaseButton.vue'
import TasksTable from '@/components/tables/TasksTable.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const tasksStore = useTasksStore()

const projectId = route.params.id as string

// Control for create task modal in TasksTable
const showCreateTask = ref(false)

// Computed
const project = computed(() => projectsStore.projects.find((p) => p.id === projectId))
const loading = computed(() => projectsStore.loading)

const updateProjectStatus = (v: string) => {
  if (project.value) {
    projectsStore.updateProject(project.value.id, { status: v as ProjectStatus })
  }
}

// Methods
const getStatusLabel = (status: ProjectStatus) => {
  const labels = {
    active: 'Активний',
    completed: 'Завершений',
    'on-hold': 'На паузі',
    cancelled: 'Скасований',
    archived: 'Архівований',
  }
  return labels[status] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Lifecycle
onMounted(async () => {
  if (!project.value) {
    await projectsStore.fetchProjects()
  }
  await tasksStore.fetchTasksByProject(projectId)
})

onUnmounted(() => {
  tasksStore.clearCurrentProject()
})
</script>

<template>
  <div class="project-details-page">
    <!-- Header з інформацією про проект -->
    <div class="project-header">
      <div class="header-content container-1440">
        <div class="back-button" @click="router.back()">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Назад до проектів
        </div>

        <div v-if="project" class="project-info">
          <div class="project-header-row">
            <h1 class="project-title">{{ project.name }}</h1>
            <div class="project-actions">
              <BaseSelect
                :model-value="project?.status || ''"
                :options="[
                  { value: 'active', label: 'Активний' },
                  { value: 'completed', label: 'Завершений' },
                  { value: 'on-hold', label: 'На паузі' },
                  { value: 'cancelled', label: 'Скасований' },
                  { value: 'archived', label: 'Архівований' },
                ]"
                size="medium"
                @update:modelValue="updateProjectStatus"
              />
              <BaseButton size="medium" @click="showCreateTask = true"
                ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line></svg
                >Додати завдання</BaseButton
              >
            </div>
          </div>
          <p class="project-description">{{ project.description }}</p>

          <div class="project-meta">
            <div class="meta-item">
              <span class="meta-label">Статус:</span>
              <span :class="['status-badge', `status-badge--${project.status}`]">
                {{ getStatusLabel(project.status) }}
              </span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Створено:</span>
              <span>{{ formatDate(project.createdAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Завдань:</span>
              <span>{{ project.taskCount }}</span>
            </div>
          </div>
        </div>

        <div v-else-if="loading" class="loading-placeholder">
          <div class="loading-spinner"></div>
          <p>Завантаження проекту...</p>
        </div>

        <div v-else class="error-placeholder">
          <p>Проект не знайдено</p>
        </div>
      </div>
    </div>

    <div v-if="project" class="tasks-section container-1440">
      <TasksTable
        :project-id="projectId"
        :show-create="showCreateTask"
        @update:show-create="(v: boolean) => (showCreateTask = v)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.project-details-page {
  min-height: 100vh;
  background: #f9fafb;
}

.container-1440 {
  padding: 0 2rem;
  max-width: 1440px;
  margin: 0 auto;
}

.project-header {
  margin-bottom: 2rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-text-light);
  cursor: pointer;
  margin-bottom: 1rem;

  &:hover {
    color: var(--color-text);
  }
}

.project-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.project-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;

  :deep(.base-select) {
    min-width: 200px;
  }
}

.project-info {
  .project-title {
    font-size: 2rem;
    margin: 0 0 1rem;
  }

  .project-description {
    font-size: 1.1rem;
    color: var(--color-text-light);
    margin: 0 0 1.5rem;
  }
}

.project-meta {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .meta-label {
    color: var(--color-text-light);
  }
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.9rem;

  &--active {
    background: #dbeafe;
    color: #1d4ed8;
  }

  &--completed {
    background: #d1fae5;
    color: #065f46;
  }

  &--on-hold {
    background: #fef3c7;
    color: #92400e;
  }

  &--cancelled {
    background: #fee2e2;
    color: #991b1b;
  }

  &--archived {
    background: #f3f4f6;
    color: #374151;
  }
}

.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--color-border);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.error-placeholder {
  text-align: center;
  color: var(--color-error);
  padding: 2rem;
}

.tasks-section {
  margin-top: 2rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
