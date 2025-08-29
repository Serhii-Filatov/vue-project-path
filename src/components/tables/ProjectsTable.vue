<template>
  <div class="projects-table">
    <!-- Фільтри -->
    <div class="table-filters">
      <div class="filter-group">
        <BaseInput v-model="nameFilter" placeholder="Пошук за назвою..." @input="updateFilters" />
      </div>
      <div class="filter-group">
        <BaseSelect
          :model-value="statusFilter"
          :options="[
            { value: '', label: 'Всі статуси' },
            { value: 'active', label: 'Активні' },
            { value: 'completed', label: 'Завершені' },
            { value: 'on-hold', label: 'На паузі' },
            { value: 'cancelled', label: 'Скасовані' },
            { value: 'archived', label: 'Архівовані' },
          ]"
          @update:modelValue="
            (v: string) => {
              statusFilter = v
              updateFilters()
            }
          "
        />
      </div>
    </div>

    <!-- Таблиця -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width + 'px', minWidth: column.minWidth + 'px' }"
              class="table-header"
              @click="handleSort(column.key)"
            >
              <div class="header-content">
                <span>{{ column.label }}</span>
                <div v-if="column.sortable" class="sort-indicator">
                  <svg
                    v-if="sortConfig?.key === column.key"
                    :class="['sort-arrow', { 'sort-arrow--desc': sortConfig.direction === 'desc' }]"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </div>
                <div class="resize-handle" @mousedown="startResize($event, column.key)"></div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="project in sortedAndFilteredProjects" :key="project.id" class="table-row">
            <td @click="handleRowClick(project)">{{ project.id }}</td>
            <td @click="handleRowClick(project)">{{ project.name }}</td>
            <td @click="handleRowClick(project)">{{ project.taskCount }}</td>
            <td @click="handleRowClick(project)">
              <span :class="['status-badge', `status-badge--${project.status}`]">
                {{ getStatusLabel(project.status) }}
              </span>
            </td>
            <td @click="handleRowClick(project)">{{ formatDate(project.createdAt) }}</td>
            <td class="actions-cell">
              <div class="action-buttons">
                <button class="action-button" @click="openEditModal(project)" title="Редагувати">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button class="action-button" @click="openDeleteModal(project)" title="Видалити">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Edit Modal -->
    <AppModal
      :model-value="showEditModal"
      title="Редагувати проект"
      @update:model-value="showEditModal = false"
    >
      <ProjectForm
        :project="selectedProject || undefined"
        :loading="projectsStore.loading"
        @submit="handleEditProject"
        @cancel="showEditModal = false"
      />
    </AppModal>

    <!-- Delete Modal -->
    <AppModal
      :model-value="showDeleteModal"
      title="Видалити проект"
      :dense-header="true"
      @update:model-value="showDeleteModal = false"
    >
      <div class="delete-confirmation">
        <p>Ви впевнені, що хочете видалити проект "{{ selectedProject?.name }}"?</p>
        <div class="modal-actions">
          <BaseButton variant="secondary" @click="showDeleteModal = false"> Скасувати </BaseButton>
          <BaseButton
            variant="danger"
            :loading="projectsStore.loading"
            @click="handleDeleteProject"
          >
            Видалити
          </BaseButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Project, TableColumn } from '@/types/project'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ProjectForm from '@/components/forms/ProjectForm.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

const router = useRouter()
const projectsStore = useProjectsStore()

// State
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedProject = ref<Project | null>(null)
const nameFilter = ref('')
const statusFilter = ref('')
const resizing = ref(false)
const resizeColumn = ref<string | null>(null)
const startX = ref(0)
const startWidth = ref(0)

// Колонки таблиці
const columns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: 80, minWidth: 60 },
  { key: 'name', label: 'Назва проекту', sortable: true, width: 300, minWidth: 200 },
  { key: 'taskCount', label: 'Кількість завдань', sortable: true, width: 150, minWidth: 120 },
  { key: 'status', label: 'Статус', sortable: true, width: 150, minWidth: 120 },
  { key: 'createdAt', label: 'Дата створення', sortable: true, width: 200, minWidth: 150 },
  { key: 'actions', label: 'Дії', sortable: false, width: 100, minWidth: 100 },
]

