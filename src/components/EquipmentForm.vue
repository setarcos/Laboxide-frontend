<template>
  <form @submit.prevent="submitForm" class="space-y-4">
    <div class="form-control">
      <label class="label">
        <span class="label-text">Equipment Name</span>
      </label>
      <input
        type="text"
        v-model="form.name"
        placeholder="e.g., Oscilloscope Model X"
        class="input input-bordered w-full"
        required
      />
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Serial Number</span>
      </label>
      <input
        type="text"
        v-model="form.serial"
        placeholder="e.g., SN-12345ABC"
        class="input input-bordered w-full"
        required
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Value (Price)</span>
        </label>
        <input
          type="number"
          v-model.number="form.value"
          placeholder="e.g., 1500"
          class="input input-bordered w-full"
          required
        />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text">Position / Location</span>
        </label>
        <input
          type="text"
          v-model="form.position"
          placeholder="e.g., Cabinet A, Shelf 3"
          class="input input-bordered w-full"
          required
        />
      </div>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Status</span>
      </label>
      <select
        v-model.number="form.status"
        class="select select-bordered w-full"
      >
        <option :value="0">Available</option>
        <option :value="1">Borrowed</option>
        <option :value="2">Under Maintenance</option>
        <option :value="3">Decommissioned</option>
      </select>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">Note</span>
      </label>
      <textarea
        v-model="form.note"
        class="textarea textarea-bordered h-24"
        placeholder="Any additional notes or details"
      ></textarea>
    </div>

    <div class="modal-action">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        Cancel
      </button>
      <button type="submit" class="btn btn-primary">Save</button>
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

const form = ref({});

const defaultFormState = () => ({
  id: 0,
  name: "",
  serial: "",
  value: 0,
  position: "",
  status: 0,
  note: "",
});

watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      form.value = { ...newData, status: Number(newData.status || 0) };
    } else {
      form.value = defaultFormState();
    }
  },
  { immediate: true, deep: true },
);

const submitForm = () => {
  emit("save", { ...form.value });
};
</script>
