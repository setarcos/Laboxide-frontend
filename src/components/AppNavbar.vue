<template>
  <div
    class="h-full menu p-4 pt-16 w-60 lg:w-80 bg-base-200 text-base-content flex flex-col"
  >
    <!-- Menu list container: -->
    <ul class="mb-4">
      <li>
        <router-link :to="{ name: 'Dashboard' }" exact-active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
          {{ $t("navbar.dashboard") }}
        </router-link>
      </li>
      <!-- Courses -->
      <li>
        <router-link :to="{ name: 'Courses' }" exact-active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          {{ $t("navbar.course") }}
        </router-link>
      </li>
      <!-- Labrooms -->
      <li
        v-if="
          authStore.hasPermission(PERMISSION_ADMIN | PERMISSION_LAB_MANAGER)
        "
      >
        <router-link :to="{ name: 'Labrooms' }" exact-active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
            />
          </svg>
          {{ $t("navbar.labroom") }}
        </router-link>
      </li>
      <li v-if="authStore.isTeacher">
        <router-link
          :to="{ name: 'EquipmentView' }"
          exact-active-class="active"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          {{ $t("navbar.equipment") }}
        </router-link>
      </li>
      <li v-if="authStore.isTeacher">
        <router-link
          :to="{ name: 'MeetingBookingView' }"
          exact-active-class="active"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {{ $t("navbar.meeting") }}
        </router-link>
      </li>
      <!-- Users -->
      <li v-if="authStore.isAdmin">
        <router-link :to="{ name: 'Users' }" exact-active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          {{ $t("navbar.user") }}
        </router-link>
      </li>
      <!-- Semesters -->
      <li v-if="authStore.isAdmin">
        <router-link :to="{ name: 'Semesters' }" exact-active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 14l9-5-9-5-9 5 9 5z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"
            />
          </svg>
          {{ $t("navbar.semester") }}
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
      <div class="dropdown dropdown-top w-full mb-2">
        <!-- Added mb-2 for spacing -->
        <label
          tabindex="0"
          role="button"
          class="btn btn-ghost w-full justify-start capitalize"
        >
          <svg
            viewBox="0 0 48.666 48.666"
            width="24"
            height="24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
          >
            <path
              d="M24.333 6.32C10.894 6.32 0 14.792 0 25.243c0 6.447 9.1 6.478 16.681 5.384 5.62-.811 10.052 1.354 10.052 5.656s4.753 7.643 9.917 5.282c7.19-3.288 12.016-9.366 12.016-16.322C48.666 14.792 37.771 6.32 24.333 6.32zM8.996 20.389a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626zm7.568-4.975a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626zm10.082-.814a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626zm8.311 23.048a3.831 3.831 0 1 1 0-7.662 3.831 3.831 0 0 1 0 7.662zm1.518-19.922a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626zm4.627 8.921a2.313 2.313 0 1 1 0-4.626 2.313 2.313 0 0 1 0 4.626z"
            />
          </svg>
          Theme: {{ selectedTheme }}
          <svg
            width="12px"
            height="12px"
            class="ml-auto h-3 w-3 fill-current opacity-60"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 2048 2048"
          >
            <path
              d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"
            ></path>
          </svg>
        </label>
        <ul
          tabindex="0"
          class="dropdown-content z-[1] p-2 shadow-2xl bg-base-300 rounded-box w-52 menu menu-sm max-h-60 overflow-y-auto"
        >
          <!-- Theme buttons -->
          <li v-for="theme in availableThemes" :key="theme">
            <button
              @click="applyTheme(theme)"
              :class="['capitalize', { active: selectedTheme === theme }]"
              type="button"
            >
              {{ theme }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Version Number -->
      <div class="pt-2 p-2 text-center text-xs text-base-content/60">
        <a
          href="https://github.com/setarcos/Laboxide-frontend"
          class="github-corner"
          aria-label="View source on GitHub"
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 250 250"
            style="
              fill: #151513;
              color: #fff;
              position: absolute;
              top: 0;
              border: 0;
              left: 0;
              transform: rotate(270deg);
            "
            aria-hidden="true"
          >
            <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
            <path
              d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
              fill="currentColor"
              style="transform-origin: 130px 106px"
              class="octo-arm"
            ></path>
            <path
              d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
              fill="currentColor"
              class="octo-body"
            ></path>
          </svg>
        </a>
      </div>
    </div>
    <!-- End of mt-auto wrapper -->
  </div>
  <!-- End of root div -->
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
// Make sure your path to permissions is correct
import { PERMISSION_ADMIN, PERMISSION_LAB_MANAGER } from "@/utils/permissions";
import { ref, onMounted } from "vue";
// Import RouterLink if not globally registered and using exact-active-class
// import { RouterLink } from 'vue-router'

const authStore = useAuthStore();

// --- Theme Switcher Logic ---
const availableThemes = ref([
  // Make sure these are in tailwind.config.js and html data-theme attribute
  "light",
  "dark",
  "cupcake",
  "autumn" /* add other themes */,
]);
const selectedTheme = ref(availableThemes.value[0]); // Default theme
const storageKey = "daisyui-theme";

const applyTheme = (themeName) => {
  if (availableThemes.value.includes(themeName)) {
    document.documentElement.setAttribute("data-theme", themeName);
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
.menu li > a.router-link-exact-active {
  /* Fallback or alternative if exact-active-class prop isn't working as expected */
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
.github-corner:hover .octo-arm {
  animation: octocat-wave 560ms ease-in-out;
}

@keyframes octocat-wave {
  0%,
  100% {
    transform: rotate(0);
  }
  20%,
  60% {
    transform: rotate(-25deg);
  }
  40%,
  80% {
    transform: rotate(10deg);
  }
}

@media (max-width: 500px) {
  .github-corner:hover .octo-arm {
    animation: none;
  }
  .github-corner .octo-arm {
    animation: octocat-wave 560ms ease-in-out;
  }
}
</style>
