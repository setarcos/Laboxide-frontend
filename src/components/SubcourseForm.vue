<template>
  <form @submit.prevent="submitForm">
    <!-- Weekday -->
    <div class="form-control mb-4">
      <label class="label" for="subcourse-weekday">
        <span class="label-text">{{ $t("group.weekday") }}</span>
      </label>
      <select
        id="subcourse-weekday"
        class="select select-bordered w-full"
        v-model.number="formData.weekday"
        required
      >
        <option disabled :value="undefined">
          {{ $t("group.weekday_placeholder") }}
        </option>
        <option :value="1">{{ $t("group.monday") }}</option>
        <option :value="2">{{ $t("group.tuesday") }}</option>
        <option :value="3">{{ $t("group.wednesday") }}</option>
        <option :value="4">{{ $t("group.thursday") }}</option>
        <option :value="5">{{ $t("group.friday") }}</option>
        <option :value="6">{{ $t("group.saturday") }}</option>
        <option :value="7">{{ $t("group.sunday") }}</option>
      </select>
    </div>

    <!-- Part of a day -->
    <div class="form-control mb-4">
      <label class="label" for="subcourse-daypart">
        <span class="label-text">{{ $t("group.time") }}</span>
      </label>
      <select
        id="subcourse-daypart"
        class="select select-bordered w-full"
        v-model.number="formData.partday"
        required
      >
        <option disabled :value="undefined">
          {{ $t("group.time_placeholder") }}
        </option>
        <option :value="0">{{ $t("group.morning") }}</option>
        <option :value="1">{{ $t("group.afternoon") }}</option>
        <option :value="2">{{ $t("group.evening") }}</option>
        <option :value="3">{{ $t("group.late_afternoon") }}</option>
        <option :value="4">{{ $t("group.late_evening") }}</option>
      </select>
    </div>

    <!-- Room ID (Labroom) -->
    <div class="form-control mb-4">
      <label class="label" for="subcourse-room">
        <span class="label-text">{{ $t("group.classroom") }}</span>
      </label>
      <select
        id="subcourse-room"
        class="select select-bordered w-full"
        v-model.number="formData.room_id"
        required
        :disabled="isLoadingLabrooms || !!labroomError"
      >
        <option disabled :value="undefined">
          {{
            isLoadingLabrooms
              ? $t("group.loading_rooms")
              : labroomError
                ? $t("group.error_loading_rooms")
                : $t("group.select_room")
          }}
        </option>
        <option v-for="room in labrooms" :key="room.id" :value="room.id">
          {{ room.name }} ({{ room.room }})
        </option>
      </select>
      <label v-if="labroomError" class="label">
        <span class="label-text-alt text-error">{{ labroomError }}</span>
      </label>
    </div>

    <!-- Teacher Name -->
    <div class="form-control mb-4">
      <label class="label" for="subcourse-teacher">
        <span class="label-text">{{ $t("group.teacher_name") }}</span>
      </label>
      <input
        id="subcourse-teacher"
        type="text"
        :placeholder="$t('group.teacher_responsible')"
        class="input input-bordered w-full"
        v-model.trim="formData.tea_name"
        :disabled="!props.isAdmin"
        required
      />
    </div>

    <!-- Teacher ID -->
    <div class="form-control mb-4">
      <label class="label" for="subcourse-teacher-id">
        <span class="label-text">{{ $t("group.teacher_id") }}</span>
      </label>
      <input
        id="subcourse-teacher-id"
        type="text"
        :placeholder="$t('group.teacher_responsible')"
        class="input input-bordered w-full"
        v-model.trim="formData.tea_id"
        :disabled="!props.isAdmin"
        required
      />
    </div>

    <!-- Student Limit -->
    <div class="form-control mb-4">
      <label class="label" for="subcourse-limit">
        <span class="label-text">{{ $t("group.student_limit") }}</span>
      </label>
      <input
        id="subcourse-limit"
        type="number"
        min="0"
        :placeholder="$t('group.max_students')"
        class="input input-bordered w-full"
        v-model.number="formData.stu_limit"
        required
      />
    </div>

    <!-- Lag Week -->
    <div class="form-control mb-4">
      <label class="label" for="subcourse-lag">
        <span class="label-text">{{ $t("group.lag_week") }}</span>
        <span class="label-text-alt"
          >({{ $t("group.offset_from_semester_start") }})</span
        >
      </label>
      <input
        id="subcourse-lag"
        type="number"
        min="0"
        :placeholder="$t('group.example_lag_week')"
        class="input input-bordered w-full"
        v-model.number="formData.lag_week"
        required
      />
    </div>

    <!-- Actions -->
    <div class="modal-action mt-6">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        {{ $t("button.cancel") }}
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isSaving || isLoadingLabrooms || !formDataIsValid"
      >
        <span
          v-if="isSaving"
          class="loading loading-spinner loading-xs mr-2"
        ></span>
        {{ isSaving ? $t("group.saving") : $t("group.save_subcourse") }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, reactive, onMounted, computed } from "vue";
