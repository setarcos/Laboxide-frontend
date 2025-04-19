// src/views/SubcourseProgressView.vue
<template>
  <div class="prose max-w-none">
    <h2>
      Student Progress: {{ subcourseDetails?.course_name }} ({{ getWeekdayName(subcourseDetails?.weekday) }})
      <span v-if="subcourseDetails?.room_name">- {{ subcourseDetails.room_name }}</span>
    </h2>

    <!-- Loading State -->
    <div v-if="isLoading.initial" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
      <p>Loading course data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error.initial" class="alert alert-error shadow-lg">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Error loading data: {{ error.initial }}</span>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Week Selector & Expand All -->
      <div class="flex justify-between items-center mb-4 p-4 bg-base-200 rounded-box shadow">
        <div class="form-control w-40">
          <label class="label pb-1">
            <span class="label-text font-semibold">Select Week:</span>
          </label>
          <select class="select select-bordered select-sm" v-model.number="selectedWeek" :disabled="isLoading.weekly">
            <option v-if="semesterStore.isSemesterLoading || !currentWeekNumberFromStore" disabled value="">Loading weeks...</option>
            <!-- Generate options dynamically based on typical semester length or fetched schedules -->
            <option v-for="weekNum in availableWeeks" :key="weekNum" :value="weekNum">
              Week {{ weekNum }} {{ weekNum === currentWeekNumberFromStore ? '(Current)' : '' }}
            </option>
          </select>
        </div>
        <div>
          <button class="btn btn-sm btn-ghost" @click="toggleAllTimelines" :disabled="isLoading.weekly || !students.length">
            {{ showAllTimelines ? 'Collapse All Logs' : 'Expand All Logs' }}
          </button>
        </div>
      </div>

      <!-- Weekly Data Loading/Error -->
      <div v-if="isLoading.weekly && !isLoading.initial" class="text-center py-6">
        <span class="loading loading-md loading-spinner text-secondary"></span>
        <p>Loading data for Week {{ selectedWeek }}...</p>
      </div>
      <div v-else-if="error.weekly && !isLoading.initial" class="alert alert-warning shadow-sm my-4">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>{{ error.weekly }}</span>
        </div>
      </div>

      <!-- Students Table -->
      <div v-else-if="students.length > 0" class="overflow-x-auto bg-base-100 rounded-box shadow-md mt-6">
        <table class="table table-zebra w-full table-sm">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Seat</th>
              <th class="w-1/4">Progress (Week {{ selectedWeek }})</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(studentData, index) in studentProgressData" :key="studentData.student.stu_id">
              <tr class="hover">
                <td>{{ studentData.student.stu_id }}</td>
                <td>{{ studentData.student.stu_name }}</td>
                <td>{{ studentData.student.seat || '-' }}</td>
                <td>
                  <div
                    class="tooltip cursor-pointer"
                    :data-tip="`${studentData.loggedStepsCount} / ${totalStepsForWeek} steps logged`"
                    @click="toggleStudentTimeline(studentData.student.stu_id)"
                  >
                    <progress
                      class="progress progress-primary w-full"
                      :value="studentData.progressPercent"
                      max="100"
                    ></progress>
                  </div>
                </td>
                <td>
                  <div class="flex gap-1">
                    <button
                      class="btn btn-xs btn-outline btn-info"
                      @click="openTeacherLogModal(studentData.student)"
                      title="Add Log Entry for Student"
                    >
                      Add Log
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Expanded Timeline Row -->
              <tr v-if="expandedStudentId === studentData.student.stu_id || showAllTimelines">
                <td :colspan="5" class="bg-base-200 p-0">
                  <div class="px-4 py-3">
                    <h4 class="text-sm font-semibold mb-2">
                      Timeline Logs for {{ studentData.student.stu_name }} (Week {{ selectedWeek }}):
                      <span v-if="isLoading.timelines[studentData.student.stu_id]" class="loading loading-dots loading-xs ml-2"></span>
                    </h4>
                    <div v-if="error.timelines[studentData.student.stu_id]" class="text-error text-xs italic">
                      Error loading logs: {{ error.timelines[studentData.student.stu_id] }}
                    </div>
                    <ul v-else-if="studentData.weeklyTimelines && studentData.weeklyTimelines.length > 0" class="list-none space-y-2 pl-2">
                      <li v-for="entry in studentData.weeklyTimelines" :key="entry.id" class="text-xs border-b border-base-300 pb-1 last:border-b-0">
                        <div class="flex justify-between items-start">
                          <div>
                            <span class="font-semibold mr-2">
                              {{ entry.subschedule || 'General Note' }}:
                            </span>
                            <!-- Note/File Display -->
                            <span v-if="entry.notetype === 0">{{ entry.note }}</span>
                            <a v-else-if="entry.notetype === 1"
                                href="#"
                                @click.prevent="handleFileLinkClick(entry)"
                                class="link link-hover text-info break-all"
                                :title="`Download or Preview ${entry.note}`"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                {{ entry.note }}
                            </a>
                          </div>
                          <div class="text-right flex-shrink-0 ml-2 whitespace-nowrap">
                            <span class="text-gray-500 mr-1">({{ formatTimestamp(entry.timestamp) }})</span>
                            <span class="font-medium mr-1" :class="{'text-success': entry.tea_name === authStore.user?.realname }">{{ entry.tea_name }}</span>
                            <!-- Delete Button -->
                            <button
                              v-if="entry.tea_name === authStore.user?.realname"
                              class="btn btn-xs btn-ghost btn-circle text-error p-0 align-middle"
                              @click="confirmDeleteTimeline(entry)"
                              title="Delete this log entry"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    </ul>
                    <p v-else class="text-xs italic text-base-content/70 pl-2">No timeline entries found for this student this week.</p>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div v-else-if="!isLoading.initial && !isLoading.weekly" class="text-center py-5 italic text-gray-500">
        No students found for this lab session.
      </div>
    </div>

    <!-- Teacher Log Modal -->
    <dialog id="teacher_log_modal" class="modal" :open="showTeacherLogModal">
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg mb-4">
          Add Log for {{ studentForTeacherLog?.stu_name }} (Week {{ selectedWeek }})
        </h3>
        <TeacherTimelineLogForm
          v-if="studentForTeacherLog && selectedSchedule"
          :key="teacherLogModalKey"
          :student="studentForTeacherLog"
          :subcourse-id="id"
          :schedule-id="selectedSchedule.id"
          :teacher-name="authStore.user?.realname || 'Teacher'"
          @save="handleTeacherLogSave"
          @close="closeTeacherLogModal"
        />
        <div v-else class="text-center text-warning p-4">
          Cannot add log: Missing student or schedule information for the selected week.
        </div>
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeTeacherLogModal">✕</button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeTeacherLogModal">close</button>
      </form>
    </dialog>

    <!-- Confirm Delete Modal -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      dialogId="timeline_delete_confirm_modal"
      title="Delete Log Entry"
      :message="`Are you sure you want to delete the log entry: '${getTimelineEntryDescription(entryToDelete)}'?`"
      @confirm="deleteTimelineEntry"
      @close="showDeleteConfirm = false; entryToDelete = null;"
    />

    <dialog id="image_preview_modal" class="modal" :open="showImagePreviewModal">
      <div class="modal-box w-11/12 max-w-3xl p-6">
        <h3 class="font-bold text-lg mb-4 break-all">Image Preview: {{ previewImageFilename }}</h3>
        <div v-if="isLoading.preview" class="text-center py-10">
          <span class="loading loading-lg loading-spinner text-info"></span>
          <p>Loading image preview...</p>
        </div>
        <div v-else-if="error.preview" class="alert alert-error shadow-sm my-4">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{{ error.preview }}</span>
          </div>
        </div>
        <div v-else-if="previewImageUrl" class="w-full max-h-[70vh] overflow-auto flex justify-center items-center bg-base-300 rounded">
          <img :src="previewImageUrl" alt="Image Preview" class="max-w-full max-h-full object-contain" />
        </div>
        <div v-else class="text-center text-warning p-4">
          Could not load image preview.
        </div>

        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeImagePreviewModal">✕</button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeImagePreviewModal">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useSemesterStore } from '@/stores/semester';
