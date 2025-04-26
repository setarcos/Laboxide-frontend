// src/components/TimelineLogModal.vue
<template>
  <div class="modal-content-wrapper">
    <h3 class="font-bold text-lg mb-4">
      Log Progress for {{ subcourse.course_name }} (Week {{ currentWeek }})
    </h3>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-info"></span>
      <p>Loading steps and progress...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error shadow-sm">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Step Selection -->
      <div class="form-control mb-4">
        <label class="label pb-1">
          <span class="label-text font-semibold">Select Step or Action to Log:</span>
        </label>
        <div v-if="!scheduleForWeek" class="text-warning text-sm italic">
          No schedule found for Week {{ currentWeek }}. Cannot log progress.
        </div>
        <div v-else-if="subSchedules.length === 0" class="text-info text-sm italic">
          No specific steps defined for Week {{ currentWeek }}. You can use 'Others' or mark as finished.
        </div>
        <!-- Step List -->
        <div v-else class="space-y-1">
          <label v-for="step in subSchedules" :key="step.id" class="flex items-center cursor-pointer p-1.5 rounded hover:bg-base-200 border border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <input
              type="radio"
              name="timeline_step"
              class="radio radio-primary radio-sm mr-2"
              :value="step.title"
              v-model="selectedStepValue"
            />
            <!-- Checkmark only for predefined steps that have a log entry matching that specific title and week -->
            <span v-if="isStepLogged(step.title)" class="mr-2 tooltip tooltip-right" data-tip="Already Logged with this original title this week"> ✅ </span>
            <span class="flex-grow text-sm">
              <span class="font-mono bg-base-300 rounded px-1.5 py-0.5 mr-1.5 text-xs">{{ step.step }}</span>
              {{ step.title }}
            </span>
          </label>
        </div>
          <!-- "Others" Option -->
        <div class="space-y-1">
           <label class="flex items-center cursor-pointer p-1.5 rounded hover:bg-base-200 border border-transparent has-[:checked]:border-info has-[:checked]:bg-info/10">
            <input
              type="radio"
              name="timeline_step"
              class="radio radio-info radio-sm mr-2"
              value="other"
              v-model="selectedStepValue"
            />
            <span class="flex-grow font-semibold text-info text-sm">Others / Custom Log Entry</span>
          </label>
          <!-- Finish Option -->
          <label class="flex items-center cursor-pointer p-1.5 rounded hover:bg-base-200 border border-transparent has-[:checked]:border-accent has-[:checked]:bg-accent/10">
            <input
              type="radio"
              name="timeline_step"
              class="radio radio-accent radio-sm mr-2"
              value="finish"
              v-model="selectedStepValue"
            />
            <span class="flex-grow font-semibold text-accent text-sm">Finish Experiment / Final Log</span>
          </label>
        </div>
      </div>

      <!-- Custom Title Input (Only if "Others" is selected) -->
      <div v-if="selectedStepValue === 'other'">
         <div class="form-control mb-4">
          <label class="label pb-1">
            <span class="label-text font-semibold">Custom Log Entry Title:</span>
          </label>
          <input
            type="text"
            class="input input-bordered w-full input-sm text-sm"
            v-model="customTitle"
            placeholder="Enter title for your custom log entry"
          />
          <span v-if="selectedStepValue === 'other' && !customTitle.trim()" class="text-warning text-xs mt-1">A title is required for custom log entries.</span>
         </div>
      </div>

      <!-- Note Input (Only if a standard step or "Others" is selected) -->
      <div class="mt-4 border-t pt-4">
        <h4 class="font-semibold mb-2 text-base">
          Add Note/File for Log Entry:
           <span class="font-normal text-primary text-sm">
              {{ selectedStepValue === 'other' ? (customTitle || '(No title entered)') : selectedStepValue }}
           </span>
        </h4>
        <div class="form-control mb-3">
          <label class="label cursor-pointer justify-start gap-4">
            <span class="label-text text-sm">Type:</span>
            <span class="flex items-center gap-2 text-sm">
              <input type="radio" name="note_type" class="radio radio-sm" :value="0" v-model="noteType" /> Text Note
            </span>
            <span class="flex items-center gap-2 text-sm">
              <input type="radio" name="note_type" class="radio radio-sm" :value="1" v-model="noteType" /> File Upload
            </span>
          </label>
        </div>

        <!-- Text Note Input -->
        <div v-if="noteType === 0" class="form-control">
          <textarea
            class="textarea textarea-bordered h-24 text-sm"
            placeholder="Enter your observations or notes for this log entry..."
            v-model="noteContent"
          ></textarea>
           <span v-if="noteType === 0 && !noteContent.trim()" class="text-warning text-xs mt-1">A text note is required.</span>
        </div>

        <!-- File Input -->
        <div v-if="noteType === 1" class="form-control">
          <input
            type="file"
            class="file-input file-input-bordered file-input-sm w-full text-sm"
            ref="fileInputRef"
            @change="handleFileChange"
          />
          <span v-if="fileError" class="text-error text-xs mt-1">{{ fileError }}</span>
           <span v-if="noteType === 1 && !fileToUpload && !fileError" class="text-warning text-xs mt-1">A file is required.</span>
        </div>

        <div v-if="saveError" class="text-error text-sm mt-2">{{ saveError }}</div>

        <div class="modal-action mt-4">
          <button type="button" class="btn btn-primary btn-sm" @click="submitTimelineEntry" :disabled="isSaving || !isLoggable" :class="{'loading': isSaving}">
            {{ isSaving ? 'Saving...' : 'Save Log Entry' }}
          </button>
        </div>
      </div>
    </div>

    <!-- General Modal Actions -->
    <div class="modal-action mt-6 border-t pt-4">
      <button type="button" class="btn btn-ghost btn-sm" @click="$emit('close')" :disabled="isSaving">
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import * as dataService from '@/services/dataService';
import { useAuthStore } from '@/stores/auth'; // Assuming authStore is needed

