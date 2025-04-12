<template>
  <div>
    <!-- Teacher Controls -->
    <div v-if="isTeacher || authStore.isAdmin" class="flex justify-between items-center mb-4 p-4 bg-base-200 rounded-lg">
        <div class="form-control">
            <label class="label cursor-pointer gap-2">
                <span class="label-text">Show All Semesters</span>
                <input type="checkbox" class="toggle toggle-primary" v-model="showAllSemesters" />
            </label>
        </div>
        <button class="btn btn-sm btn-primary" @click="openAddModal">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
            Add Group
        </button>
    </div>

    <!-- Loading Semester Info -->
     <div v-if="semesterStore.isSemesterLoading" class="text-center py-5">
       <span class="loading loading-spinner text-info"></span> Loading semester info...
     </div>
     <!-- Error Loading Semester -->
     <div v-else-if="semesterStore.semesterError && !isTeacher && !authStore.isAdmin" class="alert alert-warning shadow-sm mb-4">
        Could not load current semester details. Cannot display groups.
        <pre class="text-xs mt-1">{{ semesterStore.semesterError }}</pre>
     </div>
     <!-- Semester Loaded or Teacher/Admin can override -->
     <div v-else>

        <!-- Loading Subcourses State -->
        <div v-if="isLoading" class="text-center py-10">
            <span class="loading loading-lg loading-spinner text-primary"></span>
            <p class="mt-2">Loading student groups...</p>
        </div>

        <!-- Error Fetching Subcourses State -->
        <div v-else-if="error" class="alert alert-error shadow-lg">
            <div>
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Error loading groups: {{ error.message || error }}</span>
            </div>
        </div>

        <!-- Subcourses Table -->
        <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow-md">
            <!-- Info about student enrollment status -->
            <div v-if="isStudent && !isLoadingMyEnrollment && myEnrollmentError" class="alert alert-warning text-xs p-2 m-2">
                Could not check your current enrollment status: {{ myEnrollmentError }}
            </div>
             <div v-if="isStudent && isLoadingMyEnrollment" class="text-center text-xs p-2 text-info">
                <span class="loading loading-spinner loading-xs"></span> Checking your enrollment...
             </div>

            <table class="table table-zebra w-full">
                <thead>
                <tr>
                    <th>上课时间</th>
                    <th>地点</th>
                    <th>教师</th>
                    <th>人数上限</th>
                    <th v-if="showAllSemesters && (isTeacher || authStore.isAdmin)">学期</th>
                    <th v-if="authStore.user">操作</th>
                </tr>
                </thead>
                <tbody>
                 <!-- No groups message -->
                <tr v-if="subcourses.length === 0">
                    <td :colspan="tableColumnCount" class="text-center italic py-4">
                         <!-- Adjusted no groups message -->
                        No groups found for {{ (showAllSemesters && (isTeacher || authStore.isAdmin)) ? 'any selected semester' : 'the current semester' }}.
                    </td>
                </tr>
                <!-- Loop through filtered subcourses -->
                <tr v-for="subcourse in subcourses" :key="subcourse.id">
                    <td>{{ getWeekdayName(subcourse.weekday) }}</td>
                    <td>
                        <span v-if="isLoadingLabrooms" class="text-xs italic">Loading room...</span>
                        <span v-else-if="labroomError" class="text-xs text-error" :title="labroomError">Room Error</span>
                        <span v-else>{{ getRoomName(subcourse.room_id) }}</span>
                    </td>
                    <td>{{ subcourse.tea_name }}</td>
                    <td>{{ subcourse.stu_limit }}</td>

                    <!-- Teacher/Admin Column: Semester ID (if showing all) -->
                    <td v-if="showAllSemesters && (isTeacher || authStore.isAdmin)">{{ subcourse.year_id }}</td>

                    <!-- Actions Column -->
                    <td class="whitespace-nowrap">
                        <div class="flex gap-1 items-center" v-if="authStore.user">

                            <!-- View Button (Common to Teacher/Admin/Student) -->
                            <router-link
                                :to="{ name: 'SubcourseStudents', params: { id: subcourse.id } }"
                                class="btn btn-xs btn-ghost btn-circle"
                                title="View Students"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </router-link>

                            <!-- Teacher/Admin Specific Buttons -->
                            <template v-if="isTeacher || authStore.isAdmin">
                                <button
                                    class="btn btn-xs btn-ghost btn-circle"
                                    title="Edit"
                                    @click="openEditModal(subcourse)"
                                >
                                   <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button
                                    class="btn btn-xs btn-ghost btn-circle text-error"
                                    title="Delete"
                                    @click="openDeleteModal(subcourse)"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </template>

                            <!-- Student Specific Buttons -->
                            <template v-else-if="isStudent">
                                <!-- Leave Button -->
                                <button
                                    v-if="myEnrolledSubcourseId === subcourse.id"
                                    class="btn btn-xs btn-warning btn-circle"
                                    title="Leave Group"
                                    @click="handleLeaveGroup(subcourse.id)"
                                    :disabled="isProcessingAction"
                                    :class="{ 'loading': isProcessingAction && processingSubcourseId === subcourse.id }"
                                >
                                    <span v-if="!(isProcessingAction && processingSubcourseId === subcourse.id)">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </span>
                                </button>
                                <!-- Join Button -->
                                <button
                                    v-else-if="myEnrolledSubcourseId === null"
                                    class="btn btn-xs btn-success btn-circle"
                                    title="Join Group"
                                    @click="handleJoinGroup(subcourse.id)"
                                    :disabled="isProcessingAction || isLoadingMyEnrollment"
                                    :class="{ 'loading': isProcessingAction && processingSubcourseId === subcourse.id }"
                                >
                                     <span v-if="!(isProcessingAction && processingSubcourseId === subcourse.id)">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                           <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                     </span>
                                </button>
                            </template>
                        </div>
                    </td>
                </tr>
                </tbody>
            </table>
        </div>

     </div> <!-- End Semester Loaded block -->

    <!-- Add/Edit Modal -->
     <dialog id="subcourse_modal" class="modal" :open="showAddModal || showEditModal">
        <div class="modal-box w-11/12 max-w-lg">
            <h3 class="font-bold text-lg">{{ isEditing ? 'Edit Group' : 'Add New Group' }}</h3>
             <SubcourseForm
                v-if="semesterStore.getCurrentSemesterId || currentItem?.semester_id"
                :key="formKey"
                :initial-data="currentItem"
                :is-saving="isSaving"
                :course-id="courseId"
                :semester-id="currentItem?.semester_id || semesterStore.getCurrentSemesterId"
                :user-id="authStore.user?.userId || ''"
                :realname="authStore.user?.realname || ''"
                :is-admin="authStore.isAdmin"
                @save="handleSave"
                @close="closeModal"
                class="py-4"
            />
            <p v-else class="text-error py-4">Cannot determine semester ID for the form.</p>
            <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeModal">✕</button>
        </div>
        <form method="dialog" class="modal-backdrop">
            <button @click="closeModal">close</button>
        </form>
     </dialog>

    <!-- Confirm Delete Modal -->
    <ConfirmDialog
        :show="showDeleteModal"
        dialogId="subcourse_delete_confirm_modal"
        title="Delete Group"
        :message="`Are you sure you want to delete the group for '${currentItem?.tea_name}'? This cannot be undone.`"
        @confirm="handleDelete"
        @close="closeModal"
    />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted} from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSemesterStore } from '@/stores/semester';
