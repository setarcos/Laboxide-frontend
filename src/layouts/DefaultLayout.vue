<template>
  <div class="drawer lg:drawer-open">
    <input id="my-drawer-toggle" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content flex flex-col items-stretch">
      <!-- Top Banner -->
      <AppBanner />

      <!-- Page content here -->
      <main class="flex-1 overflow-y-auto p-4 lg:p-6 bg-base-100">
         <div class="max-w-7xl mx-auto"> <!-- Optional: Constrain content width -->
            <router-view v-slot="{ Component }">
              <transition name="fade" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
         </div>
      </main>

    </div>
    <div class="drawer-side lg:border-r border-base-300">
      <label for="my-drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
      <!-- Sidebar content here -->
      <AppNavbar />
    </div>
  </div>
</template>

<script setup>
import AppBanner from '@/components/AppBanner.vue'
import AppNavbar from '@/components/AppNavbar.vue'
</script>

<style scoped>
/* Scoped styles for the layout */
.drawer-content {
  min-height: 100vh; /* Ensure content area fills screen height */
}

/* Transition for router-view */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
