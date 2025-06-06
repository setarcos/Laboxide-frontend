// src/components/CourseScheduleTab.vue
<template>
  <div>
    <!-- Teacher Controls: Add Button (Main Schedule) -->
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
            <th class="w-10"></th> <!-- Column for expand toggle -->
            <th class="w-16 text-center">Week</th>
            <th>Topic / Name</th>
            <th>Requirement / Details</th>
            <th v-if="isTeacher" class="w-20">Actions</th>
          </tr>
        </thead>
        <!-- Use template v-for to group main row and sub-schedule row -->
        <template v-for="item in sortedSchedules" :key="item.id">
          <!-- Main Schedule Row -->
          <tr class="hover">
            <td class="w-10 text-center">
              <button
                class="btn btn-xs btn-ghost btn-circle"
                :title="isExpanded(item.id) ? 'Collapse steps' : 'Expand steps'"
                @click="toggleSubSchedules(item)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform duration-200" :class="{ 'rotate-90': isExpanded(item.id) }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </td>
            <td class="text-center">{{ item.week }}</td>
            <td>{{ item.name }}</td>
            <td>{{ item.requirement || '-' }}</td>
            <td v-if="isTeacher">
              <div class="flex gap-1 justify-center">
                <button
                  class="btn btn-xs btn-ghost btn-circle"
                  title="Edit Main Item"
                  @click="openEditModal(item)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button
                  class="btn btn-xs btn-ghost btn-circle text-error"
                  title="Delete Main Item"
                  @click="openDeleteModal(item)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
          <!-- Sub-Schedule Row (Conditional) -->
          <tr v-if="isExpanded(item.id)">
            <td :colspan="isTeacher ? 5 : 4" class="bg-base-200 p-0">
              <div class="px-4 py-3">
                <!-- Sub-schedule Loading -->
                <div v-if="item.isLoadingSubs" class="text-center py-2">
                  <span class="loading loading-sm loading-spinner text-info"></span> Loading steps...
                </div>
                <!-- Sub-schedule Error -->
                <div v-else-if="item.subError" class="alert alert-warning alert-sm shadow-sm p-2">
                  <div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-4 w-4" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>Failed to load steps: {{ item.subError }}</span>
                  </div>
                </div>
                <!-- Sub-schedule List -->
                <div v-else>
                  <h4 class="text-sm font-semibold mb-2 ml-2">Steps:</h4>
                  <ul v-if="item.subschedules && item.subschedules.length > 0" class="list-none pl-4 space-y-1">
                    <li v-for="subItem in item.subschedules" :key="subItem.id" class="flex items-center justify-between text-sm hover:bg-base-100 rounded p-1">
                      <span class="flex-grow">
                        <span class="font-mono bg-base-300 rounded px-1.5 py-0.5 mr-2 text-xs">{{ subItem.step }}</span>
                        {{ subItem.title }}
                      </span>
                      <div v-if="isTeacher" class="flex gap-1 flex-shrink-0 ml-2">
                        <button
                          class="btn btn-xs btn-ghost btn-circle"
                          title="Edit Step"
                          @click="openEditSubModal(subItem, item)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          class="btn btn-xs btn-ghost btn-circle text-error"
                          title="Delete Step"
                          @click="openDeleteSubModal(subItem, item)"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </li>
                  </ul>
                  <p v-else class="text-xs italic pl-4 text-base-content/70">No steps defined yet.</p>

                  <!-- Add Sub-schedule Button -->
                  <div v-if="isTeacher" class="text-right mt-2">
                    <button class="btn btn-sm btn-outline btn-info" @click="openAddSubModal(item)">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                      Add Step
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>
        <!-- Empty State for Main Schedule -->
        <tr v-if="!isLoading && sortedSchedules.length === 0">
          <td :colspan="isTeacher ? 5 : 4" class="text-center italic py-4">
            No schedule items found for this course.
          </td>
        </tr>
      </table>
    </div>

    <!-- Add/Edit MAIN Schedule Modal -->
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

    <!-- Confirm Delete MAIN Schedule Modal -->
    <ConfirmDialog
      :show="showDeleteModal"
      dialogId="schedule_delete_confirm_modal"
      title="Delete Schedule Item"
      :message="deleteConfirmationMessage"
      @confirm="handleDelete"
      @close="closeModal"
    />

    <!-- Add/Edit SUB Schedule Modal -->
    <dialog id="sub_schedule_modal" class="modal" :open="showAddSubModal || showEditSubModal">
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg">{{ isEditingSub ? 'Edit Step' : 'Add New Step' }}</h3>
        <SubScheduleForm
          :key="subFormKey"
          :initial-data="currentSubItem"
          :is-saving="isSavingSub"
          :schedule-id="parentScheduleIdForSubModal"
          @save="handleSubSave"
          @close="closeSubModal"
          class="py-4"
        />
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeSubModal">✕</button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeSubModal">close</button>
      </form>
    </dialog>

    <!-- Confirm Delete SUB Schedule Modal -->
    <ConfirmDialog
      :show="showDeleteSubModal"
      dialogId="sub_schedule_delete_confirm_modal"
      title="Delete Step"
      :message="deleteSubConfirmationMessage"
      @confirm="handleSubDelete"
      @close="closeSubModal"
    />

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import * as dataService from '@/services/dataService';
import ScheduleForm from '@/components/ScheduleForm.vue';
import SubScheduleForm from '@/components/SubScheduleForm.vue'; // Import the new form
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
});