import { getWeekdayName } from '@/utils/weekday';
import * as dataService from '@/services/dataService';
import SubcourseForm from '@/components/SubcourseForm.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
// Import a notification library if you use one (e.g., vue-toastification)
// import { useToast } from 'vue-toastification';

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
});

const authStore = useAuthStore();
const semesterStore = useSemesterStore();
// const toast = useToast(); // If using vue-toastification

const subcourses = ref([]);
const isLoading = ref(true);
const error = ref(null);
const isSaving = ref(false); // For form submission state

const labrooms = ref([]);
const isLoadingLabrooms = ref(false);
const labroomError = ref(null);

// Modal states
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const currentItem = ref(null);
const formKey = ref(0);

// Teacher-specific state
const showAllSemesters = ref(false);

// --- NEW: Student Enrollment State ---
const myEnrolledSubcourseId = ref(null); // ID of the subcourse the student is in for THIS course
const isLoadingMyEnrollment = ref(false);
const myEnrollmentError = ref(null);
const isProcessingAction = ref(false); // Disables buttons during join/leave
const processingSubcourseId = ref(null); // Track which button shows loading spinner

// Computed properties
const isTeacher = computed(() => authStore.isTeacher);
const isAdmin = computed(() => authStore.isAdmin);
const isStudent = computed(() => authStore.isStudent);
const isEditing = computed(() => !!currentItem.value && showEditModal.value);

