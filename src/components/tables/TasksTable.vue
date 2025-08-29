<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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
const sortKey = ref<'none' | 'dueDate' | 'status'>('none')
const sortDirection = ref<'asc' | 'desc'>('asc')
const showCreateModal = ref(!!props.showCreate)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedTask = ref<Task | null>(null)

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

const orderedStatuses = () => {
  if (sortKey.value !== 'status') return taskStatuses
  const copy = [...taskStatuses]
  copy.sort((a, b) => {
    const res = a.label.localeCompare(b.label)
    return sortDirection.value === 'asc' ? res : -res
  })
  return copy
}

onMounted(async () => {
  await tasksStore.fetchTasksByProject(props.projectId)
})

const getTasksByStatus = (status: TaskStatus) => {
  const filtered = tasksStore.tasksByProject.filter(
    (task) =>
      task.status === status &&
      (!assigneeFilter.value ||
        task.assignee.toLowerCase().includes(assigneeFilter.value.toLowerCase())) &&
      (!statusFilter.value || task.status === statusFilter.value),
  )
  if (sortKey.value === 'dueDate') {
    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.dueDate).getTime()
      const bTime = new Date(b.dueDate).getTime()
      const res = aTime - bTime
      return sortDirection.value === 'asc' ? res : -res
    })
  }
  // default order from store (by order field)
  return filtered
}

type DragEndEvent = {
  item?: { __draggable_context?: { element?: Task } }
  to?: { dataset?: { status?: string } }
  from?: { dataset?: { status?: string } }
  oldIndex?: number
  newIndex?: number
}

const handleDragEnd = (evt: DragEndEvent) => {
  const task = evt?.item?.__draggable_context?.element as Task
  const toStatus = (evt?.to?.dataset?.status || '') as TaskStatus
  const fromStatus = (evt?.from?.dataset?.status || '') as TaskStatus
  const oldIndex = typeof evt?.oldIndex === 'number' ? evt.oldIndex : -1
  const newIndex = typeof evt?.newIndex === 'number' ? evt.newIndex : -1

  if (!task || !toStatus) return

  // Disable manual ordering when sorted by due date
  if (sortKey.value !== 'none') {
    // If moved across columns while sorted, just move status keeping order at end
    if (fromStatus !== toStatus) {
      tasksStore.moveTaskBetweenStatuses(task.id, toStatus)
    }
    return
  }

  if (fromStatus !== toStatus) {
    // Move to new status and place at end
    tasksStore.moveTaskBetweenStatuses(task.id, toStatus)
    return
  }

  // Reorder within same column using old/new indexes
  if (oldIndex >= 0 && newIndex >= 0) {
    const columnTasks = tasksStore.tasksByProject
      .filter((t) => t.status === toStatus)
      .sort((a, b) => a.order - b.order)

    const [moved] = columnTasks.splice(oldIndex, 1)
    columnTasks.splice(newIndex, 0, moved)
    tasksStore.updateTaskOrder(columnTasks)
  }
}

const handleCreateTask = async (taskData: CreateTaskRequest) => {
  await tasksStore.createTask(taskData)
  showCreateModal.value = false
}

const openEditTask = (task: Task) => {
  selectedTask.value = task
  showEditModal.value = true
}

const openDeleteTask = (task: Task) => {
  selectedTask.value = task
  showDeleteModal.value = true
}

const handleEditTask = async (data: CreateTaskRequest) => {
  if (!selectedTask.value) return
  await tasksStore.updateTask(selectedTask.value.id, {
    title: data.title,
    description: data.description,
    assignee: data.assignee,
    status: data.status,
    dueDate: data.dueDate,
  })
  showEditModal.value = false
}

const handleDeleteTask = async () => {
  if (!selectedTask.value) return
  await tasksStore.deleteTask(selectedTask.value.id)
  showDeleteModal.value = false
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
      <div class="filter-group" style="max-width: 220px">
        <BaseSelect
          :model-value="sortKey"
          :options="[
            { value: 'none', label: 'Без сортування' },
            { value: 'dueDate', label: 'За терміном' },
            { value: 'status', label: 'За статусом' },
          ]"
          @update:modelValue="(v: string) => (sortKey = v as any)"
        />
      </div>
      <div class="filter-group" v-if="sortKey !== 'none'" style="max-width: 180px">
        <BaseSelect
          :model-value="sortDirection"
          :options="[
            { value: 'asc', label: 'За зростанням' },
            { value: 'desc', label: 'За спаданням' },
          ]"
          @update:modelValue="(v: string) => (sortDirection = v as any)"
        />
      </div>
    </div>

    <!-- Kanban Board -->
    <div class="kanban-board">
      <div
        v-for="status in orderedStatuses()"
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
          :disabled="sortKey !== 'none'"
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
                <span class="task-due-date"> Дедлайн: {{ formatDate(task.dueDate) }} </span>
                <div class="task-actions" @click.stop>
                  <button class="action-button" title="Редагувати" @click="openEditTask(task)">
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
                  <button class="action-button" title="Видалити" @click="openDeleteTask(task)">
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

    <!-- Edit Task Modal -->
    <AppModal v-model="showEditModal" title="Редагувати завдання" :dense-header="true">
      <TaskForm
        v-if="selectedTask"
        :project-id="projectId"
        :task="selectedTask || undefined"
        @submit="handleEditTask"
        @cancel="showEditModal = false"
      />
    </AppModal>

    <!-- Delete Task Modal -->
    <AppModal v-model="showDeleteModal" title="Видалити завдання" :dense-header="true">
      <div class="delete-confirmation">
        <p>
          Ви впевнені, що хочете видалити завдання
          <strong v-if="selectedTask">"{{ selectedTask.title }}"</strong>?
        </p>
        <div class="modal-actions modal-actions--center">
          <BaseButton variant="secondary" @click="showDeleteModal = false"> Скасувати </BaseButton>
          <BaseButton variant="danger" :loading="tasksStore.loading" @click="handleDeleteTask">
            Видалити
          </BaseButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/_variables.scss' as v;
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
  background: v.$color-surface;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.filter-group {
  min-width: 200px;
  flex: 1;
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
  background: v.$status-onhold-bg;
  color: v.$status-onhold-fg;
  border-color: #fcd34d;
}
.kanban-column[data-status='in_progress'] .task-count {
  background: v.$status-active-bg;
  color: v.$status-active-fg;
  border-color: #93c5fd;
}
.kanban-column[data-status='done'] .task-count {
  background: v.$status-completed-bg;
  color: v.$status-completed-fg;
  border-color: #86efac;
}

.task-list {
  min-height: 120px;
}

.task-card {
  background-color: v.$color-surface;
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
.task-card[data-status='to_do']::before,
.task-status--to_do::before {
  background: #f59e0b;
}
.task-card[data-status='in_progress']::before,
.task-status--in_progress::before {
  background: v.$color-primary;
}
.task-card[data-status='done']::before,
.task-status--done::before {
  background: v.$color-success;
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

.task-actions {
  display: flex;
  gap: 8px;
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

.task-due-date {
  color: var(--color-text-light);
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
  gap: 16px;
}

.modal-actions--center {
  justify-content: center;
}

.tasks-table .task-card .task-status {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;

  &--to_do {
    background: v.$status-onhold-bg;
    color: v.$status-onhold-fg;
  }

  &--in_progress {
    background: v.$status-active-bg;
    color: v.$status-active-fg;
  }

  &--done {
    background: v.$status-completed-bg;
    color: v.$status-completed-fg;
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