const props = defineProps({
  subcourse: { type: Object, required: true },
  studentId: { type: String, required: true },
  currentWeek: { type: Number, required: true },
});

const emit = defineEmits(['close', 'request-finish-log', 'log-saved']);

const authStore = useAuthStore(); // If needed for actual user data

const isLoading = ref(true);
const error = ref(null);
const saveError = ref(null);
const isSaving = ref(false);

const scheduleForWeek = ref(null);
const subSchedules = ref([]);
// existingTimelineEntries is needed to show the checkmarks next to original steps
// and also to find duplicates by title for deletion logic. Must contain all entries for the subcourse/student.
const existingTimelineEntries = ref([]);

// Ref for tracking selected radio button value ('step title', 'other', or 'finish')
const selectedStepValue = ref(null);
// Ref for the custom title input when 'other' is selected
const customTitle = ref('');

const noteType = ref(0);
const noteContent = ref('');
const fileToUpload = ref(null);
const fileInputRef = ref(null);
const fileError = ref(null);

// --- Computed Properties ---
const isLoggable = computed(() => {
  // Cannot save if no step/option is selected or if it's 'finish'
  if (!selectedStepValue.value || selectedStepValue.value === 'finish') {
    return false;
  }

  // If 'other' is selected, custom title must be non-empty
  if (selectedStepValue.value === 'other' && customTitle.value.trim().length === 0) {
      return false;
  }

  // For any selectable step (predefined or 'other'), note or file is required
  if (noteType.value === 0) {
    return noteContent.value.trim().length > 0;
  } else { // noteType === 1
    return !!fileToUpload.value;
  }
});


// --- Methods ---
const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  scheduleForWeek.value = null;
  subSchedules.value = [];
  existingTimelineEntries.value = [];
  // Reset state completely on data fetch
  selectedStepValue.value = null;
  customTitle.value = '';
  resetFormFields();

  try {
    const schedulesResponse = await dataService.getSchedules(props.subcourse.course_id);
    const allSchedules = schedulesResponse.data || [];
    scheduleForWeek.value = allSchedules.find(s => s.week === props.currentWeek);

    if (scheduleForWeek.value) {
      const subSchedulesResponse = await dataService.getSubSchedules(scheduleForWeek.value.id);
      subSchedules.value = (subSchedulesResponse.data || []).sort((a, b) => a.step - b.step);
    } else {
      console.warn(`No schedule found for course ${props.subcourse.course_id}, week ${props.currentWeek}`);
      subSchedules.value = [];
    }

    // Fetch all existing entries for the *current subcourse and student*
    // This is needed for both the checkmark display and the delete-if-duplicate logic
    const timelineResponse = await dataService.listTimelinesByStudent(props.subcourse.id, props.studentId);
    existingTimelineEntries.value = timelineResponse.data || [];

  } catch (err) {
    console.error("Failed to load timeline modal data:", err);
    error.value = `Failed to load data: ${err.response?.data?.error || err.message || 'Unknown error'}`;
  } finally {
    isLoading.value = false;
  }
};

