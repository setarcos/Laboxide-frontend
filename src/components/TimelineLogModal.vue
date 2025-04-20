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
        <label class="label">
          <span class="label-text font-semibold">Select Step to Log:</span>
        </label>
        <div v-if="!scheduleForWeek" class="text-warning text-sm italic">
          No schedule found for Week {{ currentWeek }}. Cannot log progress.
        </div>
        <div v-else-if="subSchedules.length === 0" class="text-info text-sm italic">
          No specific steps defined for Week {{ currentWeek }}. You can add a general note or mark as finished.
        </div>
        <!-- Step List -->
        <div v-else class="space-y-1">
          <label v-for="step in subSchedules" :key="step.id" class="flex items-center cursor-pointer p-1.5 rounded hover:bg-base-200 border border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <input
              type="radio"
              name="timeline_step"
              class="radio radio-primary radio-sm mr-2"
              :value="step.title"
              v-model="selectedStepTitle"
            />
            <span v-if="isStepLogged(step.title)" class="mr-2 tooltip tooltip-right" data-tip="Already Logged"> ✅ </span>
            <span class="flex-grow text-sm">
              <span class="font-mono bg-base-300 rounded px-1.5 py-0.5 mr-1.5 text-xs">{{ step.step }}</span>
              {{ step.title }}
            </span>
          </label>
          <!-- Finish Option -->
          <label class="flex items-center cursor-pointer p-1.5 rounded hover:bg-base-200 border border-transparent has-[:checked]:border-accent has-[:checked]:bg-accent/10">
            <input
              type="radio"
              name="timeline_step"
              class="radio radio-accent radio-sm mr-2"
              value="finish"
              v-model="selectedStepTitle"
            />
            <span class="flex-grow font-semibold text-accent text-sm">Finish Experiment / Final Log</span>
          </label>
        </div>
      </div>

      <!-- Note Input (Only if a step is selected, excluding 'finish') -->
      <div class="mt-4 border-t pt-4">
        <h4 class="font-semibold mb-2 text-base">
          Add Note/File for Step: <span class="font-normal text-primary text-sm">{{ selectedStepTitle }}</span>
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
            placeholder="Enter your observations or notes for this step..."
            v-model="noteContent"
          ></textarea>
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
        </div>

        <div v-if="saveError" class="text-error text-sm mt-2">{{ saveError }}</div>

        <div class="modal-action mt-4">
          <button type="button" class="btn btn-primary btn-sm" @click="submitTimelineEntry" :disabled="isSaving || !isNoteValid" :class="{'loading': isSaving}">
            {{ isSaving ? 'Saving...' : 'Save Step Log' }}
          </button>
        </div>
      </div>
      <!-- Removed the extra button/div for 'finish' state -->

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
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  subcourse: { type: Object, required: true },
  studentId: { type: String, required: true },
  currentWeek: { type: Number, required: true },
});

const emit = defineEmits(['close', 'request-finish-log', 'log-saved']);

const authStore = useAuthStore();

const isLoading = ref(true);
const error = ref(null);
const saveError = ref(null);
const isSaving = ref(false);

const scheduleForWeek = ref(null);
const subSchedules = ref([]);
const existingTimelineEntries = ref([]);

const selectedStepTitle = ref(null);
const noteType = ref(0);
const noteContent = ref('');
const fileToUpload = ref(null);
const fileInputRef = ref(null);
const fileError = ref(null);

// --- Computed Properties ---
// For display purposes, find the step object matching the selected title
const selectedStepObject = computed(() => {
  if (!selectedStepTitle.value || selectedStepTitle.value === 'finish') return null;
  return subSchedules.value.find(s => s.title === selectedStepTitle.value);
});

// Used in the H4 title
const selectedStepDisplayTitle = computed(() => {
  const stepObj = selectedStepObject.value;
  return stepObj ? `Step ${stepObj.step}: ${stepObj.title}` : (selectedStepTitle.value || '');
});

