<template>
  <form @submit.prevent="handleSubmit" class="project-form">
    <div class="form-group">
      <BaseInput
        v-model="form.name"
        label="Назва проекту"
        placeholder="Введіть назву проекту"
        required
        :error="errors.name"
      />
    </div>

    <div class="form-group">
      <label class="form-label">
        Опис проекту
        <span class="required">*</span>
      </label>
      <textarea
        v-model="form.description"
        class="form-textarea"
        placeholder="Введіть опис проекту"
        rows="4"
        required
        :class="{ 'form-textarea--error': errors.description }"
      ></textarea>
      <span v-if="errors.description" class="form-error">{{ errors.description }}</span>
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
import type { Project } from '@/types/project'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

interface Props {
  project?: Project
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  submit: [data: { name: string; description: string }]
  cancel: []
}>()

// Form state
const form = reactive({
  name: props.project?.name || '',
  description: props.project?.description || '',
})

const errors = reactive({
  name: '',
  description: '',
})

const isEditing = computed(() => !!props.project)

// Validation
const validateForm = () => {
  let isValid = true
  errors.name = ''
  errors.description = ''

  if (!form.name.trim()) {
    errors.name = "Назва проекту обов'язкова"
    isValid = false
  }

  if (!form.description.trim()) {
    errors.description = "Опис проекту обов'язковий"
    isValid = false
  }

  return isValid
}

// Submit handler
const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', {
      name: form.name.trim(),
      description: form.description.trim(),
    })
  }
}
</script>

<style lang="scss" scoped>
.project-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
