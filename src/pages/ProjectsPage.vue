<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

interface Project {
  id: number
  name: string
  description: string
  taskCount: number
  status: string
  createdAt: string
}

const projects = ref<Project[]>([])
const router = useRouter()

const fetchProjects = async () => {
  const res = await axios.get<Project[]>('http://localhost:3000/projects')
  projects.value = res.data
}

const openProject = (id: number) => {
  router.push(`/projects/${id}`)
}

onMounted(fetchProjects)
</script>

<template>
  <div>
    <h1>Список проєктів</h1>
    <table cellspacing="0" cellpadding="8">
      <thead>
        <tr>
          <th>ID</th>
          <th>Назва</th>
          <th>Кількість завдань</th>
          <th>Статус</th>
          <th>Дата створення</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in projects" :key="p.id" @click="openProject(p.id)" style="cursor: pointer">
          <td>{{ p.id }}</td>
          <td>{{ p.name }}</td>
          <td>{{ p.taskCount }}</td>
          <td>{{ p.status }}</td>
          <td>{{ p.createdAt }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<!--
  Таблиця проектів (ID, Назва, Кількість завдань, Статус, Дата створення).

  Сортування, фільтрація, зміна ширини колонок.

  Кнопка «Додати проект» → відкриває ProjectForm.vue.

  Клік по проекту → перехід на ProjectDetailsPage.vue.

  Опціонально — діаграма зі статистикою.
-->
