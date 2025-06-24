<template>
  <form @submit.prevent="submitForm">
    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error text-sm p-2 mb-4">
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Title -->
    <div class="form-control">
      <label class="label"><span class="label-text">Meeting Title</span></label>
      <input
        type="text"
        v-model="form.title"
        placeholder="e.g., Weekly Team Sync"
        class="input input-bordered"
        required
      />
    </div>

    <!-- Repeat Options -->
    <div class="form-control mt-4">
      <label class="label"><span class="label-text">Repeat</span></label>
      <select v-model="form.repeat" class="select select-bordered">
        <option :value="0">One-time Event</option>
        <option :value="1">Weekly</option>
      </select>
    </div>

    <!-- Date -->
    <div class="form-control mt-4">
      <label class="label"
        ><span class="label-text">{{ dateLabel }}</span></label
      >
      <input
        type="date"
        v-model="form.date"
        class="input input-bordered"
        required
      />
      <div v-if="form.repeat === 1" class="label-text-alt mt-1">
        The booking will repeat every {{ weekDayName }} until this date.
      </div>
    </div>

    <!-- Time Pickers -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
      <div class="form-control">
        <label class="label"><span class="label-text">Start Time</span></label>
        <input
          type="time"
          v-model="form.startTime"
          class="input input-bordered"
          required
          step="1800"
        />
        <!-- 30 min steps -->
      </div>
      <div class="form-control">
        <label class="label"><span class="label-text">End Time</span></label>
        <input
          type="time"
          v-model="form.endTime"
          class="input input-bordered"
          required
          step="1800"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="modal-action">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        Cancel
      </button>
      <button type="submit" class="btn btn-primary">
        {{ isEditing ? "Update Booking" : "Create Booking" }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { differenceInMinutes, parseISO } from "date-fns";

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
  bookingSlot: {
    type: Object,
    default: null,
  },
  submissionError: { type: String, default: "" },
});
const emit = defineEmits(["save", "close"]);

const form = ref({
  title: "",
  repeat: 0,
  date: "",
  startTime: "",
  endTime: "",
});
const errorMessage = ref("");

const isEditing = computed(() => !!props.initialData?.id);
const dateLabel = computed(() =>
  form.value.repeat === 1 ? "Repeat End Date" : "Booking Date",
);

const weekDayName = computed(() => {
  if (!form.value.date) return "";
  const dateObj = new Date(form.value.date + "T00:00:00");
  return dateObj.toLocaleDateString(undefined, { weekday: "long" });
});

// --- WATCHER 1: To populate the form when the modal opens ---
watch(
  () => [props.initialData, props.bookingSlot],
  () => {
    errorMessage.value = ""; // Clear any previous errors when data changes
    if (isEditing.value) {
      // This logic will now execute correctly
      const data = props.initialData;
      form.value = {
        title: data.title,
        repeat: data.repeat,
        date: data.date,
        startTime: data.start_time.slice(0, 5),
        endTime: data.end_time.slice(0, 5),
      };
    } else if (props.bookingSlot) {
      // This logic will also execute correctly
      form.value = {
        title: "",
        repeat: 0,
        date: props.bookingSlot.date,
        startTime: props.bookingSlot.time,
        endTime: "",
      };
    } else {
      form.value = {
        title: "",
        repeat: 0,
        date: "",
        startTime: "",
        endTime: "",
      };
    }
  },
  { immediate: true, deep: true },
);

// --- WATCHER 2: To handle incoming submission errors from the parent ---
watch(
  () => props.submissionError,
  (newError) => {
    errorMessage.value = newError;
  },
);
watch(
  form,
  () => {
    // As the user types, clear the error message. The parent will re-set it on the next failed submit.
    if (errorMessage.value) {
      errorMessage.value = "";
    }
  },
  { deep: true },
);

const submitForm = () => {
  errorMessage.value = "";
  // --- Validation ---
  if (!form.value.title.trim()) {
    errorMessage.value = "Meeting title is required.";
    return;
  }
  if (!form.value.startTime || !form.value.endTime) {
    errorMessage.value = "Start and End times are required.";
    return;
  }
  if (form.value.endTime <= form.value.startTime) {
    errorMessage.value = "End time must be after start time.";
    return;
  }

  const start = parseISO(`2000-01-01T${form.value.startTime}`);
  const end = parseISO(`2000-01-01T${form.value.endTime}`);
  const durationInMinutes = differenceInMinutes(end, start);

  if (durationInMinutes > 240) {
    errorMessage.value = "Meeting duration cannot exceed 4 hours.";
    return;
  }
  errorMessage.value = "";

  // --- Prepare Payload ---
  const payload = {
    title: form.value.title.trim(),
    repeat: Number(form.value.repeat),
    date: form.value.date,
    start_time: `${form.value.startTime}:00`,
    end_time: `${form.value.endTime}:00`,
  };
  emit("save", payload);
};
</script>
