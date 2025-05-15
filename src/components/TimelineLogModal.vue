// src/components/TimelineLogModal.vue
<template>
  <div class="modal-content-wrapper">
    <h3 class="font-bold text-lg mb-4">
      Log Progress for {{ subcourse.course_name }} (Week {{ currentWeek }})
    </h3>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-info"></span>
      <p>Loading schedules, steps, and progress...</p>
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
      <!-- Week Selection Dropdown -->
      <div class="form-control mb-4">
        <label class="label pb-1">
          <span class="label-text font-semibold">Target Week for this Log:</span>
        </label>
        <select v-model="selectedScheduleId" class="select select-bordered select-sm w-full" :disabled="allAvailableSchedules.length === 0">
          <option disabled :value="null">
            {{ allAvailableSchedules.length === 0 ? 'No schedules available' : 'Select a week' }}
          </option>
          <option v-for="sched in allAvailableSchedules" :key="sched.id" :value="sched.id">
            Week {{ sched.week }}
            <span v-if="sched.id === scheduleForWeek?.id"> (Current Week)</span>
            <span v-if="sched.name"> - {{ sched.name}}</span>
          </option>
        </select>
      </div>

      <!-- Step Selection -->
      <div class="form-control mb-4">
        <label class="label pb-1">
          <span class="label-text font-semibold">Select Step or Action to Log:</span>
        </label>
        <div v-if="!selectedScheduleId" class="text-warning text-sm italic">
          Please select a target week from the dropdown above to see available steps.
        </div>
        <div v-else-if="isFetchingSubSchedules" class="text-center py-3">
            <span class="loading loading-sm loading-spinner text-info"></span>
            <p class="text-xs">Loading steps for selected week...</p>
        </div>
        <div v-else-if="selectedScheduleObject && subSchedules.length === 0 && selectedScheduleId" class="text-info text-sm italic">
          No specific steps defined for Week {{ selectedScheduleObject.week }}. You can use 'Others' or mark as finished.
        </div>
        <!-- Step List -->
        <div v-else-if="subSchedules.length > 0" class="space-y-1">
          <label v-for="step in subSchedules" :key="step.id" class="flex items-center cursor-pointer p-1.5 rounded hover:bg-base-200 border border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <input
              type="radio"
              name="timeline_step"
              class="radio radio-primary radio-sm mr-2"
              :value="step.title"
              v-model="selectedStepValue"
            />
            <span v-if="isStepLogged(step.title)" class="mr-2 tooltip tooltip-right" data-tip="Already Logged with this original title for the selected week"> ✅ </span>
            <span class="flex-grow text-sm">
              <span class="font-mono bg-base-300 rounded px-1.5 py-0.5 mr-1.5 text-xs">{{ step.step }}</span>
              {{ step.title }}
            </span>
          </label>
        </div>
        <!-- "Others" / "Finish" Options - only if a schedule is selected -->
        <div v-if="selectedScheduleId" class="space-y-1 mt-1">
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

      <!-- Note Input (Only if a standard step or "Others" is selected, and a schedule is selected) -->
      <div v-if="selectedScheduleId && (selectedStepValue && selectedStepValue !== 'finish')" class="mt-4 border-t pt-4">
        <h4 class="font-semibold mb-2 text-base">
          Add Note/File for Log Entry (Week {{ selectedScheduleObject?.week }}):
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
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import * as dataService from '@/services/dataService';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  subcourse: { type: Object, required: true },
  studentId: { type: String, required: true },
  currentWeek: { type: Number, required: true },
});

const emit = defineEmits(['close', 'request-finish-log', 'log-saved']);

const authStore = useAuthStore();

const isLoading = ref(true); // For initial full load
const isFetchingSubSchedules = ref(false); // For loading sub-schedules when week changes
const error = ref(null);
const saveError = ref(null);
const isSaving = ref(false);

const allAvailableSchedules = ref([]); // All schedules for the course
const scheduleForWeek = ref(null); // The schedule object for props.currentWeek (context)
const selectedScheduleId = ref(null); // ID of the schedule selected in the dropdown
const subSchedules = ref([]); // Steps for the selectedScheduleId
const existingTimelineEntries = ref([]); // All entries for this student & subcourse