// Calculate colspan dynamically for the "No groups found" message
const tableColumnCount = computed(() => {
    let count = 4; // Base columns: Time, Place, Teacher, Limit
    if (isStudent.value) count++; // Add Enrollment count column
    if ((isTeacher.value || isAdmin.value) && showAllSemesters.value) count++; // Add Semester column
    count++; // Add Actions column
    return count;
});


// Fetch Labrooms (existing)
const fetchLabrooms = async () => {
    if (labrooms.value.length > 0 || isLoadingLabrooms.value) return;
    isLoadingLabrooms.value = true;
    labroomError.value = null;
    try {
        const response = await dataService.getLabrooms();
        labrooms.value = response.data?.data || response.data || []; // Adjust based on your API response structure
    } catch (err) {
        console.error("Failed to fetch lab rooms in Tab:", err);
        labroomError.value = `Error loading rooms: ${err.response?.data?.error || err.message}`;
    } finally {
        isLoadingLabrooms.value = false;
    }
};

const getRoomName = (roomId) => {
    if (!roomId || labrooms.value.length === 0) return 'N/A';
    const room = labrooms.value.find(r => r.id === roomId);
    return room ? `${room.name} (${room.room})` : `Unknown Room (ID: ${roomId})`;
};

// Fetch subcourses logic (Slightly adjusted for clarity)
const fetchSubcourses = async () => {
    isLoading.value = true;
    error.value = null;
    subcourses.value = []; // Clear previous results

    // Determine semester ID to fetch
    let semesterIdToFetch = null;
    if (isTeacher.value || isAdmin.value) {
        if (!showAllSemesters.value) {
            semesterIdToFetch = semesterStore.getCurrentSemesterId;
            if (!semesterIdToFetch) {
                console.warn("Current semester ID missing for teacher/admin, showing none for 'current'.");
                isLoading.value = false;
                return; // Don't fetch if specific semester needed but ID unknown
            }
        }
        // If showAllSemesters is true, semesterIdToFetch remains null (fetch all)
    } else {
        // Students ALWAYS need the current semester
        semesterIdToFetch = semesterStore.getCurrentSemesterId;
        if (!semesterIdToFetch) {
            console.error("Current semester ID missing for student.");
            error.value = "Current semester information is required to view groups.";
            isLoading.value = false;
            return;
        }
    }

    console.log(`Fetching subcourses for course ${props.courseId}, Semester: ${semesterIdToFetch ?? 'All'}`);

    const params = { course_id: props.courseId };
    if (semesterIdToFetch) {
        params.year_id = semesterIdToFetch; // Use 'year_id' as per your previous logic, adjust if API uses 'semester_id'
    }

    try {
        const response = await dataService.getSubcourses(params);
        // Assume response.data contains the array, potentially nested e.g., response.data.data
        subcourses.value = response.data?.data || response.data || [];
        // TODO: Ensure the API response for subcourses includes 'current_students' count if needed for the 'Full' status check.
        // If not, you might need another API call or adjust the backend.
    } catch (err) {
        console.error("Failed to fetch subcourses:", err);
        error.value = err.response?.data?.error || err.message || err;
    } finally {
        isLoading.value = false;
    }
};

