<template>
  <form @submit.prevent="submitForm">
    <!-- Error Message -->
    <div v-if="errorMessage" class="alert alert-error text-sm p-2 mb-4">
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Title -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{ $t("meeting.form.title") }}</span>
      </label>
      <input
        type="text"
        v-model="form.title"
        :placeholder="$t('meeting.form.placeholder_title')"
        class="input input-bordered"
        required
      />
    </div>

    <!-- Repeat Options -->
    <div class="form-control mt-4">
      <label class="label">
        <span class="label-text">{{ $t("meeting.form.repeat") }}</span>
      </label>
      <select v-model="form.repeat" class="select select-bordered">
        <option :value="0">{{ $t("meeting.form.repeat_once") }}</option>
        <option :value="1">{{ $t("meeting.form.repeat_weekly") }}</option>
      </select>
    </div>

    <!-- Date -->
    <div class="form-control mt-4">
      <label class="label">
        <span class="label-text">
          {{
            form.repeat === 1
              ? $t("meeting.form.repeat_label")
              : $t("meeting.form.date_label")
          }}
        </span>
      </label>
      <input
        type="date"
        v-model="form.date"
        class="input input-bordered"
        required
      />
      <div v-if="form.repeat === 1" class="label-text-alt mt-1">
        {{ $t("meeting.form.repeat_hint", { weekday: weekDayName }) }}
      </div>
    </div>

    <!-- Time Pickers -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">{{ $t("meeting.form.start_time") }}</span>
        </label>
        <input
          type="time"
          v-model="form.startTime"
          class="input input-bordered"
          required
          step="1800"
        />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text">{{ $t("meeting.form.end_time") }}</span>
        </label>
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
        {{ $t("meeting.form.cancel") }}
      </button>
      <button type="submit" class="btn btn-primary">
        {{ isEditing ? $t("meeting.form.update") : $t("meeting.form.create") }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { differenceInMinutes, parseISO } from "date-fns";
import { useI18n } from "vue-i18n";

const { t, d } = useI18n();

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

const weekDayName = computed(() => {
  if (!form.value.date) return "";
  return d(new Date(form.value.date + "T00:00:00"), { weekday: "long" });
});

watch(
  () => [props.initialData, props.bookingSlot],
  () => {
    errorMessage.value = "";
    if (isEditing.value) {
      const data = props.initialData;
      form.value = {
        title: data.title,
        repeat: data.repeat,
        date: data.date,
        startTime: data.start_time.slice(0, 5),
        endTime: data.end_time.slice(0, 5),
      };
    } else if (props.bookingSlot) {
      const startTime = props.bookingSlot.time;
      const [hour] = startTime.split(":");
      const nextHour = (parseInt(hour, 10) + 1).toString().padStart(2, "0");
      form.value = {
        title: "",
        repeat: 1,
        date: props.bookingSlot.date,
        startTime: props.bookingSlot.time,
        endTime: `${nextHour}:00`,
      };
    } else {
      form.value = {
        title: "",
        repeat: 1,
        date: "",
        startTime: "",
        endTime: "",
      };
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => props.submissionError,
  (newError) => {
    errorMessage.value = newError;
  },
);
watch(
  form,
  () => {
    if (errorMessage.value) errorMessage.value = "";
  },
  { deep: true },
);

const submitForm = () => {
  errorMessage.value = "";
  if (!form.value.title.trim()) {
    errorMessage.value = t("meeting.form.error.required_title");
    return;
  }
  if (!form.value.startTime || !form.value.endTime) {
    errorMessage.value = t("meeting.form.error.required_time");
    return;
  }
  if (form.value.endTime <= form.value.startTime) {
    errorMessage.value = t("meeting.form.error.time_order");
    return;
  }

  const start = parseISO(`2000-01-01T${form.value.startTime}`);
  const end = parseISO(`2000-01-01T${form.value.endTime}`);
  const durationInMinutes = differenceInMinutes(end, start);

  if (durationInMinutes > 240) {
    errorMessage.value = t("meeting.form.error.too_long");
    return;
  }

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
