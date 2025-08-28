import { watch } from 'vue'
import type { Ref } from 'vue'

export function syncWithLocalStorage<T>(ref: Ref<T>, key: string) {
  // Завантажуємо дані з LocalStorage при ініціалізації
  const stored = localStorage.getItem(key)
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      ref.value = parsed
    } catch (error) {
      console.error(`Error parsing localStorage data for key "${key}":`, error)
    }
  }

  // Синхронізуємо зміни з LocalStorage
  watch(
    ref,
    (newValue) => {
      try {
        localStorage.setItem(key, JSON.stringify(newValue))
      } catch (error) {
        console.error(`Error saving to localStorage for key "${key}":`, error)
      }
    },
    { deep: true },
  )
}
