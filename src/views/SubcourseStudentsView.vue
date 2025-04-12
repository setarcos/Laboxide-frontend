<template>
  <div class="container mx-auto px-4 py-8">

    <!-- Back Button -->
    <div class="mb-6">
      <button @click="goBack" class="btn btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back
      </button>
    </div>

    <!-- Loading State (Subcourse Info) -->
     <div v-if="isLoadingSubcourse" class="text-center py-5">
       <span class="loading loading-spinner text-info"></span> Loading group details...
     </div>
     <!-- Error State (Subcourse Info) -->
      <div v-else-if="subcourseError" class="alert alert-warning shadow-sm mb-4">
          Could not load group details: {{ subcourseError.message || subcourseError }}
      </div>
     <!-- Subcourse Info Display (hidden for now) -->
     <div v-else-if="subcourse" class="mb-6 p-4 bg-base-200 rounded-lg shadow" hidden>
         <h1 class="text-2xl font-bold mb-2">Students in Group</h1>
         <p><strong>Course:</strong> {{ subcourse.name || 'N/A' }}</p>
         <p><strong>Teacher:</strong> {{ subcourse.tea_name }}</p>
         <p><strong>Day:</strong> {{ getWeekdayName(subcourse.weekday) }}</p>
         <p><strong>Room:</strong> {{ subcourse.room || 'N/A' }}</p>
     </div>

    <!-- Main Content: Student List -->
    <h2 class="text-xl font-semibold mb-4">Enrolled Students</h2>

    <!-- Loading State (Student List) -->
    <div v-if="isLoadingStudents" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
      <p class="mt-2">Loading student list...</p>
    </div>

    <!-- Error State (Student List) -->
    <div v-else-if="studentsError" class="alert alert-error shadow-lg">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Error loading students: {{ studentsError.message || studentsError }}</span>
      </div>
    </div>

    <!-- Student Table -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow">
        <table class="table table-zebra w-full table-sm">
            <thead>
                <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th class="text-center">Seat</th>
                    <th v-if="isTeacher">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="students.length === 0">
                    <td colspan="3" class="text-center italic py-4">
                        No students enrolled in this group yet.
                    </td>
                </tr>
                <tr v-for="student in students" :key="student.id">
                    <td>{{ student.stu_id }}</td>
                    <td>{{ student.stu_name }}</td>
                    <td class="text-center">{{ student.seat ?? '-' }}</td>
                    <td v-if="isTeacher" class="whitespace-nowrap">
                        <div class="flex gap-1 items-center">
                             <button
                                v-if="isTeacher"
                                class="btn btn-xs btn-success text-error"
                                title="Remove Student from Group"
                                @click="openRemoveConfirm(student)"
                                :disabled="isRemovingStudent"
                                :class="{ 'loading': isRemovingStudent && studentToRemove?.stu_id === student.stu_id }"
                              > Del
                              </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <!-- Remove Student Confirmation Modal -->
    <ConfirmDialog
      :show="showRemoveConfirmDialog"
      dialogId="student_remove_confirm_modal"
      title="Remove Student"
      :message="removeConfirmationMessage"
      @confirm="handleRemoveStudent"
      @close="closeRemoveConfirm"
   />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { getWeekdayName } from '@/utils/weekday';
import * as dataService from '@/services/dataService';
import { useAuthStore } from '@/stores/auth'; // Import Auth Store
import ConfirmDialog from '@/components/ConfirmDialog.vue'; // Import Confirm Dialog

const props = defineProps({
  id: { // Corresponds to the :id route parameter (subcourse ID)
    type: [String, Number],
    required: true
  }
});

const router = useRouter();
const authStore = useAuthStore();

const subcourse = ref(null); // To store details of the specific subcourse/group
const students = ref([]);
const isLoadingSubcourse = ref(false);
const isLoadingStudents = ref(true); // Start loading students immediately
const subcourseError = ref(null);
const studentsError = ref(null);