import * as dataService from '@/services/dataService';
import { getWeekdayName } from '@/utils/weekday';
import TeacherTimelineLogForm from '@/components/TeacherTimelineLogForm.vue'; // Needs to be created
import ConfirmDialog from '@/components/ConfirmDialog.vue';

const props = defineProps({
  id: { // Subcourse ID from route
    type: [String, Number],
    required: true,
  },
});

const route = useRoute();
const authStore = useAuthStore();
const semesterStore = useSemesterStore();

// --- State ---
const subcourseDetails = ref(null);
const students = ref([]);
const schedules = ref([]); // All schedules for the parent course
const selectedWeek = ref(null);
const selectedSchedule = ref(null); // Schedule item for selectedWeek
const subSchedulesForWeek = ref([]); // Steps for selectedWeek
const timelineEntries = ref({}); // { stu_id: [entry1, entry2,...] } for selected week

const isLoading = reactive({
  initial: true, // Loading students, schedules
  weekly: false, // Loading subschedules, timelines for the selected week
  timelines: {} // Per-student timeline loading: { stu_id: boolean } - might not be needed if fetching all at once
});
const error = reactive({
  initial: null,
  weekly: null,
  timelines: {} // Per-student timeline errors: { stu_id: string }
});

const expandedStudentId = ref(null); // Track individually expanded student
const showAllTimelines = ref(false); // Track expand all state

