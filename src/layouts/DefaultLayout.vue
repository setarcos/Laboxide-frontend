<template>
  <!-- Make the root container exactly screen height and prevent it from scrolling -->
  <div class="flex flex-col h-screen max-h-screen overflow-hidden bg-base-200">

    <!-- 1. Banner - Ensure it doesn't shrink -->
    <AppBanner class="flex-shrink-0" /> <!-- Assumes h-16 (4rem) -->

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
      <div class="drawer-side h-full lg:border-r border-base-300 overflow-y-auto">
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

    </div> <!-- End of drawer -->
  </div> <!-- End of main flex container -->
</template>

<script setup>
import AppBanner from '@/components/AppBanner.vue'
import AppNavbar from '@/components/AppNavbar.vue'
import { RouterView } from 'vue-router'
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
 * Custom overrides for mobile drawer positioning (below lg breakpoint).
 * Adjust '4rem' if your banner height (h-16) changes.
 */
@media (max-width: 1023px) {
  /*
   * Define the transition *outside* the :checked state so it applies
   * when transitioning *both* in and out.
   * Apply it to the element that DaisyUI actually animates (often the drawer content).
   */
  .drawer-side > .menu { /* Or adjust selector if DaisyUI animates drawer-side itself */
    transition-property: transform; /* Add other properties if needed (e.g., opacity) */
    transition-duration: 0.3s; /* Match DaisyUI's default or set your own */
    transition-timing-function: ease-out; /* Match DaisyUI's default */
  }

  /* Overlay positioning when drawer is open */
  .drawer-toggle:checked ~ .drawer-side > .mobile-drawer-overlay {
    position: fixed; /* Position relative to viewport */
    top: 4rem;       /* Start below banner */
    left: 0;
    height: calc(100vh - 4rem); /* Fill remaining height */
    width: 100%;                /* Cover full width */
    z-index: 40;                /* Below menu, above main content (adjust if needed) */
    /* Ensure it's visible and clickable (optional background for debug) */
    /* background-color: rgba(0, 0, 0, 0.4); */
    pointer-events: auto; /* Explicitly ensure it can receive clicks */
    /* Fade in/out the overlay slightly */
    opacity: 1;
    transition: opacity 0.3s ease-out;
  }
  /* Default state for overlay (when drawer is closed/closing) */
   .drawer-side > .mobile-drawer-overlay {
     opacity: 0;
     pointer-events: none; /* Ensure it's not clickable when hidden */
   }

  /* Target the AppNavbar component (its root element has class 'menu') */
  .drawer-toggle:checked ~ .drawer-side > .menu { /* Targets AppNavbar's root */
    position: fixed; /* Position relative to viewport */
    top: 4rem;       /* Start below banner */
    left: 0;         /* Align left (transform handles slide-in) */
    height: calc(100vh - 4rem); /* Fill height below banner */
    z-index: 50;                /* Above overlay (adjust if needed) */
    /* DaisyUI handles width/transform, but ensure it doesn't break */
    /* Reset transform if position:fixed overrides DaisyUI's slide-in */
    transform: translateX(0%) !important; /* Force it visible if needed */
    pointer-events: auto; /* Ensure menu items are clickable */
     /* Add overflow-y-auto here if needed, since drawer-side might not scroll correctly now */
    overflow-y: auto;
    /* Explicitly set transform for the open state */
    transform: translateX(0%);
    /* The transition defined above will handle the slide */
  }
  /* Default state for menu (when drawer is closed/closing) */
  .drawer-side > .menu {
     /* Ensure it respects the top offset even in its 'closed' transform state */
     /* Note: Fixed position isn't ideal here, but needed for the overlay interaction.
        Let transform handle the hiding. */
      position: fixed; /* Keep fixed so top offset applies */
      top: 4rem;
      height: calc(100vh - 4rem);
      left: 0; /* Important */
      transform: translateX(-100%); /* Default DaisyUI closed state */
      z-index: 50; /* Keep z-index consistent */
      pointer-events: none; /* Not interactive when closed */
      overflow-y: auto; /* Allow scrolling if content was tall */
  }
}
</style>
