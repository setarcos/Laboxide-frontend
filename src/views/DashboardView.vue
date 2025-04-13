<template>
  <div class="prose max-w-none"> <!-- Use prose for nice typography -->
    <p v-if="authStore.isLoading">Loading user information...</p>
    <p v-else-if="authStore.user">
      Welcome back, <strong>{{ authStore.user.realname }}</strong>!
    </p>
    <p v-else>
      Please log in to access more features.
    </p>

        <!-- Semester Greeting -->
    <p class="mt-2 text-lg text-info font-medium">
        <span v-if="semesterStore.isSemesterLoading" class="loading loading-dots loading-sm"></span>
        <span v-else-if="semesterStore.semesterError" class="text-error">⚠️ Could not load semester info.</span>
        <span v-else>{{ semesterGreeting }}</span>
    </p>

    <div v-if="authStore.isTeacher | authStore.isStudent" class="divider"></div>
    <!-- My Courses Card (Only for authenticated users) -->
    <div v-if="authStore.isTeacher | authStore.isStudent" class="card bg-base-100 shadow-xl mt-6">
      <div class="card-body">
        <h2 class="card-title">My Courses</h2>

        <!-- Loading State -->
        <div v-if="isLoadingMyCourses" class="text-center py-5">
          <span class="loading loading-spinner text-primary"></span> Loading your courses...
        </div>

        <!-- Error State -->
        <div v-else-if="myCoursesError" class="alert alert-warning shadow-sm">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span>Could not load your courses: {{ myCoursesError.message || myCoursesError }}</span>
          </div>
        </div>

        <!-- Course List Table -->
        <div v-else-if="myCourses.length > 0" class="overflow-x-auto">
          <table class="table table-sm table-zebra w-full">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Day</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in myCourses" :key="course.id">
                <td>
                  <router-link
                    :to="{ name: 'CourseDetail', params: { id: course.course_id } }"
                    class="link link-hover link-primary"
                    :title="`View details for ${course.course_name}`"
                  >
                    {{ course.course_name }}
                  </router-link>
                </td>
                <td>
                  <router-link
                    :to="{ name: 'SubcourseStudents', params: { id: course.id} }"
                    class="link link-hover link-primary"
                    title="View Students"
                  >
                    {{ getWeekdayName(course.weekday) }}
                  </router-link>
                </td>
                <td>{{ course.room_name }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- No Courses Message -->
        <div v-else class="text-center py-5 italic text-gray-500">
          You are not currently assigned to any courses.
        </div>

      </div>
    </div>

    <div class="divider" v-if="isSuper"></div>
    <div class="mt-6 p-4 bg-base-200 rounded-box" v-if="isSuper">
       <h3 class="text-lg font-semibold mb-2">Quick Actions</h3>
       <div class="flex flex-wrap gap-2">
            <router-link v-if="authStore.isAdmin | authStore.isTeacher" :to="{ name: 'Courses'}" class="btn btn-sm btn-outline">Manage Courses</router-link>
            <router-link v-if="authStore.isAdmin | authStore.isLabManager" :to="{ name: 'Labrooms'}" class="btn btn-sm btn-outline">Manage Lab Rooms</router-link>
            <router-link v-if="authStore.isAdmin" :to="{ name: 'Users'}" class="btn btn-sm btn-outline">Manage Users</router-link>
            <router-link v-if="authStore.isAdmin" :to="{ name: 'Semesters'}" class="btn btn-sm btn-outline">Manage Semesters</router-link>
       </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'; // Import ref, onMounted, watch
import { useAuthStore } from '@/stores/auth'
import { useSemesterStore } from '@/stores/semester' // <-- Import semester store
import * as dataService from '@/services/dataService'; // Import dataService
import { getWeekdayName } from '@/utils/weekday';

const authStore = useAuthStore()
const semesterStore = useSemesterStore() // <-- Use semester store

// --- State for My Courses ---
const myCourses = ref([]);
const isLoadingMyCourses = ref(false);
const myCoursesError = ref(null);
const isSuper = computed(() => (authStore.isTeacher | authStore.isAdmin | authStore.isLabManager))

// --- Fetch My Courses Logic ---
const fetchMyCourses = async () => {
    if (!authStore.isAuthenticated) {
        myCourses.value = []; // Clear courses if user logs out
        return; // Don't fetch if not logged in
    }
    isLoadingMyCourses.value = true;
    myCoursesError.value = null;
    try {
        const response = await dataService.getMySubcourses();
        myCourses.value = response.data || [];
    } catch (err) {
        console.error("Failed to fetch user's courses:", err);
        myCoursesError.value = err.response?.data || err;
        myCourses.value = []; // Clear on error
    } finally {
        isLoadingMyCourses.value = false;
    }
};

// Computed property for the semester greeting message
const semesterGreeting = computed(() => {
    // No need to check loading/error here, handled in template v-if
    if (!semesterStore.currentSemester) {
        return "No current semester information available.";
    }

    const semester = semesterStore.currentSemester;
    // --- IMPORTANT: Adjust field names 'name', 'start_date', 'end_date' ---
    const semesterName = semester.name;
    const startDateStr = semester.start;
    const endDateStr = semester.end;

    if (!semesterName || !startDateStr || !endDateStr) {
        console.warn("Semester data missing name, start_date, or end_date:", semester);
        return "Current semester data is incomplete.";
    }

    try {
        const now = new Date();
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        // Check if dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Invalid date format in semester data:", startDateStr, endDateStr);
            return "Could not parse semester dates.";
        }

        // Set hours to 0 to compare dates only, prevent timezone issues affecting day comparison
        now.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0); // Consider comparing against end of day if needed

        if (now < startDate) {
            return `The ${semesterName} semester hasn't started yet. Currently on vacation.`;
        } else if (now > endDate) {
            return `The ${semesterName} semester has ended. Currently on vacation.`;
        } else {
            // Calculate week number (Week 1 starts on startDate)
            const diffTime = Math.abs(now - startDate);
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Use floor for completed days
            const currentWeek = Math.floor(diffDays / 7) + 1; // Add 1 because week 1 starts at day 0

            return `Welcome to Week ${currentWeek} of the ${semesterName} semester!`;
        }
    } catch (e) {
        console.error("Error calculating semester week:", e);
        return "Could not determine the current week.";
    }
});

watch(() => authStore.isAuthenticated, (isAuth, wasAuth) => {
    console.log(`Auth state changed: ${wasAuth} -> ${isAuth}`); // Add log
    if (isAuth) {
        // User is authenticated (either initially or just logged in)
        if (authStore.isTeacher | authStore.isStudent)
            fetchMyCourses();
    } else {
        // User is not authenticated (either initially or just logged out)
        myCourses.value = []; // Clear data
        myCoursesError.value = null;
        isLoadingMyCourses.value = false; // Stop loading if logout happens mid-fetch
        console.log("User logged out, cleared courses."); // Add log
    }
}, {
    immediate: true // <<< Run the handler immediately on component mount
});

</script>

<style scoped>
/* Add specific styles for the dashboard view if needed */
</style>
