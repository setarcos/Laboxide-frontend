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

        <!-- Loading State for Courses -->
        <div v-if="isLoadingMyCourses" class="text-center py-5">
          <span class="loading loading-spinner text-primary"></span> Loading your courses...
        </div>

        <!-- Error State for Courses -->
        <div v-else-if="myCoursesError" class="alert alert-warning shadow-sm">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span>Could not load your courses: {{ myCoursesError.message || myCoursesError }}</span>
          </div>
        </div>

        <!-- Loading State for Final Log Statuses -->
         <div v-if="isLoadingFinalLogStatuses" class="text-center text-sm text-gray-500 my-2">
           <span class="loading loading-dots loading-xs"></span> Checking final log statuses...
         </div>

        <!-- Error State for Final Log Statuses -->
        <div v-else-if="finalLogStatusesError" class="alert alert-error shadow-sm my-2 text-sm">
           Error checking final log statuses: {{ finalLogStatusesError }}
        </div>


        <!-- Course List Table -->
        <div v-else-if="myCourses.length > 0" class="overflow-x-auto">
          <table class="table table-sm table-zebra w-full">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Day</th>
                <th>Room</th>
                <th v-if="authStore.isStudent">Actions</th>
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
                    v-if="authStore.isTeacher"
                    :to="{ name: 'SubcourseStudents', params: { id: course.id} }"
                    class="link link-hover link-primary"
                    title="View Students"
                  >
                    {{ getWeekdayName(course.weekday) }}
                  </router-link>
                   <span v-else>{{ getWeekdayName(course.weekday) }}</span>
                </td>
                <td>{{ course.room_name }}</td>
                <td>
                    <button v-if="authStore.isStudent"
                        class="btn btn-xs btn-outline btn-primary"
                        @click="openTimelineModal(course)"
                        :disabled="!currentWeekNumber || hasConfirmedLog(course.id)"
                        :title="getLogButtonTitle(course.id)"
                    >
                         {{ hasConfirmedLog(course.id) ? 'Log Confirmed' : 'Log Progress' }}
                    </button>
                    <div v-if="authStore.isTeacher" class="flex gap-1">
                         <router-link
                            :to="{ name: 'SubcourseProgress', params: { id: course.id } }"
                            class="btn btn-xs btn-outline btn-secondary"
                            title="View Student Progress"
                         >
                            View Progress
                         </router-link>
                    </div>
                </td>
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

    <!-- Timeline Log Modal -->
    <dialog id="timeline_log_modal" class="modal" :open="showTimelineModal">
        <div class="modal-box w-11/12 max-w-3xl">
             <TimelineLogModal
                v-if="selectedSubcourseForTimeline && currentWeekNumber && authStore.user"
                :key="timelineModalKey"
                :subcourse="selectedSubcourseForTimeline"
                :student-id="authStore.user.userId"
                :current-week="currentWeekNumber"
                @close="closeTimelineModal"
                @request-finish-log="handleRequestFinishLog"
                @log-saved="handleTimelineLogSaved"
             />
             <div v-else class="p-4 text-center text-error">
                Missing data required to open the timeline log.
             </div>
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeTimelineModal">✕</button>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button @click="closeTimelineModal">close</button>
        </form>
    </dialog>

    <!-- Student Log Modal (Final Step) -->
    <dialog id="finish_log_modal" class="modal" :open="showFinishLogModal">
        <div class="modal-box w-11/12 max-w-2xl">
            <h3 class="font-bold text-lg mb-4">
                 Final Experiment Log for {{ selectedSubcourseForFinishLog?.course_name }} ({{ getWeekdayName(selectedSubcourseForFinishLog?.weekday) }})
            </h3>

            <div v-if="isLoadingFinishLogDefaults" class="text-center p-10">
                <span class="loading loading-lg loading-spinner text-info"></span>
                <p>Loading final log data...</p>
            </div>
             <div v-else-if="finishLogDefaultError" class="alert alert-error">
                Could not load final log data: {{ finishLogDefaultError }}
             </div>
             <StudentLogForm
                v-else-if="finishLogDefaultData"
                :key="finishLogFormKey"
                :initial-data="finishLogDefaultData"
                :is-saving="isSavingFinishLog"
                @save="handleFinishLogSave"
                @close="closeFinishLogModal"
             />
              <div v-else class="text-center p-5 text-warning">
                 Could not display final log form. Default data unavailable.
              </div>

            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeFinishLogModal">✕</button>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button @click="closeFinishLogModal">close</button>
        </form>
    </dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth'
