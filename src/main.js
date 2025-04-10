import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth' // Import the auth store
import { useSemesterStore } from './stores/semester' // Import the auth store

const app = createApp(App)
const pinia = createPinia()

app.use(pinia) // Use Pinia before router or accessing store

// --- Authentication Check ---
// Try to fetch user info before mounting the app
const authStore = useAuthStore() // Needs pinia instance registered first
const semesterStore = useSemesterStore()

try {
    // We await this so the initial loading state is handled correctly
    // and navigation guards have the auth status ready
    await authStore.checkAuth()
} catch (error) {
    console.error("Initial auth check failed:", error)
    // App will still load, but user will be in logged-out state
} finally {
    authStore.isLoading = false; // Ensure loading is set to false
}
// --- End Authentication Check ---

try {
    await semesterStore.fetchCurrentSemester()
} catch (error) {
    console.error("Load semester info failed:", error)
} finally {
    semesterStore.isSemesterLoading = false;
}

app.use(router) // Use router after Pinia setup and initial auth check

app.mount('#app')