const authStore = useAuthStore();

// Main schedule state
const schedules = ref([]); // Will now hold items with potential sub-schedule data
const isLoading = ref(true);
const error = ref(null);
const isSaving = ref(false);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const currentItem = ref(null);
const formKey = ref(0);

// Sub-schedule specific state
const expandedScheduleId = ref(null); // Track which schedule item's subschedules are shown
const isSavingSub = ref(false);
const showAddSubModal = ref(false);
const showEditSubModal = ref(false);
const showDeleteSubModal = ref(false);
const currentSubItem = ref(null); // Holds the sub-schedule item being edited/deleted
const parentScheduleIdForSubModal = ref(null); // Track which schedule the sub-item belongs to
const subFormKey = ref(Date.now()); // Use timestamp for key to force re-render

// Computed properties
const isTeacher = computed(() => authStore.isTeacher);
const isEditing = computed(() => !!currentItem.value && showEditModal.value);
const isEditingSub = computed(() => !!currentSubItem.value && showEditSubModal.value);

// Sort main schedules by week number
const sortedSchedules = computed(() => {
  // Ensure each item has subschedule-related properties initialized
  const itemsWithSubState = schedules.value.map(item => ({
    ...item,
    subschedules: item.subschedules || null, // null = not loaded, [] = loaded empty, [...] = loaded data
    isLoadingSubs: item.isLoadingSubs || false,
    subError: item.subError || null,
  }));
  return [...itemsWithSubState].sort((a, b) => a.week - b.week);
});

// Dynamic delete confirmation messages
const deleteConfirmationMessage = computed(() => {
  if (!currentItem.value) return 'Are you sure?';
  return `Are you sure you want to delete the schedule item for Week ${currentItem.value.week}: "${currentItem.value.name}"? This will also delete all associated steps.`; // Updated message
});

const deleteSubConfirmationMessage = computed(() => {
  if (!currentSubItem.value) return 'Are you sure?';
  return `Are you sure you want to delete step ${currentSubItem.value.step}: "${currentSubItem.value.title}"?`;
});


