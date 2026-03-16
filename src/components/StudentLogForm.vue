// src/components/StudentLogForm.vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- Display Student Info (Read-only, name from store) -->
      <div class="text-sm">
        <strong>{{ $t("stulog.student") }}</strong>
        {{ authStore.user?.realname || formData.stu_name || $t("stulog.na") }}
        ({{ formData.stu_id || $t("stulog.na") }})
      </div>

      <div class="divider text-xs">{{ $t("stulog.logdetail") }}</div>

      <!-- Lab Room Selection -->
      <div class="form-control">
        <label for="room_id" class="label">
          <span class="label-text">{{ $t("stulog.room") }}</span>
          <!-- Add <span class="text-error">*</span> if room selection is mandatory -->
        </label>
        <div v-if="isLoadingRooms" class="text-sm text-gray-500 py-2">
          {{ $t("stulog.loadingRooms") }}
        </div>
        <div
          v-else-if="roomError"
          class="alert alert-warning alert-sm shadow-sm py-2"
        >
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="stroke-current flex-shrink-0 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{{ roomError }}</span>
          </div>
        </div>
        <select
          v-else
          id="room_id"
          v-model="formData.room_id"
          class="select select-bordered w-full"
          :disabled="labRooms.length === 0 && !roomError"
        >
          <option :value="null" disabled>
            {{
              labRooms.length === 0
                ? $t("stulog.noRooms")
                : $t("stulog.selectRoom")
            }}
          </option>
          <option v-for="room in labRooms" :key="room.id" :value="room.id">
            {{ room.name }} ({{ room.room }})
          </option>
        </select>
      </div>
      <!-- End Lab Room Selection -->

      <!-- Editable Fields -->
      <div class="form-control">
        <label for="lab_name" class="label">
          <span class="label-text">{{ $t("stulog.lab") }}</span>
        </label>
        <input
          id="lab_name"
          type="text"
          v-model.trim="formData.lab_name"
          :placeholder="$t('stulog.labPlaceholder')"
          class="input input-bordered w-full"
        />
      </div>

      <div class="form-control">
        <label for="seat" class="label">
          <span class="label-text">{{ $t("stulog.seat") }}</span>
        </label>
        <input
          id="seat"
          type="number"
          v-model.number="formData.seat"
          :placeholder="$t('stulog.seatPlaceholder')"
          class="input input-bordered w-full"
          min="0"
        />
      </div>

      <div class="form-control">
        <label for="note" class="label">
          <span class="label-text"
            >{{ $t("stulog.note") }}<span class="text-error">*</span></span
          >
        </label>
        <textarea
          id="note"
          v-model.trim="formData.note"
          :placeholder="$t('stulog.notePlaceholder')"
          class="textarea textarea-bordered h-32 w-full"
          required
        ></textarea>
        <label class="label">
          <span class="label-text-alt text-gray-500">{{
            $t("stulog.notehint")
          }}</span>
        </label>
      </div>

      <!-- Mandatory Confirmation Checkboxes -->
      <div class="divider text-xs">{{ $t("stulog.post") }}</div>

      <div class="space-y-2 mt-2">
        <div class="form-control">
          <label
            for="check-clean"
            class="label cursor-pointer justify-start gap-3"
          >
            <input
              type="checkbox"
              id="check-clean"
              v-model="isTableCleaned"
              class="checkbox checkbox-primary checkbox-sm"
            />
            <span class="label-text"
              >{{ $t("stulog.clean") }}<span class="text-error">*</span></span
            >
          </label>
        </div>
        <div class="form-control">
          <label
            for="check-off"
            class="label cursor-pointer justify-start gap-3"
          >
            <input
              type="checkbox"
              id="check-off"
              v-model="isEquipmentOff"
              class="checkbox checkbox-primary checkbox-sm"
            />
            <span class="label-text"
              >{{ $t("stulog.off") }}<span class="text-error">*</span></span
            >
          </label>
        </div>
      </div>

      <!-- Picture Upload -->
      <div class="form-control mt-4">
        <p class="text-sm text-gray-500 mb-2">{{ $t("stulog.pictureHint") }}</p>
        <button
          type="button"
          class="btn btn-outline btn-info w-full gap-2"
          @click="triggerFileInput"
          :disabled="isUploading"
        >
          <span v-if="isUploading" class="loading loading-spinner"></span>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {{ $t("stulog.picture") }}
        </button>
        <input
          type="file"
          ref="fileInputRef"
          class="hidden"
          accept="image/*"
          @change="handleFileChange"
        />
        <p v-if="uploadStatus" class="mt-2 text-xs" :class="uploadStatusClass">
          {{ uploadStatus }}
        </p>
      </div>
      <!-- End Confirmation Checkboxes -->
    </div>

    <!-- Actions -->
    <div class="modal-action mt-6">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        {{ $t("button.cancel") }}
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isSubmitDisabled"
        :class="{ loading: isSaving }"
      >
        {{
          isSaving
            ? $t("button.saving")
            : formData.id
              ? $t("stulog.update")
              : $t("stulog.save")
        }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import * as dataService from "@/services/dataService"; // Assuming getLabrooms is in dataService
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  initialData: {
    type: Object,
    required: true,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["save", "close"]);
const authStore = useAuthStore();

// --- State for Checkboxes ---
const isTableCleaned = ref(false);
const isEquipmentOff = ref(false);

// --- State for Picture Upload ---
const fileInputRef = ref(null);
const isUploading = ref(false);
const hasUploadedPicture = ref(false);
const uploadStatus = ref("");
const uploadStatusClass = ref("");

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Basic validation (similar to TimelineLogModal)
  if (!file.type.startsWith("image/")) {
    uploadStatus.value = t("tlform.error_file_type");
    uploadStatusClass.value = "text-error";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    uploadStatus.value = t("tlform.error_file_size");
    uploadStatusClass.value = "text-error";
    return;
  }

  isUploading.value = true;
  uploadStatus.value = "";
  try {
    const studentId = authStore.user?.userId || "";
    const subcourseId =
      props.initialData?.subcourse_id || props.initialData?.cid || 0;
    const scheduleId =
      props.initialData?.schedule_id || props.initialData?.id || 0;

    // Check for existing 'CleanedTable' entry and delete it
    try {
      const timelineResponse = await dataService.listTimelinesByStudent(
        subcourseId,
        studentId,
      );
      const existingEntries = timelineResponse.data || [];
      const entryToDelete = existingEntries.find(
        (entry) =>
          entry.subschedule === "CleanedTable" &&
          entry.schedule_id === scheduleId,
      );

      if (entryToDelete) {
        await dataService.deleteTimeline(entryToDelete.id);
      }
    } catch (err) {
      console.warn("Failed to check or delete existing timeline entry:", err);
    }

    const formDataUpload = new FormData();
    formDataUpload.append("stu_id", studentId);
    formDataUpload.append("tea_id", "-");
    formDataUpload.append("schedule_id", scheduleId);
    formDataUpload.append("subschedule", "CleanedTable");
    formDataUpload.append("subcourse_id", subcourseId);
    formDataUpload.append("notetype", 1);
    formDataUpload.append("file", file, file.name);

    await dataService.createTimeline(formDataUpload);

    hasUploadedPicture.value = true;
    isTableCleaned.value = true;
    isEquipmentOff.value = true;
    uploadStatus.value = t("stulog.uploadSuccess");
    uploadStatusClass.value = "text-success";
  } catch (err) {
    console.error("Failed to upload picture:", err);
    uploadStatus.value = t("stulog.uploadError");
    uploadStatusClass.value = "text-error";
  } finally {
    isUploading.value = false;
    if (fileInputRef.value) fileInputRef.value.value = "";
  }
};

