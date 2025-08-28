<script setup lang="ts"></script>

<template>
  <header>
    <div class="app-header">
      <nav class="app-nav">
        <RouterLink to="/"><h1>Шлях Проєкту</h1></RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style lang="scss" scoped>
.app-header {
  padding: 0 2rem;
}
.app-nav {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
</style>