// --- NEW: Fetch Student's Enrollment Status ---
const fetchMyEnrollmentStatus = async () => {
    if (!isStudent.value || !props.courseId) {
        myEnrolledSubcourseId.value = null; // Ensure it's null if not a student or no courseId
        return; // Only run for students with a valid courseId
    }

    isLoadingMyEnrollment.value = true;
    myEnrollmentError.value = null;
    myEnrolledSubcourseId.value = null; // Reset before fetching

    try {
        const response = await dataService.getMySubcourses();
        const myEnrollments = response.data?.data || response.data || [];

        // Find if the student is enrolled in a subcourse BELONGING TO THIS courseId
        const enrollmentForThisCourse = myEnrollments.find(
            (enrollment) => enrollment.course_id === props.courseId
        );

        if (enrollmentForThisCourse) {
            // Assuming the enrollment object has the subcourse ID, often just 'id' or 'subcourse_id'
            myEnrolledSubcourseId.value = enrollmentForThisCourse.id
            console.log(`Student enrolled in subcourse ${myEnrolledSubcourseId.value} for course ${props.courseId}`);
        } else {
             console.log(`Student not enrolled in any subcourse for course ${props.courseId}`);
             myEnrolledSubcourseId.value = null;
        }

    } catch (err) {
        console.error("Failed to fetch student enrollment status:", err);
        myEnrollmentError.value = err.response?.data?.error || err.message || 'Could not load enrollment status.';
        myEnrolledSubcourseId.value = null; // Ensure null on error
    } finally {
        isLoadingMyEnrollment.value = false;
    }
};


// --- Modal Operations (existing) ---
const openAddModal = () => {
    // Allow add only if semester known (or admin/teacher override?) - Sticking to current semester for now
    if (!semesterStore.getCurrentSemesterId) {
        alert("Current semester information is not available. Cannot add a group.");
        // toast.warning("Current semester information is not available. Cannot add a group.");
        return;
    }
    currentItem.value = null;
    formKey.value++;
    showAddModal.value = true;
};

const openEditModal = (subcourse) => {
  currentItem.value = { ...subcourse };
  formKey.value++;
  showEditModal.value = true;
};

const openDeleteModal = (subcourse) => {
  currentItem.value = subcourse;
  showDeleteModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  currentItem.value = null;
  isSaving.value = false;
};

// --- CRUD Handlers (Teacher/Admin - existing) ---
const handleSave = async (formData) => {
    if (!isTeacher.value && !isAdmin.value) return;

    isSaving.value = true;
    error.value = null;

    // Ensure essential IDs are present
    if(!formData.course_id || !formData.year_id) {
        console.error("Missing course_id or year_id in form data", formData);
        alert("Internal error: Missing required information to save.");
        // toast.error("Internal error: Missing required information to save.");
        isSaving.value = false;
        return;
    }

    try {
        let message = '';
        if (isEditing.value) {
            await dataService.updateSubcourse(currentItem.value.id, formData);
            message = 'Group updated successfully!';
        } else {
            await dataService.createSubcourse(formData);
             message = 'Group added successfully!';
        }
        // toast.success(message);
        // alert(message); // Simple alert for now
        closeModal();
        await fetchSubcourses(); // Refresh list
    } catch (err) {
        console.error("Failed to save subcourse:", err);
        const errorMsg = `Failed to save: ${err.response?.data?.error || err.message}`;
        alert(errorMsg);
        // toast.error(errorMsg);
        error.value = errorMsg; // Can display this elsewhere if needed
    } finally {
        isSaving.value = false;
    }
};