// --- State for Lab Rooms ---
const labRooms = ref([]);
const isLoadingRooms = ref(false);
const roomError = ref(null);
// ---------------------------

const defaultLogStructure = {
  id: null,
  stu_id: "",
  stu_name: "",
  subcourse_id: null,
  room_id: null, // Added room_id, default to null
  seat: null,
  lab_name: "",
  note: "",
};

const formData = ref({ ...defaultLogStructure });

// --- Fetch Lab Rooms ---
const fetchLabRooms = async () => {
  isLoadingRooms.value = true;
  roomError.value = null;
  try {
    // Assuming dataService.getLabrooms() is defined and returns { data: [...] }
    const response = await dataService.getLabrooms();
    labRooms.value = response.data || [];

    // If initialData has a room_id, ensure it's still valid.
    // If not, the dropdown will show "Select a lab room" or the first option.
    // If a selected initialData.room_id is no longer in labRooms,
    // formData.value.room_id will retain that old ID, and the select
    // will likely show the placeholder or the first item.
    // If this behavior is not desired, add logic here to check if
    // formData.value.room_id exists in labRooms.value and reset if not.
    // Example:
    // if (formData.value.room_id && !labRooms.value.some(room => room.id === formData.value.room_id)) {
    //   formData.value.room_id = null; // Or set to a default if applicable
    // }
  } catch (err) {
    console.error("Failed to fetch lab rooms:", err);
    roomError.value = "Could not load lab rooms.";
    labRooms.value = []; // Ensure it's an empty array on error
  } finally {
    isLoadingRooms.value = false;
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchLabRooms();
});

