<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { computed, onMounted } from "vue";
import DefaultLayout from "./layouts/DefaultLayout.vue";
import { useAuthStore } from "./stores/auth";
import { useSemesterStore } from "./stores/semester";

// Basic layout switching, defaults to DefaultLayout
// You could expand this based on route meta fields if needed
const layout = computed(() => {
  // Example: if (route.meta.layout === 'Auth') return AuthLayout;
  return DefaultLayout;
});

const authStore = useAuthStore();
const semesterStore = useSemesterStore();

onMounted(async () => {
  // Now the await calls are inside an async function, which is always allowed.
  try {
    // You could run these in parallel to speed things up
    await Promise.all([
      authStore.checkAuth(),
      semesterStore.fetchCurrentSemester(),
    ]);
  } catch (error) {
    console.error("Failed to load initial application data:", error);
    // Handle the error, maybe show an error message to the user
  }
});
</script>

<style>
/* Add any truly global styles affecting the entire app shell if needed */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
