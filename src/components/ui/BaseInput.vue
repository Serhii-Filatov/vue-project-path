<template>
  <div class="base-input">
    <label v-if="label" :for="id" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      class="base-input__field"
      :class="{ 'base-input__field--error': error }"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
    <span v-if="error" class="base-input__error">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'date'
  disabled?: boolean
  required?: boolean
  error?: string
  id?: string
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
  id: () => `input-${Math.random().toString(36).substr(2, 9)}`,
})

defineEmits<{
  'update:modelValue': [value: string]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()
</script>

<style lang="scss" scoped>
@use '@/styles/_variables.scss' as v;
.base-input {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &__label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  &__required {
    color: #ef4444;
  }

  &__field {
    padding: 0.75rem;
    border: 1px solid v.$color-border;
    border-radius: 0.375rem;
    font-size: 1rem;
    transition: border-color 0.2s ease-in-out;

    &:focus {
      @include v.focus-ring(v.$color-primary, 0.1);
    }

    &:disabled {
      background-color: v.$color-surface-muted;
      cursor: not-allowed;
    }

    &--error {
      border-color: v.$color-danger;

      &:focus {
        @include v.focus-ring(v.$color-danger, 0.1);
      }
    }
  }

  &__error {
    font-size: 0.75rem;
    color: v.$color-danger;
  }
}
</style>
