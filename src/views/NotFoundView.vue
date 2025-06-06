<template>
  <div
    class="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center"
  >
    <h1 class="text-6xl font-bold text-primary mb-4">404</h1>
    <p class="text-2xl mb-6">Oops! Page Not Found</p>
    <p class="text-base-content/70 mb-8">
      The page you are looking for might have been removed, had its name
      changed, or is temporarily unavailable.
    </p>
    <router-link :to="{ name: 'Dashboard' }" class="btn btn-primary">
      Go to Dashboard
    </router-link>
  </div>
</template>

<script setup>
// No script logic needed for a static 404 page
</script>

<style scoped>
/* Optional specific styles for 404 page */
</style>
