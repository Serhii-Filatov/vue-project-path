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
      <label class="form-label">Опис проекту</label>
      <textarea
        v-model="form.description"
        class="form-textarea"
        placeholder="Введіть опис проекту"
        rows="4"
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
import type { Project, CreateProjectRequest } from '@/types/project'
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
  submit: [data: CreateProjectRequest]
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
  return isValid
}

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
@use '@/styles/_variables.scss' as v;
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
</style>