const selectedStepValue = ref(null);
const customTitle = ref('');

const noteType = ref(0);
const noteContent = ref('');
const fileToUpload = ref(null);
const fileInputRef = ref(null);
const fileError = ref(null);

// --- Computed Properties ---
const selectedScheduleObject = computed(() => {
  return allAvailableSchedules.value.find(s => s.id === selectedScheduleId.value) || null;
});

const isLoggable = computed(() => {
  if (!selectedScheduleId.value) return false; // Must have a target week selected
  if (!selectedStepValue.value || selectedStepValue.value === 'finish') {
    return false;
  }
  if (selectedStepValue.value === 'other' && customTitle.value.trim().length === 0) {
      return false;
  }
  if (noteType.value === 0) {
    return noteContent.value.trim().length > 0;
  } else {
    return !!fileToUpload.value && !fileError.value;
  }
});


// --- Methods ---
const fetchSubSchedulesForSelectedSchedule = async () => {
  if (!selectedScheduleId.value) {
    subSchedules.value = [];
    return;
  }
  isFetchingSubSchedules.value = true;
  error.value = null; // Clear general error, or use a specific error ref for sub-schedules
  try {
    const subSchedulesResponse = await dataService.getSubSchedules(selectedScheduleId.value);
    subSchedules.value = (subSchedulesResponse.data || []).sort((a, b) => a.step - b.step);
  } catch (err) {
    console.error(`Failed to load sub-schedules for schedule ID ${selectedScheduleId.value}:`, err);
    // Potentially set a more specific error message here if needed
    error.value = `Failed to load steps for Week ${selectedScheduleObject.value?.week || 'selected'}: ${err.response?.data?.error || err.message || 'Unknown error'}`;
    subSchedules.value = [];
  } finally {
    isFetchingSubSchedules.value = false;
  }
};

const fetchData = async () => {
  isLoading.value = true;
  error.value = null;
  allAvailableSchedules.value = [];
  scheduleForWeek.value = null;
  selectedScheduleId.value = null;
  subSchedules.value = [];
  existingTimelineEntries.value = [];

  // Reset form state completely on data fetch
  selectedStepValue.value = null;
  customTitle.value = '';
  resetFormFields();

  try {
    // 1. Fetch all schedules for the course
    const schedulesResponse = await dataService.getSchedules(props.subcourse.course_id);
    allAvailableSchedules.value = (schedulesResponse.data || []).sort((a, b) => a.week - b.week);

    // 2. Find the schedule corresponding to the current context week
    scheduleForWeek.value = allAvailableSchedules.value.find(s => s.week === props.currentWeek);

    // 3. Set the default selected schedule ID to the current context week's schedule
    selectedScheduleId.value = scheduleForWeek.value?.id || null;
    // If no schedule for currentWeek, selectedScheduleId remains null, user must pick from dropdown.

    // 4. Fetch sub-schedules for the initially selected schedule (if any)
    if (selectedScheduleId.value) {
      await fetchSubSchedulesForSelectedSchedule(); // This will also handle errors for sub-schedules
    } else if (allAvailableSchedules.value.length > 0) {
        // If current week has no schedule, but other schedules exist, prompt selection
        // No explicit action needed here, the UI will guide
    } else {
        // No schedules at all for this course
        console.warn(`No schedules found for course ${props.subcourse.course_id}`);
    }

    // 5. Fetch all existing timeline entries for the student & subcourse
    const timelineResponse = await dataService.listTimelinesByStudent(props.subcourse.id, props.studentId);
    existingTimelineEntries.value = timelineResponse.data || [];

  } catch (err) {
    console.error("Failed to load timeline modal data:", err);
    error.value = `Failed to load data: ${err.response?.data?.error || err.message || 'Unknown error'}`;
  } finally {
    isLoading.value = false;
  }
};