// --- Fetch Main Schedules Logic ---
const fetchSchedules = async () => {
  if (!props.courseId) {
    error.value = new Error("Course ID is missing.");
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  error.value = null;
  expandedScheduleId.value = null; // Collapse all on refresh
  // subSchedulesMap = {}; // Reset map if using that approach
  try {
    const response = await dataService.getSchedules(props.courseId);
    // Initialize sub-schedule state for each item
    schedules.value = (response.data || []).map(item => ({
      ...item,
      subschedules: null, // Indicate subs haven't been loaded yet
      isLoadingSubs: false,
      subError: null,
    }));
  } catch (err) {
    console.error("Failed to fetch schedules:", err);
    error.value = err.response?.data || err;
    schedules.value = [];
  } finally {
    isLoading.value = false;
  }
};

// --- Sub-Schedule Fetching Logic ---
const fetchSubSchedulesFor = async (scheduleItem) => {
  if (!scheduleItem || !scheduleItem.id) return;

  // Find the item in the ref to update its state directly
  const itemRef = schedules.value.find(s => s.id === scheduleItem.id);
  if (!itemRef) return;

  itemRef.isLoadingSubs = true;
  itemRef.subError = null;

  try {
    const response = await dataService.getSubSchedules(scheduleItem.id);
    // Sort subschedules by step
    itemRef.subschedules = (response.data || []).sort((a, b) => a.step - b.step);
  } catch (err) {
    console.error(`Failed to fetch subschedules for item ${scheduleItem.id}:`, err);
    itemRef.subError = err.response?.data?.error || err.message || 'Unknown error';
    itemRef.subschedules = []; // Set to empty array on error to stop loading
  } finally {
    itemRef.isLoadingSubs = false;
  }
};

// --- Toggle Sub-Schedules Visibility ---
const toggleSubSchedules = (scheduleItem) => {
  const targetId = scheduleItem.id;
  if (expandedScheduleId.value === targetId) {
    expandedScheduleId.value = null; // Collapse
  } else {
    expandedScheduleId.value = targetId; // Expand
    // Fetch subschedules only if they haven't been loaded yet (null state)
    const itemRef = schedules.value.find(s => s.id === targetId);
    if (itemRef && itemRef.subschedules === null) {
      fetchSubSchedulesFor(itemRef);
    }
  }
};

const isExpanded = (scheduleId) => {
  return expandedScheduleId.value === scheduleId;
};

// --- Main Schedule Modal Operations ---
const openAddModal = () => {
  currentItem.value = null;
  formKey.value++;
  showAddModal.value = true;
};

const openEditModal = (scheduleItem) => {
  currentItem.value = { ...scheduleItem };
  formKey.value++;
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

// --- Sub-Schedule Modal Operations ---
const openAddSubModal = (parentScheduleItem) => {
  currentSubItem.value = null; // Ensure it's null for add mode
  parentScheduleIdForSubModal.value = parentScheduleItem.id;
  subFormKey.value = Date.now(); // Force re-render of form
  showAddSubModal.value = true;
};

const openEditSubModal = (subScheduleItem, parentScheduleItem) => {
  currentSubItem.value = { ...subScheduleItem }; // Copy
  parentScheduleIdForSubModal.value = parentScheduleItem.id; // Store parent ID
  subFormKey.value = Date.now(); // Force re-render of form
  showEditSubModal.value = true;
};

const openDeleteSubModal = (subScheduleItem, parentScheduleItem) => {
  currentSubItem.value = subScheduleItem;
  parentScheduleIdForSubModal.value = parentScheduleItem.id; // Needed for refresh later
  showDeleteSubModal.value = true;
};

const closeSubModal = () => {
  showAddSubModal.value = false;
  showEditSubModal.value = false;
  showDeleteSubModal.value = false;
  currentSubItem.value = null;
  parentScheduleIdForSubModal.value = null;
  isSavingSub.value = false;
};

// --- Main Schedule CRUD Handlers ---
const handleSave = async (formData) => {
  if (!isTeacher.value) return;
  isSaving.value = true;
  error.value = null;

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
    alert(`Failed to save: ${err.response?.data?.error || err.message}`);
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async () => {
  if (!isTeacher.value || !currentItem.value) return;

  // Note: Backend should handle deleting associated subschedules via cascade or logic
  try {
    await dataService.deleteSchedule(currentItem.value.id);
    closeModal();
    await fetchSchedules(); // Refresh list
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to delete schedule:", err);
    alert(`Failed to delete: ${err.response?.data?.error || err.message}`);
    closeModal();
  }
};

// --- Sub-Schedule CRUD Handlers ---
const handleSubSave = async (subFormData) => {
  if (!isTeacher.value) return;
  isSavingSub.value = true;

  // Find the parent item to update later
  const parentItemRef = schedules.value.find(s => s.id === subFormData.schedule_id);

  try {
    if (isEditingSub.value) {
      // Pass subFormData which includes schedule_id, step, title
      await dataService.updateSubSchedule(currentSubItem.value.id, subFormData);
    } else {
      // Pass subFormData which includes schedule_id, step, title
      await dataService.createSubSchedule(subFormData);
    }
    closeSubModal();
    if (parentItemRef) {
      await fetchSubSchedulesFor(parentItemRef); // Refresh only the subs for this parent
    }
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to save sub-schedule:", err);
    alert(`Failed to save step: ${err.response?.data?.error || err.message}`);
    // Keep modal open? Or close? For now, we close it in finally if error occurs
    // closeSubModal(); // Might want to keep open to show error in context
  } finally {
    isSavingSub.value = false;
  }
};

const handleSubDelete = async () => {
  if (!isTeacher.value || !currentSubItem.value || !parentScheduleIdForSubModal.value) return;

  const parentItemId = parentScheduleIdForSubModal.value; // Capture before closing modal
  const parentItemRef = schedules.value.find(s => s.id === parentItemId);

  try {
    await dataService.deleteSubSchedule(currentSubItem.value.id);
    closeSubModal();
    if (parentItemRef) {
      await fetchSubSchedulesFor(parentItemRef); // Refresh subs for the parent
    }
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to delete sub-schedule:", err);
    alert(`Failed to delete step: ${err.response?.data?.error || err.message}`);
    closeSubModal(); // Close confirm dialog even on error
  }
};

// --- Watchers ---
watch(() => props.courseId, (newCourseId, oldCourseId) => {
  if (newCourseId && newCourseId !== oldCourseId) {
    fetchSchedules();
  }
}, { immediate: true });

</script>

<style scoped>
/* Add styles if needed */
.table-sm th, .table-sm td {
  padding: 0.5rem 0.75rem; /* Adjust padding if needed */
}
/* Style for the sub-schedule row background */
/* .bg-base-200 is usually good */

/* Ensure buttons in sub-list don't cause wrapping */
.sub-schedule-list li > div {
  white-space: nowrap;
}
</style>