// Teacher log modal state
const showTeacherLogModal = ref(false);
const studentForTeacherLog = ref(null);
const teacherLogModalKey = ref(Date.now());

// Delete confirmation state
const showDeleteConfirm = ref(false);
const entryToDelete = ref(null);

// Image preview modal
const showImagePreviewModal = ref(false);
const previewImageUrl = ref(null);
const previewImageFilename = ref(null);

// --- Computed Properties ---
const currentWeekNumberFromStore = computed(() => {
  // Reuse logic from DashboardView if available, or recalculate
  if (semesterStore.isSemesterLoading || semesterStore.semesterError || !semesterStore.currentSemester) return null;
  const semester = semesterStore.currentSemester;
  const startDateStr = semester.start; const endDateStr = semester.end;
  if (!startDateStr || !endDateStr) return null;
  try {
    const now = new Date(); const startDate = new Date(startDateStr); const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
    now.setHours(0, 0, 0, 0); startDate.setHours(0, 0, 0, 0); endDate.setHours(0, 0, 0, 0);
    if (now < startDate || now > endDate) return null;
    const diffTime = Math.abs(now - startDate); const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  } catch (e) { return null; }
});

const courseId = computed(() => subcourseDetails.value?.course_id);

const totalStepsForWeek = computed(() => subSchedulesForWeek.value.length);

// Generate week options based on fetched schedules or a default range
const availableWeeks = computed(() => {
  if (schedules.value.length > 0) {
    return schedules.value.map(s => s.week).sort((a, b) => a - b);
  }
  // Fallback if schedules haven't loaded yet or are empty
  const current = currentWeekNumberFromStore.value || 1;
  const range = 16; // Default semester length guess
  const start = Math.max(1, current - Math.floor(range / 2));
  return Array.from({ length: range }, (_, i) => start + i);
});

const studentProgressData = computed(() => {
  const validStepTitles = new Set(subSchedulesForWeek.value.map(sub => sub.title));

  return students.value.map(student => {
    const weeklyTimelines = (timelineEntries.value[student.stu_id] || []).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Count logged entries whose 'subschedule' title is in the valid set for the week
    let loggedStepsCount = 0;
    const loggedTitles = new Set(); // Use a set to count unique titles logged
    weeklyTimelines.forEach(entry => {
      if (entry.subschedule && validStepTitles.has(entry.subschedule)) {
        loggedTitles.add(entry.subschedule);
      }
    });
    loggedStepsCount = loggedTitles.size; // Count unique valid titles logged

    const total = totalStepsForWeek.value;
    const progressPercent = total > 0 ? Math.round((loggedStepsCount / total) * 100) : 0;

    return {
      student,
      loggedStepsCount,
      progressPercent,
      weeklyTimelines, // Keep sorted list for display
    };
  });
});

// --- Methods ---
const fetchInitialData = async () => {
  isLoading.initial = true;
  error.initial = null;
  try {
    // Fetch students for this subcourse
    const studentsRes = await dataService.getGroup(props.id);
    students.value = studentsRes.data || [];
    const subCourse = await dataService.getSubcourse(props.id);
    subcourseDetails.value = subCourse.data;

    const parentCourseId = subCourse.data?.course_id;
    if (!parentCourseId && students.value.length > 0) {
      console.warn("Could not determine parent course ID. Fetching schedules might fail.");
    }

    if (parentCourseId) { // Only fetch if we have a course ID
      const schedulesRes = await dataService.getSchedules(parentCourseId); // Use fetched parent ID
      schedules.value = schedulesRes.data || [];
    } else if (students.value.length > 0) {
      throw new Error("Could not determine the parent course ID to fetch schedules.");
    }

    await fetchWeeklyData();
    // Set initial week if not already set by watcher
    if (selectedWeek.value === null && currentWeekNumberFromStore.value) {
      selectedWeek.value = currentWeekNumberFromStore.value;
    } else if (selectedWeek.value === null && schedules.value.length > 0) {
      selectedWeek.value = schedules.value[0]?.week || 1; // Fallback to first week
    } else if (selectedWeek.value === null) {
      selectedWeek.value = 1; // Absolute fallback
    }

  } catch (err) {
    console.error("Error loading initial data:", err);
    error.initial = err.response?.data?.error || err.message || 'Unknown error';
  } finally {
    isLoading.initial = false;
  }
};

