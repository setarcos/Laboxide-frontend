<template>
  <form @submit.prevent="submitForm" class="space-y-4 p-2">
    <div>
      <label class="label" for="semester-name">
        <span class="label-text">{{ $t("term.semesterName") }}</span>
      </label>
      <input
        id="semester-name"
        type="text"
        v-model="formData.name"
        :placeholder="$t('term.namePlaceholder')"
        class="input input-bordered w-full"
        required
      />
    </div>
    <div>
      <label class="label" for="semester-start">
        <span class="label-text">{{ $t("term.startDate") }}</span>
      </label>
      <input
        id="semester-start"
        type="date"
        v-model="formData.start"
        class="input input-bordered w-full"
        required
      />
    </div>
    <div>
      <label class="label" for="semester-end">
        <span class="label-text">{{ $t("term.endDate") }}</span>
      </label>
      <input
        id="semester-end"
        type="date"
        v-model="formData.end"
        class="input input-bordered w-full"
        required
      />
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        {{ $t("button.cancel") }}
      </button>
      <button type="submit" class="btn btn-primary">
        {{ $t("term.saveSemester") }}
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
});

const emit = defineEmits(["save", "close"]);

// Helper to format date YYYY-MM-DD for input[type=date]
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  try {
    // Assuming NaiveDate format from backend is compatible with Date constructor or YYYY-MM-DD
    const date = new Date(dateString);
    // Adjust for timezone offset if necessary to prevent off-by-one day issues
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().split("T")[0];
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return ""; // Return empty or original string if formatting fails
  }
};

const defaultFormData = {
  id: 0,
  name: "",
  start: "", // Use YYYY-MM-DD format
  end: "", // Use YYYY-MM-DD format
};

const formData = ref({ ...defaultFormData });

// Watch for changes in initialData
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      formData.value = {
        ...newData,
        start: formatDateForInput(newData.start),
        end: formatDateForInput(newData.end),
      };
    } else {
      formData.value = { ...defaultFormData };
    }
  },
  { immediate: true },
);

const submitForm = () => {
  if (formData.value.name && formData.value.start && formData.value.end) {
    // Ensure dates are in the correct format if backend expects specific string
    // The 'date' input type should provide YYYY-MM-DD
    const saveData = formData.value;
    emit("save", saveData);
  } else {
    alert("Please fill in all fields.");
  }
};
</script>