const isStepLogged = (originalStepTitle) => {
  if (!selectedScheduleId.value || !originalStepTitle) return false;
   return existingTimelineEntries.value.some(entry =>
    entry.subschedule === originalStepTitle &&
    entry.schedule_id === selectedScheduleId.value // Check against the *selected* schedule ID
  );
};

const findExistingEntryIdForLogTitle = (logTitle, scheduleIdToMatch) => {
  if (!logTitle || !scheduleIdToMatch) return null;
  const entriesMatchingTitleAndSchedule = existingTimelineEntries.value
    .filter(entry =>
      entry.subschedule === logTitle &&
      entry.schedule_id === scheduleIdToMatch // Match against the provided schedule ID
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Get the latest one

  return entriesMatchingTitleAndSchedule.length > 0 ? entriesMatchingTitleAndSchedule[0].id : null;
};

const handleFileChange = (event) => {
  fileError.value = null;
  const file = event.target.files[0];
  if (file) {
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

    if (!isFileTypeAllowed && file.size > 0) { // Added file.size > 0 check for empty type files
       fileError.value = 'Unsupported file type. Allowed: images, PDF, text, common documents.';
       fileToUpload.value = null;
       if (fileInputRef.value) fileInputRef.value.value = '';
       return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      fileError.value = 'File is too large (max 10MB).';
      fileToUpload.value = null;
      if (fileInputRef.value) fileInputRef.value.value = '';
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
  noteType.value = 0;
  saveError.value = null;
};

const submitTimelineEntry = async () => {
  if (!isLoggable.value) {
    console.warn("Attempted to save invalid log entry.");
    // Warnings are shown near inputs by isLoggable's dependent checks
    if (!selectedScheduleId.value) saveError.value = "Target week not selected.";
    else if (!selectedStepValue.value) saveError.value = "No step/action selected.";
    else if (selectedStepValue.value === 'other' && !customTitle.value.trim()) saveError.value = "Custom title required for 'Others'.";
    else if (noteType.value === 0 && !noteContent.value.trim()) saveError.value = "Text note required.";
    else if (noteType.value === 1 && !fileToUpload.value) saveError.value = "File required for upload.";
    return;
  }

  if (!selectedStepValue.value || selectedStepValue.value === 'finish' || !selectedScheduleId.value) {
     console.warn("Submit called with invalid selection or missing schedule ID.");
     saveError.value = "Cannot save: ensure a target week and a loggable step are selected.";
     return;
  }

  isSaving.value = true;
  saveError.value = null;

  try {
    const logTitleToSave = selectedStepValue.value === 'other' ? customTitle.value.trim() : selectedStepValue.value.trim();
    const targetScheduleId = selectedScheduleId.value; // Use the ID from the dropdown

    const entryToDeleteId = findExistingEntryIdForLogTitle(logTitleToSave, targetScheduleId);

    if (entryToDeleteId) {
      console.log(`Previous entry found (title: "${logTitleToSave}", schedule ID: ${targetScheduleId}, entry ID: ${entryToDeleteId}). Deleting.`);
      try {
        await dataService.deleteTimeline(entryToDeleteId);
        existingTimelineEntries.value = existingTimelineEntries.value.filter(entry => entry.id !== entryToDeleteId);
      } catch (deleteErr) {
        console.error(`Failed to delete previous entry ID ${entryToDeleteId}:`, deleteErr);
        saveError.value = `Failed to replace previous entry: ${deleteErr.response?.data?.error || deleteErr.message}`;
        isSaving.value = false;
        return;
      }
    }

    const formData = new FormData();
    formData.append('stu_id', props.studentId);
    formData.append('tea_id', authStore.user?.id || '-'); // Use actual teacher ID if available
    formData.append('schedule_id', targetScheduleId);
    formData.append('subschedule', logTitleToSave);
    formData.append('subcourse_id', props.subcourse.id);
    formData.append('notetype', noteType.value);

    if (noteType.value === 0) {
      formData.append('note', noteContent.value.trim());
    } else if (fileToUpload.value) {
      formData.append('file', fileToUpload.value, fileToUpload.value.name);
    }
    // isLoggable ensures one of these is present

    const response = await dataService.createTimeline(formData);
    console.log("New timeline entry created:", response.data);

    // Refetch entries to update local list and checkmarks
    const timelineResponse = await dataService.listTimelinesByStudent(props.subcourse.id, props.studentId);
    existingTimelineEntries.value = timelineResponse.data || [];

    resetFormFields();
    // selectedStepValue.value = null; // Keep this commented if you want the selection to persist after save for quick re-log to same step for different week
    // customTitle.value = '';
    // If you want to fully reset the step selection after a successful save:
    selectedStepValue.value = null;
    customTitle.value = '';


    emit('log-saved');
    emit('close');

  } catch (err) {
    console.error("Failed to save timeline entry:", err);
    saveError.value = `Failed to save log: ${err.response?.data?.error || err.message || 'Unknown error'}`;
  } finally {
    isSaving.value = false;
  }
};


// --- Watchers ---
watch(selectedScheduleId, async (newId, oldId) => {
  if (newId === oldId && subSchedules.value.length > 0 && !isFetchingSubSchedules.value) return; // Avoid redundant fetches if ID is same and steps loaded

  console.log("Selected Schedule ID changed to:", newId);
  // Reset form parts related to step selection and content
  selectedStepValue.value = null;
  customTitle.value = '';
  resetFormFields(); // Resets note/file, clears saveError
  subSchedules.value = []; // Clear current sub-schedules immediately

  if (newId) {
    await fetchSubSchedulesForSelectedSchedule();
  }
  // Checkmarks (isStepLogged) will update reactively based on new subSchedules and selectedScheduleId
});

watch(selectedStepValue, (newValue) => {
  console.log("Timeline Modal Watcher: selectedStepValue changed to", newValue);
  resetFormFields(); // Always reset note/file when step selection changes
  customTitle.value = ''; // Explicitly reset custom title input
  saveError.value = null;

  if (newValue === 'finish') {
    if (!selectedScheduleId.value) {
        // This should ideally not happen if UI is structured well
        saveError.value = "Please select a target week before marking as finished.";
        selectedStepValue.value = null; // Revert selection
        return;
    }
    console.log("Timeline Modal Watcher: Emitting request-finish-log for subcourse", props.subcourse?.id, "for schedule", selectedScheduleId.value);
    emit('request-finish-log', props.subcourse);
    // You might want to pass selectedScheduleObject.value or selectedScheduleId.value to the finish log event
    //emit('request-finish-log', { subcourse: props.subcourse, schedule: selectedScheduleObject.value });
  }
});

// --- Lifecycle Hooks ---
onMounted(fetchData);

watch(() => [props.subcourse.id, props.currentWeek], ([newSubcourseId, newWeek], [oldSubcourseId, oldWeek]) => {
  if (newSubcourseId !== oldSubcourseId || newWeek !== oldWeek) {
     console.log(`Props changed: subcourse ${oldSubcourseId} -> ${newSubcourseId}, week ${oldWeek} -> ${newWeek}. Refetching data.`);
     fetchData();
  }
}, { immediate: false });

onUnmounted(() => {
  fileInputRef.value = null;
});

</script>

<style scoped>
/* Styles are primarily handled by Tailwind/DaisyUI classes */
.has-\[:checked\]\:border-primary:has(input[type="radio"]:checked) {
  border-color: hsl(var(--p));
}
.has-\[:checked\]\:bg-primary\/10:has(input[type="radio"]:checked) {
  background-color: hsla(var(--p) / 0.1);
}
.has-\[:checked\]\:border-info:has(input[type="radio"][value="other"]:checked) {
  border-color: hsl(var(--in));
}
.has-\[:checked\]\:bg-info\/10:has(input[type="radio"][value="other"]:checked) {
  background-color: hsla(var(--in) / 0.1);
}
.has-\[:checked\]\:border-accent:has(input[type="radio"][value="finish"]:checked) {
  border-color: hsl(var(--a));
}
.has-\[:checked\]\:bg-accent\/10:has(input[type="radio"][value="finish"]:checked) {
  background-color: hsla(var(--a) / 0.1);
}
</style>
