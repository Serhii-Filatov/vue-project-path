<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProjectsStore } from '@/stores/projectsStore'
import ProjectsTable from '@/components/tables/ProjectsTable.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ProjectForm from '@/components/forms/ProjectForm.vue'

const projectsStore = useProjectsStore()

// Load projects when component mounts
onMounted(() => {
  projectsStore.fetchProjects()
})

// Modal control
const showCreateModal = ref(false)

// Computed
const activeProjectsCount = computed(
  () => projectsStore.projects.filter((project) => project.status === 'active').length,
)

const completedProjectsCount = computed(
  () => projectsStore.projects.filter((project) => project.status === 'completed').length,
)

const totalTasksCount = computed(() =>
  projectsStore.projects.reduce((total, project) => total + project.taskCount, 0),
)

const handleCreateProject = async (projectData: { name: string; description: string }) => {
  await projectsStore.createProject(projectData)
  showCreateModal.value = false
}
</script>

<template>
  <div class="projects-page">
    <div class="page-header header-row">
      <div>
        <h1 class="page-title">Управління проектами</h1>
        <p class="page-description">Переглядайте та керуйте вашими проектами та завданнями</p>
      </div>
      <div class="header-actions">
        <BaseButton @click="showCreateModal = true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Додати проект
        </BaseButton>
      </div>
    </div>

    <!-- Статистика -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ projectsStore.projects.length }}</h3>
          <p class="stat-label">Всього проектів</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ activeProjectsCount }}</h3>
          <p class="stat-label">Активних проектів</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ completedProjectsCount }}</h3>
          <p class="stat-label">Завершених проектів</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
        </div>
        <div class="stat-content">
          <h3 class="stat-value">{{ totalTasksCount }}</h3>
          <p class="stat-label">Всього завдань</p>
        </div>
      </div>
    </div>

    <!-- Таблиця проектів -->
    <ProjectsTable />

    <!-- Модальне вікно створення проекту -->
    <AppModal v-model="showCreateModal" title="Створити новий проект">
      <ProjectForm @submit="handleCreateProject" @cancel="showCreateModal = false" />
    </AppModal>

    <!-- Повідомлення про помилки -->
    <div v-if="projectsStore.error" class="error-message">
      <div class="error-content">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span>{{ projectsStore.error }}</span>
        <button @click="projectsStore.clearError()" class="error-close">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading indicator -->
    <div v-if="projectsStore.loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Завантаження проектів...</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/_variables.scss' as v;
.projects-page {
  padding: 2rem;
  max-width: 1440px;
  margin: 0 auto;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: v.$color-text;
  margin: 0 0 0.5rem 0;
}

.page-description {
  font-size: 1.125rem;
  color: v.$color-text-light;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: v.$color-surface;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  /* hover-эффект убран */
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #f3f4f6;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: v.$color-text-light;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: v.$color-text;
  margin: 0 0 0.25rem 0;
}

.stat-label {
  font-size: 0.875rem;
  color: v.$color-text-light;
  margin: 0;
}

.error-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  color: #991b1b;
  z-index: 1000;
  max-width: 400px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #991b1b;
  padding: 0.25rem;
  border-radius: 0.25rem;
  margin-left: auto;

  &:hover {
    background: rgba(153, 27, 27, 0.1);
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .projects-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}
</style>
