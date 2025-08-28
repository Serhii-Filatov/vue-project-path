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
        <BaseInput
          v-model="form.assignee"
          label="Виконавець"
          placeholder="Введіть ім'я виконавця"
          required
          :error="errors.assignee"
        />
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
import { reactive, computed } from 'vue'
import type { Task, TaskStatus } from '@/types/task'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

interface Props {
  projectId: string
  task?: Task
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  submit: [
    data: {
      projectId: string
      title: string
      description: string
      assignee: string
      status: TaskStatus
      dueDate: string
    },
  ]
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
  color: #ef4444;
}

.form-textarea {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &--error {
    border-color: #ef4444;

    &:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}

.form-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease-in-out;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &--error {
    border-color: #ef4444;

    &:focus {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}

.form-error {
  font-size: 0.75rem;
  color: #ef4444;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
}
</style>
