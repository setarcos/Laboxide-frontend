<template>
  <form @submit.prevent="submitForm" class="space-y-4 p-2">
    <div>
      <label class="label" for="lab-room">
        <span class="label-text">{{ $t("lab.roomNumber") }}</span>
      </label>
      <input
        id="lab-room"
        type="text"
        v-model="formData.room"
        :placeholder="$t('lab.roomPlaceholder')"
        class="input input-bordered w-full"
        required
      />
    </div>
    <div>
      <label class="label" for="lab-name">
        <span class="label-text">{{ $t("lab.labName") }}</span>
      </label>
      <input
        id="lab-name"
        type="text"
        v-model="formData.name"
        :placeholder="$t('lab.namePlaceholder')"
        class="input input-bordered w-full"
        required
      />
    </div>
    <div>
      <label class="label" for="lab-manager">
        <span class="label-text">{{ $t("lab.managerName") }}</span>
      </label>
      <input
        id="lab-manager"
        type="text"
        v-model="formData.manager"
        :placeholder="$t('lab.managerNamePlaceholder')"
        class="input input-bordered w-full"
        required
      />
    </div>
    <div>
      <label class="label" for="lab-tea-id">
        <span class="label-text">{{ $t("lab.managerId") }}</span>
      </label>
      <input
        id="lab-tea-id"
        type="text"
        v-model="formData.tea_id"
        :placeholder="$t('lab.managerIdPlaceholder')"
        class="input input-bordered w-full"
        required
      />
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        {{ $t("button.cancel") }}
      </button>
      <button type="submit" class="btn btn-primary">
        {{ $t("lab.saveLabroom") }}
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

const defaultFormData = {
  id: 0,
  room: "",
  name: "",
  manager: "",
  tea_id: "",
};

const formData = ref({ ...defaultFormData });

// Watch for changes in initialData to populate the form for editing
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      formData.value = { ...newData };
    } else {
      formData.value = { ...defaultFormData };
    }
  },
  { immediate: true },
);

const submitForm = () => {
  if (
    formData.value.room &&
    formData.value.name &&
    formData.value.manager &&
    formData.value.tea_id
  ) {
    const saveData = formData.value;
    emit("save", saveData);
  } else {
    alert("Please fill in all fields.");
  }
};
</script>
