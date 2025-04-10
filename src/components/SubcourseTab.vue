<template>
  <div>
    <!-- Teacher Controls: Add Button and Semester Toggle -->
    <div v-if="isTeacher" class="flex justify-between items-center mb-4 p-4 bg-base-200 rounded-lg">
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
     <div v-else-if="semesterStore.semesterError && !isTeacher" class="alert alert-warning shadow-sm mb-4">
        Could not load current semester details. Cannot display groups.
        <pre class="text-xs mt-1">{{ semesterStore.semesterError }}</pre>
     </div>
     <!-- Semester Loaded or Teacher can override -->
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
            <table class="table table-zebra w-full">
                <thead>
                <tr>
                    <th>Day</th>
                    <th>Room</th>
                    <th>Teacher</th>
                    <th>Limit</th>
                    <th v-if="showAllSemesters && isTeacher">Semester ID</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                <tr v-if="subcourses.length === 0">
                    <td :colspan="isTeacher ? (showAllSemesters ? 4 : 3) : 2" class="text-center italic py-4">
                        No groups found for {{ showAllSemesters && isTeacher ? 'any semester' : 'the current semester' }}.
                    </td>
                </tr>
                <tr v-for="subcourse in subcourses" :key="subcourse.id">
                    <td>{{ getWeekdayName(subcourse.weekday) }}</td>
                    <td>
                        <span v-if="isLoadingLabrooms" class="text-xs italic">Loading room...</span>
                        <span v-else-if="labroomError" class="text-xs text-error" :title="labroomError">Room Error</span>
                        <span v-else>{{ getRoomName(subcourse.room_id) }}</span>
                    </td>
                    <td>{{ subcourse.tea_name }}</td>
                    <td>{{ subcourse.stu_limit }}</td>

                    <td v-if="showAllSemesters && isTeacher">{{ subcourse.semester_id }}</td>
                    <td>
                        <div class="flex gap-1" v-if="isTeacher">
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
import * as dataService from '@/services/dataService';
import SubcourseForm from '@/components/SubcourseForm.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
});

const authStore = useAuthStore();
const semesterStore = useSemesterStore();
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
const currentItem = ref(null); // Holds the subcourse being edited/deleted
const formKey = ref(0); // To force re-render SubcourseForm if needed

// Teacher-specific state
const showAllSemesters = ref(false);

// Computed properties
const isTeacher = computed(() => authStore.isTeacher);
const isEditing = computed(() => !!currentItem.value && showEditModal.value);

