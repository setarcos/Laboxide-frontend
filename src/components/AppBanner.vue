<template>
  <!-- Assume banner height is h-16 (64px). Change if needed -->
  <div class="navbar h-16 bg-base-300 shadow-md">
    <div class="navbar-start">
      <!-- Hamburger menu for mobile -->
      <label for="my-drawer-toggle" class="btn btn-square btn-ghost lg:hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          class="inline-block w-5 h-5 stroke-current"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </label>
    </div>
    <div class="navbar-center">
      <a class="btn btn-ghost text-lg lg:hidden">
        电子信息科学<br />基础实验中心</a
      >
      <a class="btn btn-ghost text-xl hidden lg:flex">
        电子信息科学基础实验中心</a
      >
    </div>
    <div class="navbar-end">
      <div class="dropdown dropdown-end mr-2">
        <div tabindex="0" role="button" class="btn btn-ghost btn-sm">
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
              d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
            />
          </svg>
        </div>
        <ul
          tabindex="0"
          class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-20"
        >
          <li v-for="lang in availableLocales" :key="lang">
            <a @click="changeLanguage(lang)">{{ lang.toUpperCase() }}</a>
          </li>
        </ul>
      </div>

      <div v-if="authStore.isLoading" class="px-4">
        <span class="loading loading-spinner loading-sm"></span>
      </div>
      <div
        v-else-if="authStore.isAuthenticated && authStore.user"
        class="flex items-center gap-2 px-4"
      >
        <button @click="handleLogout" class="btn btn-sm btn-ghost">
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {{ $t("button.logout") }}
        </button>
      </div>
      <div v-else class="px-4">
        <a href="/login" class="btn btn-sm btn-primary">{{
          $t("button.login")
        }}</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { useI18n } from "vue-i18n";

const authStore = useAuthStore();
const { locale, availableLocales } = useI18n();

const changeLanguage = (lang) => {
  locale.value = lang;
  localStorage.setItem("user-lang", lang);
};

const handleLogout = async () => {
  await authStore.logout();
  // Redirection should be handled by logout action or router guards
};
</script>

<style scoped>
/* Add any specific banner styles if needed */
</style>
