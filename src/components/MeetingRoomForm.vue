<template>
  <form @submit.prevent="submitForm">
    <div class="form-control">
      <label class="label"
        ><span class="label-text">Room Name/Code</span></label
      >
      <input
        type="text"
        v-model="form.room"
        placeholder="e.g., Conference Room A"
        class="input input-bordered"
        required
      />
    </div>
    <div class="form-control mt-4">
      <label class="label"
        ><span class="label-text">Information / Description</span></label
      >
      <textarea
        v-model="form.info"
        class="textarea textarea-bordered"
        placeholder="e.g., Seats 10, has projector"
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
    default: () => ({ room: "", info: "" }),
  },
});
const emit = defineEmits(["save", "close"]);

const form = ref({ room: "", info: "" });

watch(
  () => props.initialData,
  (newData) => {
    form.value = { ...{ room: "", info: "" }, ...newData };
  },
  { immediate: true },
);

const submitForm = () => {
  emit("save", { ...form.value });
};
</script>