const fetchLabrooms = async () => {
    // Avoid refetching if already loaded or loading
    if (labrooms.value.length > 0 || isLoadingLabrooms.value) return;

    isLoadingLabrooms.value = true;
    labroomError.value = null;
    try {
        const response = await dataService.getLabrooms();
        labrooms.value = response.data || [];
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

const getWeekdayName = (dayNumber) => {
    const days = ['Unknown', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // Index 0 for unknown/error case
    return days[dayNumber] || days[0]; // Return name or 'Unknown'
};

// Fetch subcourses logic
const fetchSubcourses = async () => {
    // Don't fetch if required info is missing and user is not a teacher overriding
    if (!props.courseId || (!semesterStore.getCurrentSemesterId && !isTeacher.value)) {
        if(!isTeacher.value) { // Non-teachers absolutely need the current semester
           console.warn("Missing course ID or current semester ID, skipping subcourse fetch for non-teacher.");
           error.value = new Error("Cannot load groups without current semester information.");
           subcourses.value = [];
           isLoading.value = false;
           return;
        }
        // Teacher might proceed if they toggle "Show All"
        if(!showAllSemesters.value) {
            console.warn("Missing current semester ID, skipping fetch (Teacher needs to check 'Show All' or semester needs to load).");
            subcourses.value = []; // Clear list if semester is needed but missing
            // Keep isLoading potentially true if semester is still loading
            isLoading.value = semesterStore.isSemesterLoading;
            return;
        }
    }


  isLoading.value = true;
  error.value = null;
  console.log(`Fetching subcourses for course ${props.courseId}. All semesters: ${showAllSemesters.value}`);

  const params = {
    course_id: props.courseId,
  };

  if (!showAllSemesters.value || !isTeacher.value) {
      if (semesterStore.getCurrentSemesterId) {
        params.year_id = semesterStore.getCurrentSemesterId;
      } else if (!isTeacher.value) {
        // We already handled this case above, but double check
         console.error("Current semester ID missing for non-teacher.");
         error.value = new Error("Current semester ID is required.");
         isLoading.value = false;
         subcourses.value = [];
         return;
      }
      // If teacher and showAllSemesters is false, but semester ID is missing, we fetch nothing
      // (or backend could default, adjust as needed) - current logic fetches nothing here
      else if (!semesterStore.getCurrentSemesterId) {
          console.warn("Current semester ID missing for teacher, showing none for 'current'.");
          isLoading.value = false;
          subcourses.value = [];
          return;
      }
  }
  // If teacher && showAllSemesters, semester_id is omitted from params

  try {
    const response = await dataService.getSubcourses(params);
    subcourses.value = response.data || [];
  } catch (err) {
    console.error("Failed to fetch subcourses:", err);
    error.value = err.response?.data || err;
    subcourses.value = []; // Clear on error
  } finally {
    isLoading.value = false;
  }
};

// --- Modal Operations ---
const openAddModal = () => {
    if (!semesterStore.getCurrentSemesterId) {
        alert("Current semester information is not available. Cannot add a group.");
        return;
    }
  currentItem.value = null; // Clear for Add form
  formKey.value++; // Reset form
  showAddModal.value = true;
};

const openEditModal = (subcourse) => {
  currentItem.value = { ...subcourse }; // Copy to avoid direct mutation
  formKey.value++; // Reset form with new initial data
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
  isSaving.value = false; // Reset saving state
};

// --- CRUD Handlers ---
const handleSave = async (formData) => {
    if (!isTeacher.value) return; // Belt and suspenders check

    isSaving.value = true;
    error.value = null; // Clear previous errors

    // Ensure essential IDs are present (backend might also validate)
    if(!formData.course_id || !formData.year_id) {
        console.error("Missing course_id or year_id in form data", formData);
        alert("Internal error: Missing required information to save.");
        isSaving.value = false;
        return;
    }


    try {
        if (isEditing.value) {
            await dataService.updateSubcourse(currentItem.value.id, formData);
            // TODO: Add success notification
        } else {
            await dataService.createSubcourse(formData);
            // TODO: Add success notification
        }
        closeModal();
        await fetchSubcourses(); // Refresh list
    } catch (err) {
        console.error("Failed to save subcourse:", err);
        // Display error to user (e.g., in modal or as toast)
        alert(`Failed to save: ${err.response?.data?.error || err.message}`);
        error.value = `Failed to save: ${err.response?.data?.error || err.message}`;
    } finally {
        isSaving.value = false;
    }
};

const handleDelete = async () => {
    if (!isTeacher.value || !currentItem.value) return;

    try {
        await dataService.deleteSubcourse(currentItem.value.id);
        // TODO: Add success notification
        closeModal();
        await fetchSubcourses(); // Refresh list
    } catch (err) {
        console.error("Failed to delete subcourse:", err);
        // Display error
        alert(`Failed to delete: ${err.response?.data?.error || err.message}`);
        error.value = `Failed to delete: ${err.response?.data?.error || err.message}`;
        closeModal(); // Close confirm dialog even on error
    }
};

// --- Watchers ---
// Refetch when teacher toggles semester view
watch(showAllSemesters, (newValue, oldValue) => {
  if (isTeacher.value && newValue !== oldValue) {
    fetchSubcourses();
  }
});

// --- Lifecycle Hook ---
onMounted(() => {
    // Attempt to fetch semester info if not already loading/loaded
    semesterStore.fetchCurrentSemester().then(() => {
        // Now that semester *should* be loaded (or loading), fetch subcourses
        fetchSubcourses();
        fetchLabrooms();
    });
});

</script>

<style scoped>
/* Add any specific styles for this tab component */
</style>
