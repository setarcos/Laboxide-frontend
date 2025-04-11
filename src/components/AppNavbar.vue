<template>
   <div class="h-full menu p-4 pt-16 w-60 lg:w-80 bg-base-200 text-base-content flex flex-col">
        <!-- Menu list container: -->
        <ul class="mb-4">
            <li>
                <router-link :to="{ name: 'Dashboard' }" exact-active-class="active" >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    Dashboard
                </router-link>
            </li>
            <!-- Courses -->
            <li v-if="authStore.hasPermission(PERMISSION_ADMIN | PERMISSION_TEACHER)">
                 <router-link :to="{ name: 'Courses' }" exact-active-class="active">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    Courses
                </router-link>
            </li>
            <!-- Labrooms -->
            <li v-if="authStore.hasPermission(PERMISSION_ADMIN | PERMISSION_LAB_MANAGER)">
                <router-link :to="{ name: 'Labrooms' }" exact-active-class="active">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                    Lab Rooms
                </router-link>
            </li>
            <!-- Users -->
            <li v-if="authStore.isAdmin">
                 <router-link :to="{ name: 'Users' }" exact-active-class="active">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    Users
                </router-link>
            </li>
            <!-- Semesters -->
             <li v-if="authStore.isAdmin">
                 <router-link :to="{ name: 'Semesters' }" exact-active-class="active">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Semesters
                </router-link>
            </li>
            <!-- Add more menu items as needed -->
        </ul>

        <!--
            Wrapper for bottom elements.
            - mt-auto: Pushes this entire block to the bottom of the flex container.
            - flex-shrink-0: Prevents this block from shrinking.
         -->
        <div class="mt-auto flex-shrink-0">
            <!-- Theme Dropdown -->
            <div class="dropdown dropdown-top w-full mb-2"> <!-- Added mb-2 for spacing -->
                <label tabindex="0" role="button" class="btn btn-ghost w-full justify-start capitalize">
                <svg viewBox="0 0 48.666 48.666" width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"> <path d="M24.333 6.32C10.894 6.32 0 14.792 0 25.243c0 6.447 9.1 6.478 16.681 5.384 5.62-.811 10.052 1.354 10.052 5.656s4.753 7.643 9.917 5.282c7.19-3.288 12.016-9.366 12.016-16.322C48.666 14.792 37.771 6.32 24.333 6.32zM8.996 20.389a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626zm7.568-4.975a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626zm10.082-.814a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626zm8.311 23.048a3.831 3.831 0 1 1 0-7.662 3.831 3.831 0 0 1 0 7.662zm1.518-19.922a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626zm4.627 8.921a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626z"/> </svg>
                    Theme: {{ selectedTheme }}
                    <svg width="12px" height="12px" class="ml-auto h-3 w-3 fill-current opacity-60" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
                </label>
                <ul tabindex="0" class="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52 menu menu-sm max-h-60 overflow-y-auto">
                   <!-- Theme buttons -->
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

            <!-- Version Number -->
            <div class="pt-2 p-2 text-center text-xs text-base-content/60"> <!-- Adjusted padding -->
                Version 1.0.0
            </div>
        </div> <!-- End of mt-auto wrapper -->
    </div> <!-- End of root div -->
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
// Make sure your path to permissions is correct
import { PERMISSION_ADMIN, PERMISSION_TEACHER, PERMISSION_LAB_MANAGER } from '@/utils/permissions'
import { ref, onMounted } from 'vue'
// Import RouterLink if not globally registered and using exact-active-class
// import { RouterLink } from 'vue-router'

const authStore = useAuthStore()

// --- Theme Switcher Logic ---
const availableThemes = ref([ // Make sure these are in tailwind.config.js and html data-theme attribute
    'light', 'dark', 'cupcake', 'autumn' /* add other themes */
]);
const selectedTheme = ref(availableThemes.value[0]); // Default theme
const storageKey = 'daisyui-theme';

const applyTheme = (themeName) => {
  if (availableThemes.value.includes(themeName)) {
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem(storageKey, themeName);
    selectedTheme.value = themeName;
  } else {
    console.warn(`Theme "${themeName}" not available.`);
    // Optionally apply a default theme if the requested one is invalid
    // applyTheme(availableThemes.value[0]);
  }
};

onMounted(() => {
  const savedTheme = localStorage.getItem(storageKey);
  if (savedTheme && availableThemes.value.includes(savedTheme)) {
    applyTheme(savedTheme);
  } else {
    // Apply the default theme if nothing is saved or the saved theme is invalid
    applyTheme(selectedTheme.value);
    // Clean up invalid theme from storage
    if (savedTheme && !availableThemes.value.includes(savedTheme)) {
      localStorage.removeItem(storageKey);
    }
  }
});
// --- End Theme Switcher Logic ---
</script>

<style scoped>
/* Add specific styles for the navbar if needed */

/* Style for the active RouterLink */
.menu li > a.active {
    @apply bg-primary text-primary-content; /* DaisyUI active menu item style */
}
.menu li > a.router-link-exact-active { /* Fallback or alternative if exact-active-class prop isn't working as expected */
    @apply bg-primary text-primary-content;
}

/* Style for the active theme button in the dropdown */
.dropdown-content button.active {
    /* You can use DaisyUI's btn-active or define custom styles */
     @apply bg-primary text-primary-content; /* Matches menu active style */
    /* or */
    /* @apply btn-active; */
}

/* Ensure dropdown menu scrolls if it has many themes */
.dropdown-content.menu {
    max-height: 15rem; /* Example max-height (adjust as needed) */
    overflow-y: auto;
}
</style>
