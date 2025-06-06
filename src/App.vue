<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from "vue";
import DefaultLayout from "./layouts/DefaultLayout.vue";
// Import other layouts if you create them (e.g., AuthLayout)

// Basic layout switching, defaults to DefaultLayout
// You could expand this based on route meta fields if needed
const layout = computed(() => {
  // Example: if (route.meta.layout === 'Auth') return AuthLayout;
  return DefaultLayout;
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
