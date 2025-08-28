<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useTasksStore } from '@/stores/tasksStore'
import BaseInput from '@/components/ui/BaseInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import TaskForm from '@/components/forms/TaskForm.vue'
import Draggable from 'vuedraggable'
import type { Task, TaskStatus, CreateTaskRequest } from '@/types/task'
import BaseSelect from '@/components/ui/BaseSelect.vue'

const props = defineProps<{
  projectId: string
  showCreate?: boolean
}>()

const emit = defineEmits<{
  'update:show-create': [value: boolean]
}>()

const tasksStore = useTasksStore()
const assigneeFilter = ref('')
const statusFilter = ref('')
const showCreateModal = ref(!!props.showCreate)

// keep modal reactive to parent
watch(
  () => props.showCreate,
  (v) => {
    if (typeof v === 'boolean') showCreateModal.value = v
  },
)
watch(showCreateModal, (v) => emit('update:show-create', v))

const taskStatuses = [
  { key: 'to_do' as TaskStatus, label: 'To Do' },
  { key: 'in_progress' as TaskStatus, label: 'In Progress' },
  { key: 'done' as TaskStatus, label: 'Done' },
]

onMounted(async () => {
  await tasksStore.fetchTasksByProject(props.projectId)
})

const getTasksByStatus = (status: TaskStatus) => {
  return tasksStore.tasksByProject.filter(
    (task) =>
      task.status === status &&
      (!assigneeFilter.value ||
        task.assignee.toLowerCase().includes(assigneeFilter.value.toLowerCase())) &&
      (!statusFilter.value || task.status === statusFilter.value),
  )
}

const handleDragEnd = (evt: {
  item: { __draggable_context: { element: Task } }
  to: { dataset: { status: TaskStatus } }
}) => {
  const task = evt.item.__draggable_context.element
  const newStatus = evt.to.dataset.status as TaskStatus
  if (task && newStatus) {
    tasksStore.updateTaskStatus(task.id, newStatus)
  }
}

const handleCreateTask = async (taskData: CreateTaskRequest) => {
  await tasksStore.createTask(taskData)
  showCreateModal.value = false
}

const updateFilters = () => {
  // Фильтры автоматически применяются через computed свойства
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const getStatusLabel = (status: TaskStatus) => {
  return taskStatuses.find((s) => s.key === status)?.label || status
}

const handleTaskClick = (task: Task) => {
  // Добавьте здесь логику для обработки клика по задаче
  console.log('Task clicked:', task)
}

// assignees no longer needed; TaskForm uses free-text input
</script>

<template>
  <div class="tasks-table">
    <!-- Фільтри -->
    <div class="table-filters">
      <div class="filter-group">
        <BaseInput
          v-model="assigneeFilter"
          placeholder="Пошук за виконавцем..."
          @input="updateFilters"
        />
      </div>
      <div class="filter-group">
        <BaseSelect
          :model-value="statusFilter"
          :options="[
            { value: '', label: 'Всі статуси' },
            { value: 'to_do', label: 'To Do' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'done', label: 'Done' },
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

    <!-- Kanban Board -->
    <div class="kanban-board">
      <div
        v-for="status in taskStatuses"
        :key="status.key"
        class="kanban-column"
        :data-status="status.key"
      >
        <div class="column-header">
          <h3 class="column-title">{{ status.label }}</h3>
          <span class="task-count">{{ getTasksByStatus(status.key).length }}</span>
        </div>

        <Draggable
          :list="getTasksByStatus(status.key)"
          :group="{ name: 'tasks', pull: true, put: true }"
          item-key="id"
          class="task-list"
          :data-status="status.key"
          @end="handleDragEnd"
        >
          <template #item="{ element: task }">
            <div class="task-card" :data-status="task.status" @click="handleTaskClick(task)">
              <div class="task-header">
                <span class="task-id">#{{ task.id }}</span>
                <span :class="['task-status', `task-status--${task.status}`]">
                  {{ getStatusLabel(task.status) }}
                </span>
              </div>
              <h4 class="task-title">{{ task.title }}</h4>
              <p class="task-assignee">{{ task.assignee }}</p>
              <div class="task-footer">
                <span class="task-due-date">
                  {{ formatDate(task.dueDate) }}
                </span>
              </div>
            </div>
          </template>
        </Draggable>
      </div>
    </div>

    <!-- Кнопка додавання завдання перенесена у шапку сторінки -->

    <!-- Модальне вікно створення завдання -->
    <AppModal v-model="showCreateModal" title="Створити нове завдання">
      <TaskForm
        :project-id="projectId"
        @submit="handleCreateTask"
        @cancel="showCreateModal = false"
      />
    </AppModal>
  </div>
</template>

<style lang="scss" scoped>
.tasks-table {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: center;
  background: #ffffff;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.filter-group {
  min-width: 200px;
  flex: 1;
}

.filter-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: #fff;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.kanban-column {
  background-color: #eef2f7;
  border-radius: 8px;
  padding: 1rem;
  min-height: 400px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.column-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.task-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid transparent;
}

/* Per-status coloring for the count badge */
.kanban-column[data-status='to_do'] .task-count {
  background: #fef3c7;
  color: #92400e;
  border-color: #fcd34d;
}
.kanban-column[data-status='in_progress'] .task-count {
  background: #dbeafe;
  color: #1d4ed8;
  border-color: #93c5fd;
}
.kanban-column[data-status='done'] .task-count {
  background: #d1fae5;
  color: #065f46;
  border-color: #86efac;
}

.task-list {
  min-height: 120px;
}

.task-card {
  background-color: #ffffff;
  border: 1px solid var(--color-background-mute);
  border-radius: 8px;
  padding: 1rem 1rem 1rem 0.75rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  }
}

/* Status left stripe */
.task-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: transparent;
}
.task-status--to_do ~ .task-footer,
.task-status--in_progress ~ .task-footer,
.task-status--done ~ .task-footer {
  /* placeholder to keep order if needed */
}
.task-card[data-status='to_do']::before,
.task-status--to_do::before {
  background: #f59e0b;
}
.task-card[data-status='in_progress']::before,
.task-status--in_progress::before {
  background: #3b82f6;
}
.task-card[data-status='done']::before,
.task-status--done::before {
  background: #10b981;
}

/* Empty column state */
.task-list:empty::after {
  content: 'Немає завдань';
  display: block;
  text-align: center;
  color: #94a3b8;
  padding: 0.5rem 0;
}

.task-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.task-id {
  color: var(--color-text-light);
  font-size: 0.9rem;
}

.task-title {
  font-size: 1rem;
  margin: 0 0 0.5rem;
}

.task-assignee {
  font-size: 0.9rem;
  color: var(--color-text-light);
  margin: 0 0 0.5rem;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.task-due-date {
  color: var(--color-text-light);
}

.table-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}

.tasks-table .task-card .task-status {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;

  &--to_do {
    background: #fef3c7;
    color: #92400e;
  }

  &--in_progress {
    background: #dbeafe;
    color: #1d4ed8;
  }

  &--done {
    background: #d1fae5;
    color: #065f46;
  }
}

select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b7280' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1em;
  padding-right: 2.25rem;
}
select::-ms-expand {
  display: none;
}
</style>
