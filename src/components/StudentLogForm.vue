// src/components/StudentLogForm.vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- Display Student Info (Read-only, name from store) -->
      <div class="text-sm">
        <strong>{{ $t("stulog.student") }}</strong>
        {{
          authStore.user?.realname || formData.stu_name || $t("stulog.na")
        }}
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
    !isEquipmentOff.value
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
