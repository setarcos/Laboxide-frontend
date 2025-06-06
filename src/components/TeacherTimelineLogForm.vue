// src/components/TeacherTimelineLogForm.vue
<template>
  <form @submit.prevent="submitForm">
    <p class="text-sm mb-4">
      Adding log for student:
      <span class="font-semibold"
        >{{ student.stu_name }} ({{ student.stu_id }})</span
      >
    </p>

    <div class="form-control mb-3">
      <label class="label cursor-pointer justify-start gap-4">
        <span class="label-text text-sm">Type:</span>
        <span class="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="teacher_note_type"
            class="radio radio-sm"
            :value="0"
            v-model="noteType"
          />
          Text Note
        </span>
        <span class="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="teacher_note_type"
            class="radio radio-sm"
            :value="1"
            v-model="noteType"
          />
          File Upload
        </span>
      </label>
    </div>

    <!-- Text Note Input -->
    <div v-if="noteType === 0" class="form-control mb-4">
      <label class="label pb-1"
        ><span class="label-text">Note Content:</span></label
      >
      <textarea
        class="textarea textarea-bordered h-24 text-sm"
        placeholder="Enter observation or note..."
        v-model="noteContent"
        required
      ></textarea>
    </div>

    <!-- File Input -->
    <div v-if="noteType === 1" class="form-control mb-4">
      <label class="label pb-1"
        ><span class="label-text">Select File:</span></label
      >
      <input
        type="file"
        class="file-input file-input-bordered file-input-sm w-full text-sm"
        ref="fileInputRef"
        @change="handleFileChange"
        required
      />
      <span v-if="fileError" class="text-error text-xs mt-1">{{
        fileError
      }}</span>
    </div>

    <div v-if="saveError" class="text-error text-sm mt-2">{{ saveError }}</div>

    <div class="modal-action mt-6">
      <button
        type="button"
        class="btn btn-ghost btn-sm"
        @click="$emit('close')"
        :disabled="isSaving"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary btn-sm"
        :class="{ loading: isSaving }"
        :disabled="isSaving || !isNoteValid"
      >
        {{ isSaving ? "Saving..." : "Save Log Entry" }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, computed } from "vue";
import * as dataService from "@/services/dataService";

const props = defineProps({
  student: { type: Object, required: true },
  subcourseId: { type: [String, Number], required: true },
  scheduleId: { type: Number, required: true }, // ID of the main schedule item for the week
  teacherId: { type: String, required: true },
});

const emit = defineEmits(["save", "close"]);

const noteType = ref(0); // 0 = text, 1 = file
const noteContent = ref("");
const fileToUpload = ref(null);
const fileInputRef = ref(null);
const fileError = ref(null);
const saveError = ref(null);
const isSaving = ref(false);

const isNoteValid = computed(() => {
  if (noteType.value === 0) {
    return noteContent.value.trim().length > 0;
  } else {
    return !!fileToUpload.value;
  }
});

const handleFileChange = (event) => {
  fileError.value = null;
  const file = event.target.files[0];
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      // Example: 10MB limit
      fileError.value = "File is too large (max 10MB).";
      fileToUpload.value = null;
      if (fileInputRef.value) fileInputRef.value.value = "";
      return;
    }
    fileToUpload.value = file;
  } else {
    fileToUpload.value = null;
  }
};

const submitForm = async () => {
  if (!isNoteValid.value) {
    saveError.value =
      noteType.value === 0
        ? "Note content cannot be empty."
        : "Please select a file to upload.";
    return;
  }
  isSaving.value = true;
  saveError.value = null;

  const formData = new FormData();
  formData.append("stu_id", props.student.stu_id);
  formData.append("tea_id", props.teacherId);
  formData.append("schedule_id", props.scheduleId);
  formData.append("subcourse_id", props.subcourseId);
  formData.append("notetype", noteType.value);
  formData.append("subschedule", "-");
  if (noteType.value === 0) {
    formData.append("note", noteContent.value.trim());
  } else if (fileToUpload.value) {
    formData.append("file", fileToUpload.value, fileToUpload.value.name);
  }

  try {
    await dataService.createTimeline(formData);
    emit("save"); // Notify parent of success
  } catch (err) {
    console.error("Failed to save teacher timeline entry:", err);
    saveError.value = `Save failed: ${err.response?.data?.error || err.message || "Unknown error"}`;
  } finally {
    isSaving.value = false;
  }
};
</script>
