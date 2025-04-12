// src/components/CourseScheduleTab.vue
<template>
    <div>
        <h2 class="text-xl font-semibold mb-4">Course Schedule</h2>

        <!-- Teacher Controls: Add Button -->
        <div v-if="isTeacher" class="text-right mb-4">
            <button class="btn btn-sm btn-primary" @click="openAddModal">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                Add Schedule Item
            </button>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-10">
            <span class="loading loading-lg loading-spinner text-primary"></span>
            <p class="mt-2">Loading schedule...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="alert alert-error shadow-lg">
             <div>
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>Error loading schedule: {{ error.message || error }}</span>
            </div>
        </div>

        <!-- Schedule List / Table -->
         <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow-md">
             <table class="table table-zebra w-full table-sm">
                 <thead>
                     <tr>
                         <th class="w-16 text-center">Week</th>
                         <th>Topic / Name</th>
                         <th>Requirement / Details</th>
                         <th v-if="isTeacher" class="w-20">Actions</th>
                     </tr>
                 </thead>
                 <tbody>
                     <tr v-if="sortedSchedules.length === 0">
                         <td :colspan="isTeacher ? 4 : 3" class="text-center italic py-4">
                             No schedule items found for this course.
                         </td>
                     </tr>
                     <tr v-for="item in sortedSchedules" :key="item.id">
                         <td class="text-center">{{ item.week }}</td>
                         <td>{{ item.name }}</td>
                         <td>{{ item.requirement || '-' }}</td>
                         <td v-if="isTeacher">
                             <div class="flex gap-1 justify-center">
                                 <button
                                     class="btn btn-xs btn-ghost btn-circle"
                                     title="Edit"
                                     @click="openEditModal(item)"
                                 >
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                 </button>
                                 <button
                                     class="btn btn-xs btn-ghost btn-circle text-error"
                                     title="Delete"
                                     @click="openDeleteModal(item)"
                                 >
                                     <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                 </button>
                             </div>
                         </td>
                     </tr>
                 </tbody>
             </table>
         </div>

         <!-- Add/Edit Modal -->
         <dialog id="schedule_modal" class="modal" :open="showAddModal || showEditModal">
            <div class="modal-box w-11/12 max-w-2xl">
                <h3 class="font-bold text-lg">{{ isEditing ? 'Edit Schedule Item' : 'Add Schedule Item' }}</h3>
                 <ScheduleForm
                    :key="formKey"
                    :initial-data="currentItem"
                    :is-saving="isSaving"
                    :course-id="courseId"
                    @save="handleSave"
                    @close="closeModal"
                    class="py-4"
                />
                <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeModal">✕</button>
            </div>
            <form method="dialog" class="modal-backdrop">
                <button @click="closeModal">close</button>
            </form>
        </dialog>

         <!-- Confirm Delete Modal -->
        <ConfirmDialog
            :show="showDeleteModal"
            dialogId="schedule_delete_confirm_modal"
            title="Delete Schedule Item"
            :message="deleteConfirmationMessage"
            @confirm="handleDelete"
            @close="closeModal"
        />

    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import * as dataService from '@/services/dataService';
import ScheduleForm from '@/components/ScheduleForm.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
});

const authStore = useAuthStore();

const schedules = ref([]);
const isLoading = ref(true);
const error = ref(null);
const isSaving = ref(false);

// Modal states
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const currentItem = ref(null); // Holds the schedule item being edited/deleted
const formKey = ref(0);

// Computed properties
const isTeacher = computed(() => authStore.isTeacher);
const isEditing = computed(() => !!currentItem.value && showEditModal.value);

// Sort schedules by week number
const sortedSchedules = computed(() => {
    return [...schedules.value].sort((a, b) => a.week - b.week);
});

// Dynamic delete confirmation message
const deleteConfirmationMessage = computed(() => {
    if (!currentItem.value) return 'Are you sure?';
    return `Are you sure you want to delete the schedule item for Week ${currentItem.value.week}: "${currentItem.value.name}"?`;
});


// Fetch schedules logic
const fetchSchedules = async () => {
    if (!props.courseId) {
        error.value = new Error("Course ID is missing.");
        isLoading.value = false;
        return;
    }
    isLoading.value = true;
    error.value = null;
    try {
        const response = await dataService.getSchedules(props.courseId);
        schedules.value = response.data || [];
    } catch (err) {
        console.error("Failed to fetch schedules:", err);
        error.value = err.response?.data || err;
        schedules.value = [];
    } finally {
        isLoading.value = false;
    }
};

// --- Modal Operations ---
const openAddModal = () => {
    currentItem.value = null;
    formKey.value++; // Reset form
    showAddModal.value = true;
};

const openEditModal = (scheduleItem) => {
    currentItem.value = { ...scheduleItem }; // Copy
    formKey.value++; // Reset form with new initial data
    showEditModal.value = true;
};

const openDeleteModal = (scheduleItem) => {
    currentItem.value = scheduleItem;
    showDeleteModal.value = true;
};

const closeModal = () => {
    showAddModal.value = false;
    showEditModal.value = false;
    showDeleteModal.value = false;
    currentItem.value = null;
    isSaving.value = false;
};

// --- CRUD Handlers ---
const handleSave = async (formData) => {
    if (!isTeacher.value) return;
    isSaving.value = true;
    error.value = null; // Clear previous list errors

    try {
        if (isEditing.value) {
            await dataService.updateSchedule(currentItem.value.id, formData);
        } else {
            await dataService.createSchedule(formData);
        }
        closeModal();
        await fetchSchedules(); // Refresh list
        // TODO: Add success notification
    } catch (err) {
        console.error("Failed to save schedule:", err);
        // Display error to user (e.g., in modal or as toast)
        alert(`Failed to save: ${err.response?.data?.error || err.message}`);
        // Maybe set a form-specific error instead of list error?
    } finally {
        isSaving.value = false;
    }
};

const handleDelete = async () => {
    if (!isTeacher.value || !currentItem.value) return;

    // Optional: Set a deleting state if needed
    try {
        await dataService.deleteSchedule(currentItem.value.id);
        closeModal();
        await fetchSchedules(); // Refresh list
         // TODO: Add success notification
    } catch (err) {
        console.error("Failed to delete schedule:", err);
        alert(`Failed to delete: ${err.response?.data?.error || err.message}`);
         // Display error
        closeModal(); // Close confirm dialog even on error
    } finally {
        // Reset deleting state if used
    }
};

// --- Watchers ---
watch(() => props.courseId, (newCourseId, oldCourseId) => {
    if (newCourseId && newCourseId !== oldCourseId) {
        fetchSchedules();
    }
}, { immediate: true }); // Fetch immediately when component mounts/courseId is available

// --- Lifecycle Hook ---
// onMounted is implicitly handled by the immediate watcher

</script>

<style scoped>
/* Add styles if needed, e.g., for the prose class */
.prose {
    /* You might want to override default prose margins/padding */
}
</style>