const fetchWeeklyData = async () => {
  console.log(selectedWeek.value);
  if (selectedWeek.value === null) return; // Don't fetch if no week or initial load ongoing

  isLoading.weekly = true;
  error.weekly = null;
  selectedSchedule.value = null;
  subSchedulesForWeek.value = [];
  timelineEntries.value = {}; // Reset timelines

  try {
    // Find the main schedule for the selected week
    selectedSchedule.value = schedules.value.find(s => s.week === selectedWeek.value);

    if (!selectedSchedule.value) {
      throw new Error(`No schedule found for Week ${selectedWeek.value}.`);
    }

    // Fetch sub-schedules (steps) for this week
    const subSchedulesRes = await dataService.getSubSchedules(selectedSchedule.value.id);
    subSchedulesForWeek.value = (subSchedulesRes.data || []).sort((a, b) => a.step - b.step);

    // Fetch all timeline entries for this subcourse AND this week's schedule_id
    const timelineRes = await dataService.listTimelinesBySchedule(props.id, selectedSchedule.value.id);
    const allWeeklyEntries = timelineRes.data || [];

    // Group entries by student ID
    const groupedEntries = {};
    allWeeklyEntries.forEach(entry => {
      if (!groupedEntries[entry.stu_id]) {
        groupedEntries[entry.stu_id] = [];
      }
      groupedEntries[entry.stu_id].push(entry);
    });
    timelineEntries.value = groupedEntries;

  } catch (err) {
    console.error(`Error loading data for week ${selectedWeek.value}:`, err);
    error.weekly = err.response?.data?.error || err.message || 'Unknown error';
    // Clear data related to the failed week
    subSchedulesForWeek.value = [];
    timelineEntries.value = {};
  } finally {
    isLoading.weekly = false;
  }
};

const toggleStudentTimeline = (studentId) => {
  if (showAllTimelines.value) return; // Don't toggle individual if showing all
  expandedStudentId.value = expandedStudentId.value === studentId ? null : studentId;
};

const toggleAllTimelines = () => {
  showAllTimelines.value = !showAllTimelines.value;
  expandedStudentId.value = null; // Clear individual expansion when toggling all
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;

    return `${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return timestamp;
  }
};

const openTeacherLogModal = (student) => {
  if (!selectedSchedule.value) {
    alert("Cannot add log: No schedule loaded for the selected week.");
    return;
  }
  studentForTeacherLog.value = student;
  teacherLogModalKey.value = Date.now(); // Force refresh modal form
  showTeacherLogModal.value = true;
};

const closeTeacherLogModal = () => {
  showTeacherLogModal.value = false;
  studentForTeacherLog.value = null;
};

const handleTeacherLogSave = async (/* Maybe receive feedback? */) => {
  // formData was handled by the child component
  closeTeacherLogModal();
  // Refresh weekly data to show the new log entry
  await fetchWeeklyData();
  // TODO: Add success notification (e.g., toast)
};

const confirmDeleteTimeline = (entry) => {
  entryToDelete.value = entry;
  showDeleteConfirm.value = true;
};

const getTimelineEntryDescription = (entry) => {
  if (!entry) return '';
  const prefix = entry.subschedule || 'General Note'; // Use title directly
  const content = entry.notetype === 0 ? (entry.note?.substring(0, 30) + '...') : entry.note;
  return `${prefix} - ${content}`;
};

const deleteTimelineEntry = async () => {
  if (!entryToDelete.value) return;

  isLoading.weekly = true; // Indicate activity
  try {
    await dataService.deleteTimeline(entryToDelete.value.id);
    showDeleteConfirm.value = false;
    entryToDelete.value = null;
    // Refresh weekly data
    await fetchWeeklyData();
  } catch (err) {
    console.error("Failed to delete timeline entry:", err);
    alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    // Keep confirm dialog open? Or close? For now, it closes via @close handler
  } finally {
    isLoading.weekly = false;
    // Ensure states are reset even if delete failed but confirm closed
    showDeleteConfirm.value = false;
    entryToDelete.value = null;
  }
};
// Helper function to check if a filename suggests an image
const isImageFile = (filename) => {
    if (!filename || typeof filename !== 'string') return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'];
    const lowerFilename = filename.toLowerCase();
    return imageExtensions.some(ext => lowerFilename.endsWith(ext));
};

// Helper function for actual file download (using the original API call)
const downloadFile = async (timelineId, filename) => {
  try {
    console.log("Attempting to download file for timeline ID:", timelineId);
    const response = await dataService.downloadTimelineFile(timelineId);

    // It's crucial that your API returns the file content as a Blob
    if (!(response.data instanceof Blob)) {
         console.error("API did not return a Blob for download:", response);
         alert('Failed to download file: Invalid response format.');
         return;
    }

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Use the provided filename, or a generic one if not available
    link.setAttribute('download', filename || `download_${timelineId}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url); // Clean up the Blob URL
    console.log("File download triggered successfully.");

  } catch (error) {
    console.error('Error downloading file:', error);
    // TODO: Add error notification
    alert('Failed to download file.');
  }
};

