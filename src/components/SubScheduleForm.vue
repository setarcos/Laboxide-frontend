// src/components/SubScheduleForm.vue
<template>
  <form @submit.prevent="submitForm">
    <div class="form-control mb-4">
      <label class="label" for="sub-step">
        <span class="label-text">Step Number</span>
      </label>
      <input
        id="sub-step"
        type="number"
        placeholder="e.g., 1"
        class="input input-bordered w-full"
        v-model.number="formData.step"
        required
        min="1"
      />
      <!-- Add validation error display if needed -->
    </div>

    <div class="form-control mb-4">
      <label class="label" for="sub-title">
        <span class="label-text">Step Title / Description</span>
      </label>
      <input
        id="sub-title"
        type="text"
        placeholder="e.g., Introduction"
        class="input input-bordered w-full"
        v-model.trim="formData.title"
        required
      />
      <!-- Add validation error display if needed -->
    </div>

    <!-- Hidden field for schedule_id -->
    <input type="hidden" v-model="formData.schedule_id" />

    <div class="modal-action mt-6">
      <button
        type="button"
        class="btn btn-ghost"
        @click="$emit('close')"
        :disabled="isSaving"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :class="{ loading: isSaving }"
        :disabled="isSaving"
      >
        {{ isSaving ? "Saving..." : "Save Step" }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  scheduleId: {
    // The parent schedule ID
    type: Number,
    required: true,
  },
});

const emit = defineEmits(["save", "close"]);

const defaultFormData = () => ({
  id: 0,
  schedule_id: props.scheduleId, // Link to parent schedule
  step: null,
  title: "",
});

const formData = ref(defaultFormData());

watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      // Editing: Populate form with existing data
      formData.value = {
        id: newData.id,
        schedule_id: newData.schedule_id || props.scheduleId, // Ensure schedule_id is present
        step: newData.step,
        title: newData.title,
      };
    } else {
      // Adding: Reset form but keep parent scheduleId
      formData.value = defaultFormData();
    }
  },
  { immediate: true, deep: true },
);

const submitForm = () => {
  // Basic validation example (add more as needed)
  if (
    !formData.value.step ||
    formData.value.step < 1 ||
    !formData.value.title
  ) {
    alert("Please fill in all fields correctly.");
    return;
  }
  emit("save", { ...formData.value });
};
</script>