import { useSemesterStore } from '@/stores/semester'
import * as dataService from '@/services/dataService';
import { getWeekdayName } from '@/utils/weekday';
import StudentLogForm from '@/components/StudentLogForm.vue';
import TimelineLogModal from '@/components/TimelineLogModal.vue';

const authStore = useAuthStore()
const semesterStore = useSemesterStore()

// --- State for My Courses ---
const myCourses = ref([]);
const isLoadingMyCourses = ref(false);
const myCoursesError = ref(null);
const isSuper = computed(() => (authStore.isTeacher | authStore.isAdmin | authStore.isLabManager))

// --- State for Student Final Log Statuses ---
// Store the single log object for the current student, keyed by subcourse_id
const studentFinalLogBySubcourse = ref({}); // { [subcourseId]: StudentLog | null }
const isLoadingFinalLogStatuses = ref(false);
const finalLogStatusesError = ref(null);


// --- State for Timeline Log Modal ---
const showTimelineModal = ref(false);
const selectedSubcourseForTimeline = ref(null);
const timelineModalKey = ref(0); // To potentially force remount

// --- State for FINAL Student Log Modal (Finish Step) ---
const showFinishLogModal = ref(false);
const selectedSubcourseForFinishLog = ref(null);
const isLoadingFinishLogDefaults = ref(false);
const finishLogDefaultData = ref(null); // This will hold the single StudentLog object
const finishLogDefaultError = ref(null);
const isSavingFinishLog = ref(false);
const finishLogFormKey = ref(0);