const handleFileLinkClick = async (entry) => {
  if (entry.notetype !== 1) {
    console.warn("handleFileLinkClick called on non-file entry:", entry);
    return;
  }

  const filename = entry.note || ''; // Use 'note' field as filename
  const timelineId = entry.id;

  if (isImageFile(filename)) {
    console.log(`Attempting image preview for file: ${filename} (ID: ${timelineId})`);
    // --- Open Preview Modal and Load Image ---
    showImagePreviewModal.value = true;
    previewImageFilename.value = filename; // Set filename for modal title
    isLoading.preview = true;
    error.preview = null;
    previewImageUrl.value = null; // Clear previous URL

    try {
      // Fetch the file content - expect a Blob response
      const response = await dataService.downloadTimelineFile(timelineId);

      if (response.data instanceof Blob && response.data.type.startsWith('image/')) {
        const url = URL.createObjectURL(response.data);
        previewImageUrl.value = url;
        console.log("Image preview Blob URL created.");
      } else {
        // If fetch was successful but the response wasn't an image Blob
        console.warn(`Fetched file for ID ${timelineId} is not an image Blob (type: ${response.data?.type}). Falling back to download.`);
        error.preview = "File is not a supported image format for preview. Attempting download instead...";
        // Close preview modal before triggering download
        closeImagePreviewModal(false); // Close without revoking URL yet, as we are about to download
        // Trigger download for this file
        downloadFile(timelineId, filename);
      }
    } catch (previewErr) {
      // Handle errors during fetch or Blob URL creation
      console.error("Error loading image preview:", previewErr);
      error.preview = `Failed to load image for preview: ${previewErr.message || 'Unknown error'}`;
      previewImageUrl.value = null; // Ensure no broken image is shown
    } finally {
      isLoading.preview = false; // Turn off loading regardless of outcome
    }

  } else {
    console.log(`File is not an image: ${filename} (ID: ${timelineId}). Proceeding with download.`);
    // --- Not an image, proceed with standard download ---
    downloadFile(timelineId, filename);
  }
};

const closeImagePreviewModal = () => {
  console.log(`Closing image preview modal.`);
  showImagePreviewModal.value = false;
  // Revoke the previous Blob URL if it exists to free up memory
  if (previewImageUrl.value) {
    URL.revokeObjectURL(previewImageUrl.value);
    console.log("Revoked Blob URL:", previewImageUrl.value);
  }
  // Reset state
  previewImageUrl.value = null;
  previewImageFilename.value = null;
  isLoading.preview = false; // Reset loading/error states too
  error.preview = null;
};


// --- Watchers ---
watch(selectedWeek, (newWeek, oldWeek) => {
  if (newWeek !== null && newWeek !== oldWeek && !isLoading.initial) {
    fetchWeeklyData();
  }
});

// Set initial week based on store once it loads
watch(currentWeekNumberFromStore, (newStoreWeek) => {
  if (selectedWeek.value === null && newStoreWeek !== null) {
    selectedWeek.value = newStoreWeek;
    // fetchWeeklyData will be triggered by the selectedWeek watcher
  }
}, { immediate: true }); // Check immediately

// --- Lifecycle ---
onMounted(async () => {
  // Ensure semester store has data if needed for initial week
  if (!semesterStore.currentSemester && !semesterStore.isSemesterLoading) {
    await semesterStore.fetchCurrentSemester(); // Assuming this is async
  }
  await fetchInitialData();
  // fetchWeeklyData will be triggered by the watcher once selectedWeek is set
});

</script>

<style scoped>
/* Add specific styles if needed */
.tooltip:before {
  white-space: pre-wrap; /* Allow tooltip text to wrap */
}
</style>
