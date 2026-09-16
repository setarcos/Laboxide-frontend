<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { onMounted } from "vue";
import DefaultLayout from "./layouts/DefaultLayout.vue";
import { useAuthStore } from "./stores/auth";
import { useSemesterStore } from "./stores/semester";

// Single app shell; swap the component here if a route ever needs another layout.
const layout = DefaultLayout;

const authStore = useAuthStore();
const semesterStore = useSemesterStore();

onMounted(async () => {
  try {
    await Promise.all([
      authStore.checkAuth(),
      semesterStore.fetchCurrentSemester(),
    ]);
  } catch (error) {
    console.error("Failed to load initial application data:", error);
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
