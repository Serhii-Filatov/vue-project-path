import { createRouter, createWebHistory } from 'vue-router'
import ProjectsPage from '@/pages/ProjectsPage.vue'
import ProjectDetailsPage from '@/pages/ProjectDetailsPage.vue'

const routes = [
  { path: '/', redirect: '/projects' },
  { path: '/projects', component: ProjectsPage },
  { path: '/projects/:id', component: ProjectDetailsPage },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
