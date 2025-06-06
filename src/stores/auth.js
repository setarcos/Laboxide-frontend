import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "@/services/api";
import {
  PERMISSION_ADMIN,
  PERMISSION_TEACHER,
  PERMISSION_LAB_MANAGER,
  PERMISSION_STUDENT,
} from "@/utils/permissions";

export const useAuthStore = defineStore("auth", () => {
  // State
  const user = ref(null); // Stores { user_id, realname, permissions } or null
  const isAuthenticated = ref(false);
  const isLoading = ref(true); // Start as true until first checkAuth completes

  // Getters (Computed)
  const permissions = computed(() => user.value?.permissions || 0);
  const isAdmin = computed(
    () => (permissions.value & PERMISSION_ADMIN) === PERMISSION_ADMIN,
  );
  const isTeacher = computed(
    () => (permissions.value & PERMISSION_TEACHER) === PERMISSION_TEACHER,
  );
  const isLabManager = computed(
    () =>
      (permissions.value & PERMISSION_LAB_MANAGER) === PERMISSION_LAB_MANAGER,
  );
  const isStudent = computed(
    () => (permissions.value & PERMISSION_STUDENT) === PERMISSION_STUDENT,
  );

  // Actions
  async function checkAuth() {
    // isLoading.value = true; // Set loading at the start of the action if called multiple times
    try {
      const response = await api.get("/greet");
      if (response.data && !response.data.error) {
        user.value = {
          userId: response.data.user_id,
          realname: response.data.realname,
          permissions: response.data.permissions,
        };
        isAuthenticated.value = true;
      } else {
        // Handle case where /greet returns an error object (like user not logged in)
        resetAuth();
        console.log("User not logged in or greet error:", response.data?.error);
      }
    } catch (error) {
      // Handle network errors or unexpected backend responses
      resetAuth();
      console.error("Error checking authentication:", error);
      // Re-throw if needed elsewhere, but reset state here
      throw error; // Allow main.js to catch if needed
    } finally {
      // isLoading.value = false; // Set loading false here OR in main.js after await
    }
  }

  async function logout() {
    try {
      await api.get("/logout");
    } catch (error) {
      console.error("Error during logout API call:", error);
      // Proceed with frontend logout even if backend call fails
    } finally {
      resetAuth();
      // Optionally redirect after logout
      // router.push('/login'); // If you have a login route
      // Or simply let the UI update based on isAuthenticated
      // In this setup, the router guard will likely redirect from protected pages
      window.location.reload(); // Force reload to ensure clean state and trigger guards
    }
  }

  function resetAuth() {
    user.value = null;
    isAuthenticated.value = false;
  }

  // Helper function to check permissions more broadly
  function hasPermission(requiredPermission) {
    // Allows checking for multiple permissions using bitwise OR
    // e.g., hasPermission(PERMISSION_ADMIN | PERMISSION_TEACHER)
    return (permissions.value & requiredPermission) !== 0;
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isTeacher,
    isLabManager,
    isStudent,
    checkAuth,
    logout,
    hasPermission,
  };
});
