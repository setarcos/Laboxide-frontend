// src/components/ScheduleForm.vue
<template>
  <form @submit.prevent="submitForm">
    <!-- Week -->
    <div class="form-control mb-4">
      <label class="label" for="schedule-week">
        <span class="label-text">{{ $t("course.week") }}</span>
      </label>
      <input
        id="schedule-week"
        type="number"
        min="1"
        placeholder="e.g., 1, 2, 3..."
        class="input input-bordered w-full"
        v-model.number="formData.week"
        required
      />
    </div>

    <!-- Name / Topic -->
    <div class="form-control mb-4">
      <label class="label" for="schedule-name">
        <span class="label-text">{{ $t("course.topic") }}</span>
      </label>
      <input
        id="schedule-name"
        type="text"
        placeholder="e.g., Introduction, Midterm Review, Lab 1 Setup"
        class="input input-bordered w-full"
        v-model.trim="formData.name"
        required
      />
    </div>

    <!-- Requirement -->
    <div class="form-control mb-4">
      <label class="label" for="schedule-requirement">
        <span class="label-text">{{ $t("course.requirement") }}</span>
      </label>
      <textarea
        id="schedule-requirement"
        class="textarea textarea-bordered h-32 w-full"
        placeholder="Describe the activities, required readings, assignments due, etc. for this week."
        v-model="formData.requirement"
      ></textarea>
    </div>

    <!-- Actions -->
    <div class="modal-action mt-6">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        {{ $t("button.cancel") }}
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isSaving || !formDataIsValid"
      >
        <span
          v-if="isSaving"
          class="loading loading-spinner loading-xs mr-2"
        ></span>
        {{ isSaving ? "Saving..." : $t("course.savesche") }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { reactive, watch, computed } from "vue";

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({}),
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  courseId: {
    // Contextual ID
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["save", "close"]);

// Helper to create initial form data structure
function createInitialFormData() {
  const data = props.initialData || {};
  return {
    week: data.week ?? null, // Use null for potentially unset numbers
    name: data.name ?? "",
    requirement: data.requirement ?? "",
    // course_id is added during submission
  };
}

// Reactive form data
const formData = reactive(createInitialFormData());

// Watch for external changes to initialData
watch(
  () => props.initialData,
  () => {
    Object.assign(formData, createInitialFormData());
  },
  { deep: true },
);

// Basic form validation
const formDataIsValid = computed(() => {
  return (
    formData.week !== null && formData.week >= 1 && formData.name.trim() !== ""
  );
  // Requirement is optional based on model? Add check if needed.
});

// Submit handler
const submitForm = () => {
  if (!formDataIsValid.value) {
    alert("Please fill in required fields (Week, Topic).");
    return;
  }

  const payload = {
    ...formData, // Spread editable fields
    course_id: props.courseId, // Add the required course_id
    id: 0,
    // Ensure week is a number (v-model.number helps, but good practice)
    week: Number(formData.week),
  };

  console.log("Submitting schedule payload:", payload);
  emit("save", payload);
};
</script>
