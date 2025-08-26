<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

interface Task {
  id: number
  projectId: number
  title: string
  assignee: string
  status: string
  dueDate: string
}

const tasks = ref<Task[]>([])
const route = useRoute()

const fetchTasks = async () => {
  const res = await axios.get<Task[]>(`http://localhost:3000/tasks?projectId=${route.params.id}`)
  tasks.value = res.data
}

onMounted(fetchTasks)
</script>

<template>
  <div>
    <h2>Завдання проєкту</h2>
    <table cellspacing="0" cellpadding="8">
      <thead>
        <tr>
          <th>ID</th>
          <th>Назва</th>
          <th>Виконавець</th>
          <th>Статус</th>
          <th>Термін виконання</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="t in tasks" :key="t.id">
          <td>{{ t.id }}</td>
          <td>{{ t.title }}</td>
          <td>{{ t.assignee }}</td>
          <td>{{ t.status }}</td>
          <td>{{ t.dueDate }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<!--
  Заголовок + інформація про проект.

  Таблиця завдань (TasksTable.vue) з drag-and-drop.

  Кнопка «Додати завдання» → відкриває TaskForm.vue.

  Фільтрація по виконавцю, статусу.

  Сортування по терміну виконання і статусу.
-->