// --- State for Remove Student Action ---
const showRemoveConfirmDialog = ref(false);
const studentToRemove = ref(null); // Stores the student object being removed
const isRemovingStudent = ref(false);
const removeError = ref(null); // To display errors specifically from removal

// --- Computed Properties ---
const isTeacher = computed(() => authStore.isTeacher);

// Computed property for the remove confirmation message
const removeConfirmationMessage = computed(() => {
  if (!studentToRemove.value) {
    return 'Are you sure you want to remove this student?';
  }
  return `Are you sure you want to remove student '${studentToRemove.value.stu_name}' (ID: ${studentToRemove.value.stu_id}) from this group?`;
});

// --- Data Fetching ---
const fetchSubcourseDetails = async () => {
    isLoadingSubcourse.value = true;
    subcourseError.value = null;
    try {
        // Fetch details of the specific subcourse for context display
        const response = await dataService.getSubcourse(props.id);
        subcourse.value = response.data;
        // Optionally fetch related room name here if needed and not included
        // if (subcourse.value?.room_id) {
        //   const roomRes = await dataService.getLabroom(subcourse.value.room_id);
        //   subcourse.value.room_name = roomRes.data ? `${roomRes.data.name} (${roomRes.data.room})` : 'N/A';
        // }
    } catch (err) {
        console.error(`Failed to fetch subcourse details ${props.id}:`, err);
        subcourseError.value = err.response?.data || err;
    } finally {
        isLoadingSubcourse.value = false;
    }
};

const fetchStudents = async () => {
    isLoadingStudents.value = true;
    studentsError.value = null;
    students.value = []; // Clear previous results
    try {
        // Use the getGroup API call with the subcourse ID from props
        const response = await dataService.getGroup(props.id);
        students.value = response.data || []; // Ensure it's an array
    } catch (err) {
        console.error(`Failed to fetch students for group ${props.id}:`, err);
        studentsError.value = err.response?.data || err;
    } finally {
        isLoadingStudents.value = false;
    }
};

// --- Remove Student Logic ---
const openRemoveConfirm = (student) => {
    studentToRemove.value = student;
    showRemoveConfirmDialog.value = true;
};

const closeRemoveConfirm = () => {
    showRemoveConfirmDialog.value = false;
    studentToRemove.value = null;
    removeError.value = null; // Clear error when closing
};

const handleRemoveStudent = async () => {
    if (!studentToRemove.value || !isTeacher.value) return;

    isRemovingStudent.value = true;
    removeError.value = null; // Clear previous errors
    const subcourseId = props.id;
    const studentIdToRemove = studentToRemove.value.stu_id;

    try {
        await dataService.teacherRemove(subcourseId, studentIdToRemove);
        // Success!
        closeRemoveConfirm(); // Close the dialog
        await fetchStudents(); // Refresh the student list
        // TODO: Add success notification (e.g., toast)
        alert(`Successfully removed student ${studentIdToRemove}.`); // Simple alert for now

    } catch (err) {
        console.error(`Failed to remove student ${studentIdToRemove} from group ${subcourseId}:`, err);
        removeError.value = err.response?.data || err; // Store error to display
        // Keep the dialog open? Or close it? Closing for now.
        closeRemoveConfirm();
        // TODO: Add error notification (e.g., toast)
         alert(`Failed to remove student: ${removeError.value.message || 'Unknown error'}`); // Simple alert
    } finally {
        isRemovingStudent.value = false;
        // studentToRemove.value = null; // Already handled in closeRemoveConfirm
    }
};

// --- Navigation ---
const goBack = () => {
  router.back(); // Or router.push({ name: 'CourseDetail', params: { courseId: subcourse.value?.course_id }}) if you want explicit back
};

// --- Lifecycle Hook ---
onMounted(() => {
//  fetchSubcourseDetails(); // Fetch subcourse details for context
  fetchStudents(); // Fetch the student list
});
</script>

<style scoped>
/* Add any specific styles for this view */
</style>
