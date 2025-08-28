<script setup lang="ts">
import { computed } from 'vue'

interface OptionItem {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue?: string
    options: OptionItem[]
    placeholder?: string
    disabled?: boolean
    required?: boolean
    name?: string
    id?: string
    size?: 'small' | 'medium' | 'large'
  }>(),
  {
    modelValue: '',
    placeholder: '',
    disabled: false,
    required: false,
    size: 'medium',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const internalValue = computed({
  get: () => props.modelValue ?? '',
  set: (v: string) => emit('update:modelValue', v),
})
</script>

<template>
  <select
    v-model="internalValue"
    class="base-select"
    :class="`base-select--${size}`"
    :name="name"
    :id="id"
    :disabled="disabled"
    :required="required"
  >
    <option v-if="placeholder" disabled value="">{{ placeholder }}</option>
    <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>

<style scoped>
.base-select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: #fff;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b7280' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpolyline points='6,9 12,15 18,9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1em;
}

.base-select--small {
  padding: 0.5rem 2.25rem 0.5rem 0.75rem;
  font-size: 0.875rem;
}
.base-select--medium {
  padding: 0.75rem 2.25rem 0.75rem 0.75rem; /* matches BaseButton medium */
  font-size: 1rem;
}
.base-select--large {
  padding: 1rem 2.5rem 1rem 0.75rem;
  font-size: 1.125rem;
}

.base-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

select.base-select::-ms-expand {
  display: none;
}
</style>