const isNoteValid = computed(() => {
  if (noteType.value === 0) {
    return noteContent.value.trim().length > 0;
  } else {
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
  selectedStepTitle.value = null; // Reset renamed state
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

    const timelineResponse = await dataService.listTimelinesByStudent(props.subcourse.id, props.studentId);
    existingTimelineEntries.value = timelineResponse.data || [];

  } catch (err) {
    console.error("Failed to load timeline modal data:", err);
    error.value = `Failed to load data: ${err.response?.data?.error || err.message || 'Unknown error'}`;
  } finally {
    isLoading.value = false;
  }
};

const getLoggedEntryIdForStepTitle = (stepTitle) => {
  if (!scheduleForWeek.value || !stepTitle || stepTitle === 'finish') return null;
  const entriesForStep = existingTimelineEntries.value
  .filter(entry =>
    entry.subschedule === stepTitle && // Compare titles
      entry.schedule_id === scheduleForWeek.value.id
  )
  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return entriesForStep.length > 0 ? entriesForStep[0].id : null;
};

const isStepLogged = (stepTitle) => {
  if (!scheduleForWeek.value || !stepTitle || stepTitle === 'finish') return false;
  return existingTimelineEntries.value.some(entry =>
    entry.subschedule === stepTitle && // Compare titles
      entry.schedule_id === scheduleForWeek.value.id
  );
};

const handleFileChange = (event) => {
  fileError.value = null;
  const file = event.target.files[0];
  if (file) {
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
  noteType.value = 0;
  saveError.value = null;
};

const submitTimelineEntry = async () => {
  // *** Use selectedStepTitle ***
  if (!selectedStepTitle.value || selectedStepTitle.value === 'finish' || !scheduleForWeek.value || !isNoteValid.value) {
    saveError.value = "Please select a step and provide a note or file.";
    return;
  }
  isSaving.value = true;
  saveError.value = null;
  try {
    // *** Use title-based check for deletion ***
    const entryToDeleteId = getLoggedEntryIdForStepTitle(selectedStepTitle.value);
    if (entryToDeleteId) {
      console.log(`Found previous entry for step "${selectedStepTitle.value}", attempting deletion (ID: ${entryToDeleteId})`);
      try {
        await dataService.deleteTimeline(entryToDeleteId);
        console.log(`Successfully deleted previous entry ID: ${entryToDeleteId}`);
      } catch (deleteErr) { return; }
    } else {
      console.log(`No previous entry found for step "${selectedStepTitle.value}". Proceeding with creation.`);
    }

    const formData = new FormData();
    formData.append('stu_id', props.studentId);
    formData.append('tea_name', '-');
    formData.append('schedule_id', scheduleForWeek.value.id);
    formData.append('subschedule', selectedStepTitle.value);
    formData.append('subcourse_id', props.subcourse.id);
    formData.append('notetype', noteType.value);
    formData.append('timestamp', '2000-01-01 08:08:08');
    if (noteType.value === 0) { formData.append('note', noteContent.value.trim()); }
    else if (fileToUpload.value) { formData.append('file', fileToUpload.value, fileToUpload.value.name); }

    const response = await dataService.createTimeline(formData);
    console.log("New timeline entry created:", response.data);

    const timelineResponse = await dataService.listTimelinesByStudent(props.subcourse.id, props.studentId);
    existingTimelineEntries.value = timelineResponse.data || [];
    resetFormFields();
    emit('log-saved');
    emit('close'); // Close modal on success

  } catch (err) { /* error handling */ }
  finally { isSaving.value = false; }
};

watch(selectedStepTitle, (newValue, oldValue) => {
  console.log("Timeline Modal Watcher: selectedStepTitle changed to", newValue);
  if (newValue === 'finish') {
    console.log("Timeline Modal Watcher: Emitting request-finish-log for subcourse", props.subcourse?.id);
    emit('request-finish-log', props.subcourse);
  } else if (newValue && newValue !== oldValue) {
    resetFormFields();
    saveError.value = null;
  }
});

onMounted(fetchData);
watch(() => [props.subcourse.id, props.currentWeek], fetchData);

</script>

<style scoped>
/* Styles are primarily handled by Tailwind/DaisyUI classes now */
.has-\[:checked\]\:border-primary:has(input[type="radio"]:checked) {
  border-color: hsl(var(--p));
}
.has-\[:checked\]\:bg-primary\/10:has(input[type="radio"]:checked) {
  background-color: hsla(var(--p) / 0.1);
}
.has-\[:checked\]\:border-accent:has(input[type="radio"][value="finish"]:checked) {
  border-color: hsl(var(--a));
}
.has-\[:checked\]\:bg-accent\/10:has(input[type="radio"][value="finish"]:checked) {
  background-color: hsla(var(--a) / 0.1);
}
</style>
