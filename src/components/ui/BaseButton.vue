<template>
  <button
    :class="[
      'base-button',
      `base-button--${variant}`,
      `base-button--${size}`,
      { 'base-button--loading': loading },
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="base-button__loader"></span>
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style lang="scss" scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  white-space: nowrap; // keep text on one line

  // Normalize icon size and alignment
  :deep(svg) {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: inline-block;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  &--medium {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
  }

  &--large {
    padding: 1rem 2rem;
    font-size: 1.125rem;
  }

  &--primary {
    background-color: #3b82f6;
    color: white;

    &:hover:not(:disabled) {
      background-color: #2563eb;
    }
  }

  &--secondary {
    background-color: #6b7280;
    color: white;

    &:hover:not(:disabled) {
      background-color: #4b5563;
    }
  }

  &--danger {
    background-color: #ef4444;
    color: white;

    &:hover:not(:disabled) {
      background-color: #dc2626;
    }
  }

  &--success {
    background-color: #10b981;
    color: white;

    &:hover:not(:disabled) {
      background-color: #059669;
    }
  }

  &__loader {
    width: 1rem;
    height: 1rem;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