// Checks if *any* log entry exists with the *exact original step title* for the *current week's schedule*
// This is solely for the checkmark display next to predefined steps in the UI.
const isStepLogged = (originalStepTitle) => {
  if (!scheduleForWeek.value || !originalStepTitle) return false;
   return existingTimelineEntries.value.some(entry =>
    entry.subschedule === originalStepTitle && // Match the original title
    entry.schedule_id === scheduleForWeek.value.id // Match the current week's schedule
  );
};

// Helper to find the ID of the latest existing timeline entry
// that matches the given log title AND the current week's schedule.
const findExistingEntryIdForLogTitle = (logTitle, currentScheduleId) => {
  if (!logTitle || !currentScheduleId) return null;

  const entriesMatchingTitleAndSchedule = existingTimelineEntries.value
    .filter(entry =>
      entry.subschedule === logTitle &&
      entry.schedule_id === currentScheduleId
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Get the latest one

  return entriesMatchingTitleAndSchedule.length > 0 ? entriesMatchingTitleAndSchedule[0].id : null;
};


const handleFileChange = (event) => {
  fileError.value = null;
  const file = event.target.files[0];
  if (file) {
    // Basic file type validation (optional, but good practice)
    const allowedTypes = [
      'image/', 'application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.ms-powerpoint' // .ppt
    ];
     const isFileTypeAllowed = allowedTypes.some(type => file.type.startsWith(type) || file.type === type);

    if (!isFileTypeAllowed && file.size > 0) {
       fileError.value = 'Unsupported file type. Please upload an image, PDF, text, or common document file.';
       fileToUpload.value = null;
       if (fileInputRef.value) fileInputRef.value.value = ''; // Clear input
       return;
    }

    if (file.size > 10 * 1024 * 1024) { // Example: 10MB limit
      fileError.value = 'File is too large (max 10MB).';
      fileToUpload.value = null;
      if (fileInputRef.value) fileInputRef.value.value = ''; // Clear input
      return;
    }
    fileToUpload.value = file;
  } else {
    fileToUpload.value = null;
  }
};

const resetFormFields = () => {
  noteContent.value = '';
  fileToUpload.value = null;
  fileError.value = null;
  if (fileInputRef.value) fileInputRef.value.value = '';
  noteType.value = 0; // Default to text note
  saveError.value = null;
};

const submitTimelineEntry = async () => {
  // Use the computed property for initial validation
  if (!isLoggable.value) {
    // isLoggable computation already handles displaying warning messages near inputs
    console.warn("Attempted to save invalid log entry.");
    return;
  }

  // This function should only proceed if a standard step or 'other' is selected
  if (!selectedStepValue.value || selectedStepValue.value === 'finish') {
     console.warn("Submit called with invalid selection.");
     return;
  }

  isSaving.value = true;
  saveError.value = null; // Clear any previous save errors

  try {
    // Determine the title to use for the log entry based on selection
    const logTitleToSave = selectedStepValue.value === 'other' ? customTitle.value.trim() : selectedStepValue.value.trim();

    // Ensure scheduleForWeek exists - validation should cover this, but safe check
    if (!scheduleForWeek.value) {
         saveError.value = "Schedule information missing. Cannot save log.";
         isSaving.value = false;
         return;
    }
    const currentScheduleId = scheduleForWeek.value.id;

    // Find if an existing entry needs to be replaced (same title in the same week)
    const entryToDeleteId = findExistingEntryIdForLogTitle(logTitleToSave, currentScheduleId);

    if (entryToDeleteId) {
      console.log(`Previous entry found with title "${logTitleToSave}" in week ${props.currentWeek} (ID: ${entryToDeleteId}). Attempting deletion before creating a new one.`);
      try {
        await dataService.deleteTimeline(entryToDeleteId);
        console.log(`Successfully deleted previous entry ID: ${entryToDeleteId}`);
         // Optimistically update the local list to remove the deleted entry
         existingTimelineEntries.value = existingTimelineEntries.value.filter(entry => entry.id !== entryToDeleteId);
      } catch (deleteErr) {
        // Log the error but proceed with creating the new entry as requested
        console.error(`Failed to delete previous entry ID ${entryToDeleteId}. Proceeding with creation anyway:`, deleteErr);
        // It's possible the deletion failed, but we still want to try creating the new log.
      }
    } else {
        console.log(`No previous entry found with title "${logTitleToSave}" in week ${props.currentWeek}. Creating a new entry.`);
    }

    // --- Proceed with creating the new entry ---
    const formData = new FormData();
    formData.append('stu_id', props.studentId);
    formData.append('tea_id', '-'); // Placeholder or get from authStore
    formData.append('schedule_id', currentScheduleId);

    // Use the determined logTitle for the subschedule field
    formData.append('subschedule', logTitleToSave);
    formData.append('subcourse_id', props.subcourse.id);
    formData.append('notetype', noteType.value);

    if (noteType.value === 0) {
      formData.append('note', noteContent.value.trim());
    } else if (fileToUpload.value) {
      formData.append('file', fileToUpload.value, fileToUpload.value.name);
    } else {
        // Should be caught by isLoggable, but double check
        saveError.value = "No note or file provided.";
        isSaving.value = false;
        return;
    }

    const response = await dataService.createTimeline(formData);
    console.log("New timeline entry created:", response.data);

    // --- Refetch entries to update the local list and checkmarks ---
    // This is important to ensure the state is correct after delete+create
    const timelineResponse = await dataService.listTimelinesByStudent(props.subcourse.id, props.studentId);
    existingTimelineEntries.value = timelineResponse.data || [];

    // --- Reset form and close modal ---
    resetFormFields();
    selectedStepValue.value = null; // Reset radio selection
    customTitle.value = ''; // Reset custom title

    emit('log-saved'); // Notify parent a log was saved
    emit('close'); // Close modal on success

  } catch (err) {
    console.error("Failed to save timeline entry:", err);
    saveError.value = `Failed to save log: ${err.response?.data?.error || err.message || 'Unknown error'}`;
  } finally {
    isSaving.value = false;
  }
};


// --- Watchers ---
watch(selectedStepValue, (newValue, oldValue) => {
  console.log("Timeline Modal Watcher: selectedStepValue changed to", newValue);
  // Always reset note/file and custom title section when selection changes
  resetFormFields();
  customTitle.value = ''; // Explicitly reset custom title input
  saveError.value = null; // Clear save error on selection change

  if (newValue === 'finish') {
    console.log("Timeline Modal Watcher: Emitting request-finish-log for subcourse", props.subcourse?.id);
    emit('request-finish-log', props.subcourse);
  }
  // No special action needed for predefined steps or 'other' selection here,
  // just the form reset is enough to clear previous inputs.
});

// --- Lifecycle Hooks ---
onMounted(fetchData);

// Refetch data if subcourse or week changes
watch(() => [props.subcourse.id, props.currentWeek], ([newSubcourseId, newWeek], [oldSubcourseId, oldWeek]) => {
  // Avoid refetching if only the watch is triggered by initial setup without prop changes
  if (newSubcourseId !== oldSubcourseId || newWeek !== oldWeek) {
     console.log(`Props changed: subcourse ${oldSubcourseId} -> ${newSubcourseId}, week ${oldWeek} -> ${newWeek}. Refetching data.`);
     fetchData();
  }
}, { immediate: false }); // Use immediate: false if onMounted already calls fetchData

// Clear file input reference on unmount (optional but good practice)
import { onUnmounted } from 'vue';
onUnmounted(() => {
  fileInputRef.value = null;
});

</script>

<style scoped>
/* Styles are primarily handled by Tailwind/DaisyUI classes now */
/* Added scoped styles for DaisyUI's has-[:checked] pseudo-class */
.has-\[:checked\]\:border-primary:has(input[type="radio"]:checked) {
  border-color: hsl(var(--p));
}
.has-\[:checked\]\:bg-primary\/10:has(input[type="radio"]:checked) {
  background-color: hsla(var(--p) / 0.1);
}
/* Style for the 'Others' radio button */
.has-\[:checked\]\:border-info:has(input[type="radio"][value="other"]:checked) {
  border-color: hsl(var(--in));
}
.has-\[:checked\]\:bg-info\/10:has(input[type="radio"][value="other"]:checked) {
  background-color: hsla(var(--in) / 0.1);
}
/* Style for the 'Finish' radio button */
.has-\[:checked\]\:border-accent:has(input[type="radio"][value="finish"]:checked) {
  border-color: hsl(var(--a));
}
.has-\[:checked\]\:bg-accent\/10:has(input[type="radio"][value="finish"]:checked) {
  background-color: hsla(var(--a) / 0.1);
}
</style>