// --- Current Week Calculation ---
const currentWeekNumber = computed(() => {
    if (semesterStore.isSemesterLoading || semesterStore.semesterError || !semesterStore.currentSemester) {
        return null;
    }
    const semester = semesterStore.currentSemester;
    const startDateStr = semester.start;
    const endDateStr = semester.end;

    if (!startDateStr || !endDateStr) return null;

    try {
        const now = new Date();
        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;

        now.setHours(0, 0, 0, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        if (now < startDate || now > endDate) return null; // Not within semester dates

        const diffTime = Math.abs(now - startDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // Use floor for completed days
        return Math.floor(diffDays / 7) + 1; // Add 1 because week 1 starts at day 0
    } catch (e) {
        console.error("Error calculating current week:", e);
        return null;
    }
});

// --- Fetch My Courses Logic ---
const fetchMyCourses = async () => {
    if (!authStore.isAuthenticated) {
        myCourses.value = []; // Clear courses if user logs out
        studentFinalLogBySubcourse.value = {}; // Clear log statuses too
        return; // Don't fetch if not logged in
    }
    isLoadingMyCourses.value = true;
    myCoursesError.value = null;
    try {
        const response = await dataService.getMySubcourses();
        myCourses.value = response.data || [];

        // After fetching courses, if user is student, fetch their final log status for these courses
        if (authStore.isStudent && myCourses.value.length > 0 && authStore.user?.userId) {
            fetchStudentFinalLogStatusesForMyCourses(myCourses.value.map(c => c.id));
        } else {
             // If not student or no courses or no user ID, ensure log status state is cleared
             studentFinalLogBySubcourse.value = {};
        }

    } catch (err) {
        console.error("Failed to fetch user's courses:", err);
        myCoursesError.value = err.response?.data || err;
        myCourses.value = []; // Clear on error
        studentFinalLogBySubcourse.value = {}; // Clear log statuses on error
    } finally {
        isLoadingMyCourses.value = false;
    }
};

// --- Fetch Student's Final Log Status for My Courses ---
// This function fetches the *single* final log entry for the current student
// for each of their assigned subcourses.
const fetchStudentFinalLogStatusesForMyCourses = async (subcourseIds) => {
    if (!authStore.isStudent || !authStore.user?.userId || subcourseIds.length === 0) {
        studentFinalLogBySubcourse.value = {}; // Clear if no student, no user ID, or no courses
        return;
    }

    isLoadingFinalLogStatuses.value = true;
    finalLogStatusesError.value = null;
    // Clear previous statuses before fetching new ones
    studentFinalLogBySubcourse.value = {};

    const studentId = authStore.user.userId;

    try {
        // Create an array of promises, one fetch for getDefaultStudentLog for each subcourse ID
        const fetchPromises = subcourseIds.map(id =>
            dataService.getDefaultStudentLog(id, studentId)
                .then(res => ({ subcourseId: id, log: res.data })) // Return ID with the single log (or null)
                .catch(err => {
                    console.error(`Failed to fetch student log status for subcourse ${id}:`, err);
                    // Return an error object for this specific ID to track failures
                    return { subcourseId: id, error: err.response?.data?.error || err.message || 'Fetch failed' };
                })
        );

        // Wait for all promises to settle (either fulfill or reject)
        const results = await Promise.all(fetchPromises);

        const successfullyFetchedStatuses = {};
        let hasErrors = false;
        results.forEach(result => {
            if (result.error) {
                hasErrors = true;
                // Store an indicator of the error, or just log it.
                // Let's store null/undefined for simplicity and rely on general error message.
                 console.warn(`Student log status fetch failed for subcourse ${result.subcourseId}: ${result.error}`);
                 // Optionally: successfullyFetchedStatuses[result.subcourseId] = { error: result.error };
            } else {
                // Store the single log object (or null if none exists)
                successfullyFetchedStatuses[result.subcourseId] = result.log;
            }
        });

        studentFinalLogBySubcourse.value = successfullyFetchedStatuses;

        if (hasErrors) {
             finalLogStatusesError.value = "Could not load final log statuses for some courses.";
        } else {
             finalLogStatusesError.value = null; // Clear error if all successful
        }

    } catch (err) {
        // This catch block would only be hit if Promise.all itself fails in an unexpected way.
        console.error("Unexpected error during student final log status fetch:", err);
        finalLogStatusesError.value = err.message || 'An unexpected error occurred during log status check.';
        studentFinalLogBySubcourse.value = {}; // Clear data on major error
    } finally {
        isLoadingFinalLogStatuses.value = false;
    }
};

// --- Check if a student has a confirmed log for a specific subcourse ---
const hasConfirmedLog = (subcourseId) => {
    // Get the single log object for this subcourse and the current student
    const studentLog = studentFinalLogBySubcourse.value[subcourseId];

    // Check if the log exists AND its confirm status is 1
    return !!studentLog && studentLog.confirm === 1;
};

// --- Get Button Title ---
const getLogButtonTitle = (subcourseId) => {
    if (!currentWeekNumber.value) {
        return "Cannot open log: Current semester week could not be determined.";
    }
    if (hasConfirmedLog(subcourseId)) {
        // Optionally add teacher note to tooltip if available in the log object
        const log = studentFinalLogBySubcourse.value[subcourseId];
        const teacherNote = log?.tea_note ? `\nTeacher Note: ${log.tea_note}` : '';
        return `Your final log for this course has been confirmed by a teacher.${teacherNote}`;
    }
    return "Log your progress steps for the current week or submit the final log.";
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

// --- Methods for Timeline Log ---
const openTimelineModal = (subcourse) => {
    // Prevent opening if already confirmed
    if (hasConfirmedLog(subcourse.id)) {
        console.log("Log already confirmed, cannot open timeline modal.");
        // Optional: Show a message
        // alert("Your final log for this course has already been confirmed.");
        return;
    }

    if (!authStore.isStudent || !authStore.user?.userId) {
        alert("Cannot open log: User information is missing.");
        return;
    }
     if (!currentWeekNumber.value) {
         alert("Cannot open log: Current semester week could not be determined.");
        return;
     }
     if (subcourse.course_id === undefined || subcourse.tea_name === undefined) {
         alert("Cannot open log: Missing required course information (parent course ID or teacher name).");
         console.error("Subcourse object missing course_id or tea_name:", subcourse);
         return;
     }
    console.log("Opening timeline modal for subcourse:", subcourse.id, "Week:", currentWeekNumber.value);
    selectedSubcourseForTimeline.value = subcourse;
    timelineModalKey.value++; // Increment key to ensure modal internals refresh if needed
    showTimelineModal.value = true;
};

const closeTimelineModal = () => {
    showTimelineModal.value = false;
    selectedSubcourseForTimeline.value = null;
    // Reset other related states if necessary
};

const handleTimelineLogSaved = () => {
    // Optional: Add feedback to the user on the dashboard
    console.log("Timeline log was saved (event received in Dashboard).");
    // Maybe refresh some dashboard data if needed, though the modal updates itself.
};

// --- Methods for FINAL Student Log (Finish Step) ---
const handleRequestFinishLog = (subcourse) => {
    console.log("Request received to open final log form for:", subcourse.id);
    // Check if already confirmed before opening the final log modal
     if (hasConfirmedLog(subcourse.id)) {
        console.log("Log already confirmed, cannot open final log modal.");
        // Optional: Show a message to the user
        alert("Your final log for this course has already been confirmed.");
        closeTimelineModal(); // Ensure timeline modal is closed
        return;
    }

    closeTimelineModal(); // Close the timeline modal first
    openFinishLogModal(subcourse); // Open the final log modal
};

// Fetches the specific student's final log for the given subcourse
const openFinishLogModal = async (subcourse) => {
    if (!authStore.isStudent || !authStore.user?.userId) return; // Redundant check, but safe

    console.log("Opening FINAL log modal for subcourse:", subcourse.id);
    selectedSubcourseForFinishLog.value = subcourse;
    isLoadingFinishLogDefaults.value = true;
    finishLogDefaultError.value = null;
    finishLogDefaultData.value = null; // Clear previous data
    showFinishLogModal.value = true;

    try {
        // Fetch the specific student's log using getDefaultStudentLog
        const response = await dataService.getDefaultStudentLog(subcourse.id, authStore.user.userId);
        finishLogDefaultData.value = response.data; // Assuming response.data is the log object or null

        if (!finishLogDefaultData.value) {
            // If no log exists yet, create a default structure for the form
            finishLogDefaultData.value = {
                id: null, // Indicate this is a new log
                stu_id: authStore.user.userId,
                stu_name: authStore.user.realname,
                subcourse_id: subcourse.id,
                room_id: subcourse.room_id,
                lab_name: subcourse.room_name,
                seat: null, // Student might need to enter this? Or is it from subcourse? Adjust if needed.
                note: '', // Student's note
                tea_note: '', // Teacher note (should be empty for student form)
                tea_name: '', // Teacher name (should be empty for student form)
                fin_time: null, // Should be set on save by backend
                confirm: 0, // Should be set to 0 on save by backend
            };
             console.log("getDefaultStudentLog returned null, preparing default data:", finishLogDefaultData.value);
        } else {
             console.log("getDefaultStudentLog returned existing data:", finishLogDefaultData.value);
             // If data was returned, it might already have teacher notes/confirm status.
             // The StudentLogForm should handle which fields are editable.
             // Ensure student cannot change teacher fields
             finishLogDefaultData.value.tea_note = '';
             finishLogDefaultData.value.tea_name = '';
             // Keep the existing confirm status if it exists, though form shouldn't allow changing it
        }

         // Ensure essential fields are correctly set for the form if default data was returned
         // (This might be redundant if the form component is robust, but adds safety)
         finishLogDefaultData.value.stu_id = authStore.user.userId;
         finishLogDefaultData.value.stu_name = authStore.user.realname;
         finishLogDefaultData.value.subcourse_id = subcourse.id;
         finishLogDefaultData.value.room_id = subcourse.room_id;
         finishLogDefaultData.value.lab_name = subcourse.room_name;


        finishLogFormKey.value++; // Use renamed state to force form remount
    } catch (err) {
        console.error("Failed to fetch default student log for final step:", err);
        finishLogDefaultError.value = err.response?.data?.error || err.message || 'Unknown error'; // Use renamed state
    } finally {
        isLoadingFinishLogDefaults.value = false; // Use renamed state
    }
};

const closeFinishLogModal = () => {
    showFinishLogModal.value = false;
    selectedSubcourseForFinishLog.value = null;
    finishLogDefaultData.value = null;
    finishLogDefaultError.value = null;
    isSavingFinishLog.value = false;
};

const handleFinishLogSave = async (logData) => {
    console.log("Attempting to save FINAL log:", logData);
    isSavingFinishLog.value = true;
    finishLogDefaultError.value = null;

    try {
        let response;
        // Use the *original* dataService calls for create/update StudentLog
        if (logData.id) {
            // Update existing log (student cannot change id, confirms, tea_note, tea_name)
            // API should ideally ignore attempts to change these from student endpoint
            response = await dataService.updateStudentLog(logData.id, logData);
            console.log("Final log updated:", response.data);
        } else {
            // Create new log
            // Ensure essential fields are included for create
            const payload = {
                // id is null for create
                stu_id: authStore.user.userId,
                stu_name: authStore.user.realname,
                subcourse_id: selectedSubcourseForFinishLog.value.id,
                room_id: selectedSubcourseForFinishLog.value.room_id,
                lab_name: selectedSubcourseForFinishLog.value.room_name,
                seat: logData.seat, // Get seat from the form data
                note: logData.note, // Get note from the form data
                tea_note: '', // Student cannot set teacher note on create
                tea_name: '', // Student cannot set teacher name on create
                // fin_time and confirm should be set by backend on creation (fin_time = now, confirm = 0)
            };
             console.log("Creating new final log with payload:", payload);
            response = await dataService.createStudentLog(payload);
             console.log("New final log created:", response.data);
        }

        closeFinishLogModal();
        // After saving the final log, refresh the status for this specific subcourse
        // using the student-specific API.
        if (selectedSubcourseForFinishLog.value?.id) {
             // Fetch just the one log for the subcourse we just saved for
            await fetchStudentFinalLogStatusesForMyCourses([selectedSubcourseForFinishLog.value.id]);
        }
        // Optional: Show a success notification
         alert("Final log saved successfully!");

    } catch (err) {
        console.error("Failed to save final student log:", err);
        const errorMsg = err.response?.data?.error || err.message || 'Unknown error during save';
        finishLogDefaultError.value = errorMsg;
        // alert(`Error saving final log: ${errorMsg}`); // Alert might be annoying
    } finally {
        isSavingFinishLog.value = false;
    }
};


// --- Watchers and Lifecycle ---
watch(() => authStore.isAuthenticated, async (isAuth) => {
    console.log(`Auth state changed: ${isAuth}`);
    if (isAuth) {

        if (authStore.isTeacher || authStore.isStudent) {
            await fetchMyCourses(); // Wait for courses to fetch
        }
        // Fetch semester info if not already loaded/loading (handled by store persistence/init)
        if (!semesterStore.currentSemester && !semesterStore.isSemesterLoading) {
             semesterStore.fetchCurrentSemester(); // No need to await this here
        }
    } else {
        // Clear data on logout
        myCourses.value = [];
        myCoursesError.value = null;
        isLoadingMyCourses.value = false;
        studentFinalLogBySubcourse.value = {}; // Clear log statuses state
        isLoadingFinalLogStatuses.value = false; // Clear log loading state
        finalLogStatusesError.value = null; // Clear log error state
        // Optionally reset semester info if needed, but store might handle it
        console.log("User logged out, cleared courses and logs.");
    }
}, { immediate: true }); // Run immediately on component mount and auth state change

// Fetch semester info on mount if not already present
onMounted(() => {
     // Initial fetch for courses and semester is handled by the watcher with immediate: true
     // and the watcher now waits for authStore.fetchUser()
     // No need to duplicate fetchMyCourses or semesterStore.fetchCurrentSemester here
});

</script>

<style scoped>
/* Add specific styles for the dashboard view if needed */
</style>
