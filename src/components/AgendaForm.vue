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

const props = defineProps({
  initialData: {
    // For editing an existing agenda
    type: Object,
    default: null,
  },
  bookingSlot: {
    // For creating a new agenda from the calendar
    type: Object,
    default: null,
  },
});
const emit = defineEmits(["save", "close"]);

const form = ref({
  title: "",
  repeat: 0, // 0 for one-time, 1 for weekly
  date: "", // YYYY-MM-DD
  startTime: "", // HH:mm
  endTime: "", // HH:mm
});
const errorMessage = ref("");

const isEditing = computed(() => !!props.initialData?.id);
const dateLabel = computed(() =>
  form.value.repeat === 1 ? "Repeat End Date" : "Booking Date",
);

const weekDayName = computed(() => {
  if (!form.value.date) return "";
  // Adding T00:00:00 ensures the date isn't affected by timezones
  const dateObj = new Date(form.value.date + "T00:00:00");
  return dateObj.toLocaleDateString(undefined, { weekday: "long" });
});

// Watch for prop changes to populate the form
watch(
  () => [props.initialData, props.bookingSlot],
  () => {
    errorMessage.value = ""; // Clear errors on change
    if (isEditing.value) {
      // Editing an existing agenda
      const data = props.initialData;
      form.value = {
        title: data.title,
        repeat: data.repeat,
        date: data.date, // Assumes YYYY-MM-DD format from backend
        startTime: data.start_time.slice(0, 5), // 'HH:mm:ss' -> 'HH:mm'
        endTime: data.end_time.slice(0, 5),
      };
    } else if (props.bookingSlot) {
      // Creating a new agenda by clicking a slot
      form.value = {
        title: "",
        repeat: 0,
        date: props.bookingSlot.date,
        startTime: props.bookingSlot.time,
        endTime: "",
      };
    } else {
      // Default empty state (should not happen in normal flow)
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

const submitForm = () => {
  // --- Validation ---
  if (!form.value.title.trim()) {
    errorMessage.value = "Meeting title is required.";
    return;
  }
  if (form.value.endTime <= form.value.startTime) {
    errorMessage.value = "End time must be after start time.";
    return;
  }

  errorMessage.value = "";

  // --- Prepare Payload ---
  const payload = {
    title: form.value.title.trim(),
    repeat: Number(form.value.repeat),
    date: form.value.date,
    start_time: `${form.value.startTime}:00`, // Add seconds for NaiveTime
    end_time: `${form.value.endTime}:00`,
  };

  // Calculate `week` field if it's a repeating event
  if (payload.repeat === 1) {
    // Rust backend expects Mon=1..Sun=7. JS getDay() is Sun=0..Sat=6.
    const dayOfWeek = new Date(form.value.date + "T00:00:00").getDay();
    payload.week = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert Sunday from 0 to 7
  }

  emit("save", payload);
};
</script>
