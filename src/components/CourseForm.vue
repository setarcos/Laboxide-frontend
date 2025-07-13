<template>
  <form @submit.prevent="submitForm" class="space-y-4 p-2">
    <div>
      <label class="label" for="course-name">
        <span class="label-text">{{ $t("course.name") }}</span>
      </label>
      <input
        id="course-name"
        type="text"
        v-model="formData.name"
        placeholder="e.g., Introduction to Programming"
        class="input input-bordered w-full"
        required
        :disabled="!authStore.isAdmin"
      />
    </div>
    <div>
      <label class="label" for="course-ename">
        <span class="label-text">{{ $t("course.ename") }}</span>
      </label>
      <input
        id="course-ename"
        type="text"
        v-model="formData.ename"
        placeholder="e.g., Intro to Programming"
        class="input input-bordered w-full"
        required
        :disabled="!authStore.isAdmin"
      />
    </div>
    <div>
      <label class="label" for="course-code">
        <span class="label-text">{{ $t("course.id") }},{{ $t("course.credit") }},{{ $t("course.hours") }}</span>
      </label>
      <input
        id="course-code"
        type="text"
        v-model="formData.code"
        placeholder="e.g., 320001,2,4"
        class="input input-bordered w-full"
        required
        :disabled="!authStore.isAdmin"
      />
    </div>
    <div>
      <label class="label" for="course-tea_id">
        <span class="label-text">{{ $t("course.teaid") }}</span>
      </label>
      <input
        id="course-tea_id"
        type="text"
        v-model="formData.tea_id"
        placeholder="Teacher's unique ID"
        class="input input-bordered w-full"
        required
        :disabled="!authStore.isAdmin"
      />
    </div>
    <div>
      <label class="label" for="course-tea_name">
        <span class="label-text">{{ $t("course.teacher") }}</span>
      </label>
      <input
        id="course-tea_name"
        type="text"
        v-model="formData.tea_name"
        placeholder="Teacher's full name"
        class="input input-bordered w-full"
        required
      />
    </div>
    <div>
      <label class="label" for="course-intro">
        <span class="label-text">{{ $t("course.intro") }}</span>
      </label>
      <RichTextEditor id="course-intro" v-model="formData.intro" />
    </div>
    <div>
      <label class="label" for="course-mailbox">
        <span class="label-text">{{ $t("course.mail") }}</span>
      </label>
      <input
        id="course-mailbox"
        type="email"
        v-model="formData.mailbox"
        placeholder="Contact email"
        class="input input-bordered w-full"
        required
      />
    </div>
    <div>
      <label class="label" for="course-term">
        <span class="label-text">{{ $t("course.term") }}</span>
      </label>
      <select
        id="course-term"
        v-model.number="formData.term"
        class="select select-bordered w-full"
        required
        :disabled="!authStore.isAdmin"
      >
        <option value="1">{{ $t("course.spring") }}</option>
        <option value="2">{{ $t("course.fall") }}</option>
        <option value="3">{{ $t("course.summer") }}</option>
      </select>
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        {{ $t("button.cancel") }}
      </button>
      <button type="submit" class="btn btn-primary">{{ $t("course.save") }}</button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import RichTextEditor from "@/components/RichTextEditor.vue";

const authStore = useAuthStore();

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["save", "close"]);

const defaultFormData = {
  id: 0,
  name: "",
  ename: "",
  code: "",
  tea_id: "",
  tea_name: "",
  intro: "",
  mailbox: "",
  term: null, // Initialize as null or a default ID
};

const formData = ref({ ...defaultFormData });

// Watch for changes in initialData to populate the form for editing
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      // Ensure term is a number if it comes from API
      formData.value = { ...newData, term: Number(newData.term) || null };
    } else {
      formData.value = { ...defaultFormData }; // Reset if no initial data
    }
  },
  { immediate: true },
); // Run immediately when component mounts

const submitForm = () => {
  // Basic validation check (more can be added)
  if (
    formData.value.name &&
    formData.value.code &&
    formData.value.tea_id &&
    formData.value.term !== null
  ) {
    // Clean up data before emitting - e.g., ensure term is integer
    const dataToSave = {
      ...formData.value,
      term: parseInt(formData.value.term, 10) || 0, // Ensure integer
    };
    // Remove ID if it exists, backend should handle ID on create/update based on endpoint
    emit("save", dataToSave);
  } else {
    alert("Please fill in all required fields.");
  }
};
</script>
