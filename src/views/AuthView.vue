<template>
  <div>
    <h2>Authenticating...</h2>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { postToken } from "@/services/dataService";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const error = ref("");
const authStore = useAuthStore();

onMounted(async () => {
  const token = route.query.token;

  if (!token) {
    error.value = "Authentication failed: No token provided.";
    // Optionally redirect back to login after a delay
    setTimeout(() => router.push({ name: "login" }), 3000);
    return;
  }

  try {
    // Send the token to our backend. The Vite proxy handles the URL.
    await postToken({ token: token });
    await authStore.checkAuth();
    // On success, the backend sets an HttpOnly cookie.
    // We can now redirect to the protected area.
    router.push({ name: "Dashboard" });
  } catch (err) {
    console.error("Backend validation failed:", err);
    error.value = "Failed to validate session. Please try again.";
    setTimeout(() => router.push({ name: "login" }), 3000);
  }
});
</script>
