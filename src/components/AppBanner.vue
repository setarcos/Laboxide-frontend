<template>
  <div class="navbar bg-base-300 shadow-md sticky top-0 z-30">
    <div class="navbar-start">
      <!-- Hamburger menu for mobile -->
      <label for="my-drawer-toggle" class="btn btn-square btn-ghost lg:hidden">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </label>
      <!-- Title -->
      <a class="btn btn-ghost text-xl hidden lg:flex">Admin Panel</a>
    </div>
    <div class="navbar-center">
      <!-- Can add logo or center title here -->
    </div>
    <div class="navbar-end gap-2">
      <div v-if="authStore.isLoading" class="px-4">
        <span class="loading loading-spinner loading-sm"></span>
      </div>
      <div v-else-if="authStore.isAuthenticated && authStore.user" class="flex items-center gap-2 px-4">
        <span>Welcome, {{ authStore.user.realname }}!</span>
        <button @click="handleLogout" class="btn btn-sm btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Logout
        </button>
      </div>
      <div v-else class="px-4">
        <a href="/login" class="btn btn-sm btn-primary">Login</a>
      </div>
      <!-- theme selector -->
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost capitalize">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 mr-1"><path stroke-linecap="round" stroke-linejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402a3.75 3.75 0 0 0-.823-5.55L11.18 5.55a3.75 3.75 0 0 0-5.304 0L1.977 9.451a3.75 3.75 0 0 0-.823 5.55l3.944 3.944Z M19.098 19.902a3.75 3.75 0 1 0-5.304 0l-1.83 1.831a.75.75 0 0 0 1.06 1.061l1.83-1.831Z M16.81 4.09a3.75 3.75 0 0 0-5.304 0L9.675 5.918a.75.75 0 0 0 1.061 1.06l1.83-1.83a3.75 3.75 0 0 0 4.243 0l2.899 2.898a.75.75 0 0 0 1.06-1.06l-2.898-2.898Z" /></svg>
          {{ selectedTheme }}
          <svg width="12px" height="12px" class="ml-1 hidden h-3 w-3 fill-current opacity-60 sm:inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
        </div>
        <ul tabindex="0" class="dropdown-content z-[1] p-2 shadow-2xl bg-base-200 rounded-box w-52 menu menu-sm">
          <li v-for="theme in availableThemes" :key="theme">
            <button
              @click="applyTheme(theme)"
              :class="['capitalize', { 'active': selectedTheme === theme }]"
              type="button"
             >
              {{ theme }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue' // <-- Import ref and onMounted

const authStore = useAuthStore()
const router = useRouter()

// --- Theme Switcher Logic ---
const availableThemes = ref(['light', 'dark', 'cupcake']); // Match tailwind.config.js
const selectedTheme = ref(availableThemes.value[0]); // Default to the first theme
const storageKey = 'daisyui-theme';

const applyTheme = (themeName) => {
  if (availableThemes.value.includes(themeName)) {
    // 1. Update the <html> data-theme attribute
    document.documentElement.setAttribute('data-theme', themeName);
    // 2. Save theme choice to localStorage
    localStorage.setItem(storageKey, themeName);
    // 3. Update the ref for UI display
    selectedTheme.value = themeName;
  } else {
    console.warn(`Theme "${themeName}" not available.`);
  }
};

// Load saved theme on component mount
onMounted(() => {
  const savedTheme = localStorage.getItem(storageKey);
  if (savedTheme && availableThemes.value.includes(savedTheme)) {
    applyTheme(savedTheme); // Apply saved theme if valid
  } else {
    // Apply default theme if nothing saved or saved theme is invalid
    applyTheme(selectedTheme.value); // Apply the default ref value
     // Optionally remove invalid theme from storage
    if (savedTheme && !availableThemes.value.includes(savedTheme)) {
      localStorage.removeItem(storageKey);
    }
  }
});
// --- End Theme Switcher Logic ---


const handleLogout = async () => {
  await authStore.logout()
  // Redirection should be handled by logout action or router guards
}
</script>

<style scoped>
/* Add any specific banner styles if needed */
.dropdown-content button.active {
    @apply bg-primary text-primary-content; /* Or use DaisyUI's btn-active */
}
</style>
