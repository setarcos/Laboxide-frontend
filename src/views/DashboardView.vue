<template>
  <div class="prose max-w-none"> <!-- Use prose for nice typography -->
    <h1>Dashboard</h1>
    <p v-if="authStore.isLoading">Loading user information...</p>
    <p v-else-if="authStore.isAuthenticated && authStore.user">
      Welcome back, <strong>{{ authStore.user.realname }}</strong>!
    </p>
    <p v-else>
      Please log in to manage the system.
    </p>

    <div class="divider"></div>

    <p>This is the main dashboard area. You can add widgets, statistics, or quick links here.</p>

     <div class="mt-6 p-4 bg-base-200 rounded-box">
        <h3 class="text-lg font-semibold mb-2">Quick Actions</h3>
        <div class="flex flex-wrap gap-2">
             <router-link v-if="authStore.hasPermission(PERMISSION_ADMIN | PERMISSION_TEACHER)" :to="{ name: 'Courses'}" class="btn btn-sm btn-outline">Manage Courses</router-link>
             <router-link v-if="authStore.hasPermission(PERMISSION_ADMIN | PERMISSION_LAB_MANAGER)" :to="{ name: 'Labrooms'}" class="btn btn-sm btn-outline">Manage Lab Rooms</router-link>
             <router-link v-if="authStore.isAdmin" :to="{ name: 'Users'}" class="btn btn-sm btn-outline">Manage Users</router-link>
             <router-link v-if="authStore.isAdmin" :to="{ name: 'Semesters'}" class="btn btn-sm btn-outline">Manage Semesters</router-link>
        </div>
     </div>

  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { PERMISSION_ADMIN, PERMISSION_TEACHER, PERMISSION_LAB_MANAGER } from '@/utils/permissions'

const authStore = useAuthStore()

// No specific data fetching needed for a basic dashboard usually
</script>

<style scoped>
/* Add specific styles for the dashboard view if needed */
</style>
