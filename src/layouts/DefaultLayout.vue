<template>
  <div class="flex flex-col min-h-screen bg-base-200"> <!-- Use flex-col for vertical layout -->

    <AppBanner />

    <div class="drawer lg:drawer-open flex-1">
      <input id="my-drawer-toggle" type="checkbox" class="drawer-toggle" />
      <div class="drawer-content flex flex-col items-stretch">
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
      <!-- The AppNavbar component inside should handle its own height/scrolling -->
      <div class="drawer-side lg:border-r border-base-300">
        <label for="my-drawer-toggle" aria-label="close sidebar" class="drawer-overlay"></label>
        <AppNavbar />
      </div>
    </div>
  </div>
</template>

<script setup>
import AppBanner from '@/components/AppBanner.vue'
import AppNavbar from '@/components/AppNavbar.vue'
</script>

<style scoped>
/* Scoped styles for the layout */

/* Ensure drawer fills height (though flex-1 should handle this) */
.drawer {
  /* height: calc(100vh - H); */ /* H = banner height, potentially complex */
  /* flex-1 on the drawer container is usually sufficient with flex-col parent */
}

/* Make sure sidebar content is scrollable if it exceeds height */
/* AppNavbar already uses flex-col and h-full, which should work */
/* If sidebar content overflows strangely, you might need: */
/*
.drawer-side {
  overflow-y: auto;
}
.drawer-side > :not(.drawer-overlay) {
   height: 100%;
}
*/


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
