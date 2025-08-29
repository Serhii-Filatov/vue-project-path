<template>
  <form @submit.prevent="handleSubmit" class="task-form">
    <div class="form-group">
      <BaseInput
        v-model="form.title"
        label="Назва завдання"
        placeholder="Введіть назву завдання"
        required
        :error="errors.title"
      />
    </div>

    <div class="form-group">
      <label class="form-label">
        Опис завдання
        <span class="required">*</span>
      </label>
      <textarea
        v-model="form.description"
        class="form-textarea"
        placeholder="Введіть опис завдання"
        rows="3"
        required
        :class="{ 'form-textarea--error': errors.description }"
      ></textarea>
      <span v-if="errors.description" class="form-error">{{ errors.description }}</span>
    </div>

    <div class="form-row">
      <div class="form-group">
        <template v-if="availableAssignees.length > 0 && !useCustomAssignee">
          <label class="form-label">
            Виконавець
            <span class="required">*</span>
          </label>
          <BaseSelect
            :model-value="form.assignee"
            :options="availableAssignees.map((a) => ({ value: a, label: a }))"
            required
            @update:modelValue="(v: string) => (form.assignee = v)"
          />
          <button type="button" class="assignee-toggle" @click="useCustomAssignee = true">
            Додати нового виконавця
          </button>
        </template>
        <template v-else>
          <BaseInput
            v-model="form.assignee"
            label="Виконавець"
            placeholder="Введіть ім'я виконавця"
            required
            :error="errors.assignee"
          />
          <button
            v-if="availableAssignees.length > 0"
            type="button"
            class="assignee-toggle"
            @click="useCustomAssignee = false"
          >
            Обрати з існуючих
          </button>
        </template>
        <span v-if="errors.assignee" class="form-error">{{ errors.assignee }}</span>
      </div>

      <div class="form-group">
        <BaseInput
          v-model="form.dueDate"
          label="Термін виконання"
          type="date"
          required
          :error="errors.dueDate"
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">
        Статус
        <span class="required">*</span>
      </label>
      <BaseSelect
        :model-value="form.status"
        :options="[
          { value: 'to_do', label: 'To Do' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'done', label: 'Done' },
        ]"
        @update:modelValue="(v: string) => (form.status = v as TaskStatus)"
        required
      />
      <span v-if="errors.status" class="form-error">{{ errors.status }}</span>
    </div>

    <div class="form-actions">
      <BaseButton type="button" variant="secondary" @click="$emit('cancel')">
        Скасувати
      </BaseButton>
      <BaseButton type="submit" :loading="loading">
        {{ isEditing ? 'Оновити' : 'Створити' }}
      </BaseButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, computed, ref, watch } from 'vue'
import type { Task, TaskStatus, CreateTaskRequest } from '@/types/task'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { useTasksStore } from '@/stores/tasksStore'

interface Props {
  projectId: string
  task?: Task
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  submit: [data: CreateTaskRequest]
  cancel: []
}>()

// Form state
const form = reactive({
  title: props.task?.title || '',
  description: props.task?.description || '',
  assignee: props.task?.assignee || '',
  status: props.task?.status || ('to_do' as TaskStatus),
  dueDate: props.task?.dueDate ? new Date(props.task.dueDate).toISOString().split('T')[0] : '',
})

const errors = reactive({
  title: '',
  description: '',
  assignee: '',
  status: '',
  dueDate: '',
})

const isEditing = computed(() => !!props.task)

// Assignees for current project (if any). If none -> free text input
const tasksStore = useTasksStore()
const availableAssignees = computed(() => tasksStore.assignees)

// Allow choosing from list or entering a new name
const useCustomAssignee = ref(availableAssignees.value.length === 0)
watch(availableAssignees, (list) => {
  if (!list || list.length === 0) {
    useCustomAssignee.value = true
  }
})

// Validation
const validateForm = () => {
  let isValid = true
  errors.title = ''
  errors.description = ''
  errors.assignee = ''
  errors.status = ''
  errors.dueDate = ''

  if (!form.title.trim()) {
    errors.title = "Назва завдання обов'язкова"
    isValid = false
  }

  if (!form.description.trim()) {
    errors.description = "Опис завдання обов'язковий"
    isValid = false
  }

  if (!form.assignee) {
    errors.assignee = "Виконавець обов'язковий"
    isValid = false
  }

  if (!form.status) {
    errors.status = "Статус обов'язковий"
    isValid = false
  }

  if (!form.dueDate) {
    errors.dueDate = "Термін виконання обов'язковий"
    isValid = false
  }

  return isValid
}

// Submit handler
const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', {
      projectId: props.projectId,
      title: form.title.trim(),
      description: form.description.trim(),
      assignee: form.assignee,
      status: form.status,
      dueDate: form.dueDate,
    })
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/_variables.scss' as v;
.task-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.required {
  color: v.$color-danger;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid v.$color-border;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease-in-out;

  &:focus {
    @include v.focus-ring(v.$color-primary, 0.1);
  }

  &--error {
    border-color: v.$color-danger;

    &:focus {
      @include v.focus-ring(v.$color-danger, 0.1);
    }
  }
}

.form-error {
  font-size: 0.75rem;
  color: v.$color-danger;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.assignee-toggle {
  background: none;
  border: none;
  padding: 0;
  color: #3b82f6;
  cursor: pointer;
  margin-top: 0.25rem;
  align-self: flex-start;
}
</style>