const handleDelete = async () => {
    if (!isTeacher.value && !isAdmin.value || !currentItem.value) return;

    try {
        await dataService.deleteSubcourse(currentItem.value.id);
        // toast.success(message);
        closeModal();
        await fetchSubcourses(); // Refresh list
    } catch (err) {
        console.error("Failed to delete subcourse:", err);
        const errorMsg = `Failed to delete: ${err.response?.data?.error || err.message}`;
        alert(errorMsg);
        // toast.error(errorMsg);
        error.value = errorMsg;
        closeModal();
    }
};

// --- NEW: Student Action Handlers ---
const handleJoinGroup = async (subcourseId) => {
    if (!isStudent.value || isProcessingAction.value) return;

    isProcessingAction.value = true;
    processingSubcourseId.value = subcourseId; // For loading indicator on the specific button
    myEnrollmentError.value = null; // Clear previous errors

    try {
        await dataService.joinGroup(subcourseId);
        myEnrolledSubcourseId.value = subcourseId; // Update state immediately
        // Optionally refetch subcourses if 'current_students' needs updating visually
        await fetchSubcourses();
        // toast.success("Successfully joined the group!");
    } catch (err) {
        console.error("Failed to join group:", err);
        const errorMsg = `Failed to join: ${err.response?.data?.error || err.message}`;
        // toast.error(errorMsg);
        alert(errorMsg);
        myEnrollmentError.value = errorMsg; // Show error near table potentially
    } finally {
        isProcessingAction.value = false;
        processingSubcourseId.value = null;
    }
};

const handleLeaveGroup = async (subcourseId) => {
     if (!isStudent.value || isProcessingAction.value) return;

    isProcessingAction.value = true;
    processingSubcourseId.value = subcourseId;
    myEnrollmentError.value = null;

    try {
        await dataService.leaveGroup(subcourseId);
        myEnrolledSubcourseId.value = null; // Update state immediately
         // Optionally refetch subcourses if 'current_students' needs updating visually
        await fetchSubcourses();
        // toast.success("Successfully left the group.");
    } catch (err) {
        console.error("Failed to leave group:", err);
         const errorMsg = `Failed to leave: ${err.response?.data?.error || err.message}`;
        // toast.error(errorMsg);
        alert(errorMsg);
        myEnrollmentError.value = errorMsg;
    } finally {
        isProcessingAction.value = false;
        processingSubcourseId.value = null;
    }
};


// --- Watchers ---
// Refetch when teacher toggles semester view
watch(showAllSemesters, (newValue, oldValue) => {
  // Only trigger refetch if the user is a teacher/admin changing the view
  if ((isTeacher.value || isAdmin.value) && newValue !== oldValue) {
    fetchSubcourses();
  }
});

// Refetch subcourses if courseId changes
watch(() => props.courseId, (newCourseId, oldCourseId) => {
    if (newCourseId !== oldCourseId && newCourseId) {
        console.log(`Course ID changed to ${newCourseId}, refetching data.`);
        // Ensure semester info is potentially re-checked or already available
         semesterStore.fetchCurrentSemester().then(() => {
            fetchSubcourses();
            if (isStudent.value) {
                fetchMyEnrollmentStatus(); // Also refresh enrollment status for the new course
            }
        });
         fetchLabrooms(); // Might not be necessary if labrooms are global, but safe to include
    }
});

// --- Lifecycle Hook ---
onMounted(() => {
    fetchLabrooms(); // Fetch rooms early
    // Ensure semester info is loaded first
    semesterStore.fetchCurrentSemester().then(() => {
        // Fetch subcourses based on initial state (current semester or all if teacher toggle is on)
        fetchSubcourses();
        // If user is a student, fetch their enrollment status for this course
        if (isStudent.value) {
            fetchMyEnrollmentStatus();
        }
    }).catch(err => {
        // Handle potential error during initial semester fetch if needed
        console.error("Error fetching semester on mount:", err);
        // Error will be displayed via semesterStore.semesterError binding
    });
});

</script>

<style scoped>
/* Add any specific styles */
.loading {
    /* Ensure loading spinner replaces text or adjust layout */
    /* Example: */
    /* display: inline-block; */
    /* vertical-align: middle; */
}
</style>