// Computed
const sortedAndFilteredProjects = computed(() => projectsStore.sortedAndFilteredProjects)
const sortConfig = computed(() => projectsStore.sortConfig)

// Methods
const handleSort = (key: string) => {
  const currentSort = projectsStore.sortConfig
  let direction: 'asc' | 'desc' = 'asc'

  if (currentSort?.key === key) {
    direction = currentSort.direction === 'asc' ? 'desc' : 'asc'
  }

  projectsStore.setSortConfig({ key, direction })
}

const updateFilters = () => {
  projectsStore.setFilterConfig({
    name: nameFilter.value,
    status: statusFilter.value,
  })
}

const handleRowClick = (project: Project) => {
  router.push(`/projects/${project.id}`)
}

const openEditModal = (project: Project) => {
  selectedProject.value = project
  showEditModal.value = true
}

const openDeleteModal = (project: Project) => {
  selectedProject.value = project
  showDeleteModal.value = true
}

const handleEditProject = async (projectData: { name: string; description: string }) => {
  if (!selectedProject.value) return

  try {
    await projectsStore.updateProject(selectedProject.value.id, projectData)
    showEditModal.value = false
  } catch (error) {
    console.error('Error updating project:', error)
  }
}

const handleDeleteProject = async () => {
  if (!selectedProject.value) return

  try {
    await projectsStore.deleteProject(selectedProject.value.id)
    showDeleteModal.value = false
  } catch (error) {
    console.error('Error deleting project:', error)
  }
}

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Активний',
    completed: 'Завершений',
    'on-hold': 'На паузі',
    cancelled: 'Скасований',
    archived: 'Архівований',
  }
  return labels[status as keyof typeof labels] || status
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('uk-UA')
}

// Resize functionality
const startResize = (event: MouseEvent, columnKey: string) => {
  event.preventDefault()
  resizing.value = true
  resizeColumn.value = columnKey
  startX.value = event.clientX
  startWidth.value = columns.find((col) => col.key === columnKey)?.width || 0

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResize)
}

const handleMouseMove = (event: MouseEvent) => {
  if (!resizing.value || !resizeColumn.value) return

  const deltaX = event.clientX - startX.value
  const newWidth = Math.max(
    startWidth.value + deltaX,
    columns.find((col) => col.key === resizeColumn.value)?.minWidth || 0,
  )

  const column = columns.find((col) => col.key === resizeColumn.value)
  if (column) {
    column.width = newWidth
  }
}

const stopResize = () => {
  resizing.value = false
  resizeColumn.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResize)
}

// Lifecycle
onMounted(() => {
  projectsStore.fetchProjects()
})
</script>

<style lang="scss" scoped>
@use '@/styles/_variables.scss' as v;
.projects-table {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: v.$color-surface;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  flex: 1;
  max-width: 300px;
}

.table-container {
  background: v.$color-surface;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: v.$color-surface-muted;
  border-bottom: 1px solid #e5e7eb;
  padding: 0;
  position: relative;
  user-select: none;

  &:hover {
    background: #f3f4f6;
  }
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  cursor: pointer;
  position: relative;
}

.sort-indicator {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

.sort-arrow {
  transition: transform 0.2s ease;

  &--desc {
    transform: rotate(180deg);
  }
}

.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: transparent;
  cursor: col-resize;

  &:hover {
    background: v.$color-primary;
  }
}

.table-row {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: v.$color-surface-muted;
  }

  td {
    padding: 1rem;
    vertical-align: middle;
  }
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;

  &--active {
    background: v.$status-active-bg;
    color: v.$status-active-fg;
  }

  &--completed {
    background: v.$status-completed-bg;
    color: v.$status-completed-fg;
  }

  &--on-hold {
    background: v.$status-onhold-bg;
    color: v.$status-onhold-fg;
  }

  &--cancelled {
    background: v.$status-cancelled-bg;
    color: v.$status-cancelled-fg;
  }

  &--archived {
    background: v.$status-archived-bg;
    color: v.$status-archived-fg;
  }
}

.actions-cell {
  padding: 8px !important;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--vt-c-text-2);
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: var(--vt-c-text-1);
    background: var(--vt-c-divider-light);
  }
}

.delete-confirmation {
  padding: 16px;
  text-align: center;

  p {
    margin-bottom: 24px;
  }
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
