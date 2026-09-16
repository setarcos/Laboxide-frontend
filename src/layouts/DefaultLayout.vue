<template>
  <!-- Make the root container exactly screen height and prevent it from scrolling -->
  <div class="flex flex-col h-screen max-h-screen overflow-hidden bg-base-200">
    <!-- 1. Banner - Ensure it doesn't shrink -->
    <AppBanner class="flex-shrink-0" />
    <!-- Assumes h-16 (4rem) -->

    <!-- 2. Drawer Structure - Takes remaining vertical space, constrained height -->
    <div class="drawer lg:drawer-open flex-1 overflow-hidden">
      <input id="my-drawer-toggle" type="checkbox" class="drawer-toggle" />

      <!-- Drawer Content (Main Area) -->
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
      <!-- No custom class needed on drawer-side itself for this -->
      <div
        class="drawer-side h-full lg:border-r border-base-300 overflow-y-auto"
      >
        <!--
           Overlay Label: Needs position adjustment on mobile when open.
           Kept custom class 'mobile-drawer-overlay'.
         -->
        <label
          for="my-drawer-toggle"
          aria-label="close sidebar"
          class="drawer-overlay mobile-drawer-overlay"
        ></label>
        <!--
           Navbar: It's the menu content. We'll target it via its own class or structure.
        -->
        <AppNavbar />
      </div>
    </div>
    <!-- End of drawer -->
  </div>
  <!-- End of main flex container -->
</template>

<script setup>
import AppBanner from "@/components/AppBanner.vue";
import AppNavbar from "@/components/AppNavbar.vue";
import { RouterView } from "vue-router";
</script>

<style scoped>
/* Basic fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/*
 * Mobile drawer positioning overrides (below the lg breakpoint).
 * The banner is h-16, i.e. 4rem.
 */
@media (max-width: 1023px) {
  /*
   * The transition lives outside the :checked state so it applies in both directions.
   */
  .drawer-side > .menu {
    transition-property: transform;
    transition-duration: 0.3s;
    transition-timing-function: ease-out;
  }

  /* Overlay positioning when drawer is open */
  .drawer-toggle:checked ~ .drawer-side > .mobile-drawer-overlay {
    position: fixed; /* Position relative to viewport */
    top: 4rem; /* Start below banner */
    left: 0;
    height: calc(100vh - 4rem); /* Fill remaining height */
    width: 100%; /* Cover full width */
    z-index: 40; /* Below menu, above main content */
    pointer-events: auto;
    opacity: 1;
    transition: opacity 0.3s ease-out;
  }
  /* Overlay hidden while the drawer is closed */
  .drawer-side > .mobile-drawer-overlay {
    opacity: 0;
    pointer-events: none;
  }

  /* AppNavbar root (class "menu") while the drawer is open */
  .drawer-toggle:checked ~ .drawer-side > .menu {
    position: fixed;
    top: 4rem;
    left: 0;
    height: calc(100vh - 4rem);
    z-index: 50;
    transform: translateX(0%) !important;
    pointer-events: auto;
    overflow-y: auto;
  }
  /* AppNavbar root while the drawer is closed */
  .drawer-side > .menu {
    position: fixed;
    top: 4rem;
    height: calc(100vh - 4rem);
    left: 0;
    transform: translateX(-100%);
    z-index: 50;
    pointer-events: none;
    overflow-y: auto;
  }
}
</style>
