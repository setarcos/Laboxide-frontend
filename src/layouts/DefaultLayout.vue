<template>
  <!-- Make the root container exactly screen height and prevent it from scrolling -->
  <div class="flex flex-col h-screen max-h-screen overflow-hidden bg-base-200">

    <!-- 1. Banner - Ensure it doesn't shrink -->
    <AppBanner class="flex-shrink-0" />

    <!-- 2. Drawer Structure - Takes remaining vertical space, constrained height -->
    <!-- Added overflow-hidden -->
    <div class="drawer lg:drawer-open flex-1 overflow-hidden">
      <input id="my-drawer-toggle" type="checkbox" class="drawer-toggle" />

      <!-- Drawer Content (Main Area) -->
      <!-- Added h-full and overflow-hidden -->
      <div class="drawer-content flex flex-col h-full overflow-hidden">

        <!-- Main content area scrolls independently -->
        <main class="flex-1 overflow-y-auto p-4 lg:p-6 bg-base-100">
           <div class="max-w-7xl mx-auto">
              <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                  <component :is="Component" />
                </transition>
              </router-view>
           </div>
        </main>

      </div>

      <!-- Drawer Side (Sidebar) -->
      <!--
        Make the sidebar container scrollable if its content overflows.
        ADDED h-full here to explicitly constrain its height within the parent drawer.
      -->
      <div class="drawer-side h-full lg:border-r border-base-300 overflow-y-auto">
        <label for="my-drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
        <!-- Navbar itself uses h-full internally -->
        <AppNavbar />
      </div>

    </div> <!-- End of drawer -->
  </div> <!-- End of main flex container -->
</template>

<script setup>
import AppBanner from '@/components/AppBanner.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import { RouterView } from 'vue-router' // Make sure RouterView is imported
</script>

<style scoped>
/* Ensure no conflicting height/min-height styles here */
/* Basic fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