import * as dataService from "@/services/dataService";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({}), // Default to empty object, let createInitialFormData handle structure
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  courseId: {
    // This is the context Course ID from the parent view
    type: Number,
    required: true,
  },
  semesterId: {
    // This is the context Semester ID (used as year_id) from the parent view or current semester
    type: Number,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  realname: {
    type: String,
    required: true,
  },
  isAdmin: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["save", "close"]);

// --- Labroom State ---
const labrooms = ref([]);
const isLoadingLabrooms = ref(false);
const labroomError = ref(null);

// --- Form State ---
const formData = reactive(createInitialFormData()); // Initialize reactive form data

// Helper to create initial form data structure based on props.initialData
// Only includes fields that are editable within this form.
function createInitialFormData() {
  const data = props.initialData || {}; // Use empty object if initialData is null/undefined
  return {
    weekday: Math.floor(data.weekday / 10) ?? undefined,
    partday: data.weekday % 10,
    room_id: data.room_id ?? undefined,
    tea_name: data.tea_name ?? props.realname,
    tea_id: data.tea_id ?? props.userId,
    stu_limit: data.stu_limit ?? null,
    lag_week: data.lag_week ?? 0,
    // NOTE: course_id and year_id (from props.semesterId) are NOT part of this
    // reactive formData object because they are contextual and come from props.
    // They are added explicitly during the submitForm process.
  };
}

// Watch for changes in initialData to reset the form
// This is crucial when the modal is reused for editing different items.
watch(
  () => props.initialData,
  () => {
    console.log("Initial data changed, resetting form:", props.initialData);
    // Re-create the form data structure based on the potentially new initialData
    Object.assign(formData, createInitialFormData());
  },
  { deep: true },
); // No immediate: true needed if initialized directly

// --- Fetch Labrooms ---
const fetchLabrooms = async () => {
  isLoadingLabrooms.value = true;
  labroomError.value = null;
  labrooms.value = [];
  try {
    const response = await dataService.getLabrooms();
    labrooms.value = response.data || [];
    if (labrooms.value.length === 0) {
      labroomError.value = t("group.no_lab_rooms");
    }
  } catch (err) {
    console.error("Failed to fetch lab rooms:", err);
    labroomError.value = `${t("group.error_loading_rooms")} ${err.response?.data?.error || err.message}`;
  } finally {
    isLoadingLabrooms.value = false;
  }
};

// --- Computed Validation ---
const formDataIsValid = computed(() => {
  return (
    formData.weekday !== undefined &&
    formData.weekday >= 1 &&
    formData.weekday <= 7 &&
    formData.room_id !== undefined &&
    formData.tea_name.trim() !== "" &&
    formData.tea_id.trim() !== "" &&
    formData.stu_limit !== null &&
    formData.stu_limit >= 0 &&
    formData.lag_week !== null &&
    formData.lag_week >= 0
  );
});

// --- Submit Logic ---
const submitForm = () => {
  if (!formDataIsValid.value) {
    alert(t("group.fill_required_fields"));
    return;
  }

  // Construct the payload according to SubCourseRequest structure.
  // This is where the contextual props `courseId` and `semesterId` are added.
  const payload = {
    // Fields directly edited in the form:
    id: 0, // will be ignored
    weekday: Number(formData.weekday) * 10 + Number(formData.partday),
    room_id: Number(formData.room_id),
    tea_name: formData.tea_name,
    tea_id: formData.tea_id,
    stu_limit: Number(formData.stu_limit),
    lag_week: Number(formData.lag_week),

    // Fields added from component props (context):
    year_id: props.semesterId, // Map semesterId prop to year_id field
    course_id: props.courseId, // Use courseId prop directly
  };

  console.log("Submitting payload:", payload);
  // Emit the complete payload expected by the backend
  emit("save", payload);
};

// --- Lifecycle ---
onMounted(() => {
  fetchLabrooms();
  // The watcher handles the initial setting of formData based on initialData
});
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