// --- Watchers ---
watch(
  () => props.initialData,
  (newData) => {
    const mergedData = { ...defaultLogStructure, ...newData };

    mergedData.stu_name = authStore.user?.realname || mergedData.stu_name || "";
    mergedData.stu_id = mergedData.stu_id || authStore.user?.userId || "";

    if (!mergedData.note || mergedData.note.trim() === "") {
      mergedData.note = "None";
    }

    if (mergedData.seat === 0) {
      mergedData.seat = null;
    }

    // `room_id` will be picked from `newData` if present, or `null` from `defaultLogStructure`
    formData.value = mergedData;

    isTableCleaned.value = false;
    isEquipmentOff.value = false;

    // If lab rooms are already loaded and initialData.room_id is set,
    // but that room_id is not in the list, you might want to clear it.
    // This is more robust if done after fetchLabRooms completes or in conjunction.
    // For simplicity, current behavior is that an invalid initial room_id won't match.
    if (
      labRooms.value.length > 0 &&
      formData.value.room_id &&
      !labRooms.value.some((room) => room.id === formData.value.room_id)
    ) {
      console.warn(
        `Initial room_id ${formData.value.room_id} not found in available rooms. User may need to re-select.`,
      );
      // formData.value.room_id = null; // Optionally reset if an invalid ID is provided initially
    }
  },
  { immediate: true, deep: true },
);

// --- Computed property to control submit button disabled state ---
const isSubmitDisabled = computed(() => {
  // If room selection is mandatory, add this condition:
  // if (formData.value.room_id === null && labRooms.value.length > 0) return true;
  return (
    props.isSaving ||
    !formData.value.note ||
    formData.value.note.trim() === "" ||
    !isTableCleaned.value ||
    !isEquipmentOff.value ||
    !hasUploadedPicture.value
  );
});

// --- Handle form submission ---
const handleSubmit = () => {
  if (isSubmitDisabled.value) {
    // Check computed property first
    return;
  }

  if (!props.isSaving) {
    const dataToSave = {
      ...formData.value,
      seat:
        formData.value.seat === null || formData.value.seat === ""
          ? 0
          : Number(formData.value.seat),
      stu_id: formData.value.stu_id || authStore.user?.userId || "",
      stu_name: authStore.user?.realname || formData.value.stu_name || "",
      // room_id is already part of formData.value and will be null or an ID
      confirm: props.initialData?.confirm || 0,
      tea_note: props.initialData?.tea_note || "",
    };

    if (!dataToSave.stu_id) {
      console.error("Cannot save log: Missing student ID.");
      // Potentially show a user-facing error
      alert("Error: Could not determine student ID. Please check your login.");
      return;
    }

    // Optional: Add validation for room_id if it's mandatory but not covered by isSubmitDisabled
    // if (labRooms.value.length > 0 && dataToSave.room_id === null) {
    //   alert("Please select a lab room.");
    //   return;
    // }

    emit("save", dataToSave);
  }
};
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
