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
          <tr
            v-for="project in sortedAndFilteredProjects"
            :key="project.id"
            class="table-row"
            @click="handleRowClick(project)"
          >
            <td>{{ project.id }}</td>
            <td>{{ project.name }}</td>
            <td>{{ project.taskCount }}</td>
            <td>
              <span :class="['status-badge', `status-badge--${project.status}`]">
                {{ getStatusLabel(project.status) }}
              </span>
            </td>
            <td>{{ formatDate(project.createdAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '@/stores/projectsStore'
import type { Project, TableColumn, SortConfig } from '@/types/project'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import ProjectForm from '@/components/forms/ProjectForm.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

const router = useRouter()
const projectsStore = useProjectsStore()

// State
const showCreateModal = ref(false)
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

const handleCreateProject = async (projectData: { name: string; description: string }) => {
  try {
    await projectsStore.createProject(projectData)
    showCreateModal.value = false
  } catch (error) {
    console.error('Error creating project:', error)
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
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  flex: 1;
  max-width: 300px;
}

.filter-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.table-container {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: #f9fafb;
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
    background: #3b82f6;
  }
}

.table-row {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f9fafb;
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

.table-actions {
  display: flex;
  justify-content: flex-end;
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* status-badge colors already defined below */
</style>
