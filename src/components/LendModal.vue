<template>
  <dialog id="lend_modal" class="modal" :open="show">
    <div class="modal-box w-11/12 max-w-md">
      <h3 class="font-bold text-lg">Lend Equipment: {{ equipmentName }}</h3>

      <form @submit.prevent="submit" class="py-4 space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Borrower's Name (User)</span>
          </label>
          <input
            type="text"
            v-model="user"
            placeholder="e.g., John Doe"
            class="input input-bordered w-full"
            required
            ref="userInput"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Borrower's Telephone</span>
          </label>
          <input
            type="tel"
            v-model="telephone"
            placeholder="e.g., 123-456-7890"
            class="input input-bordered w-full"
            required
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Note for this loan</span>
          </label>
          <textarea
            v-model="note"
            class="textarea textarea-bordered h-20"
            placeholder="e.g., For project X, due next Friday"
            required
          ></textarea>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="close">
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">Confirm Lend</button>
        </div>
      </form>

      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="close"
      >
        ✕
      </button>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="close">close</button>
    </form>
  </dialog>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";

const props = defineProps({
  show: Boolean,
  equipmentName: String,
});

const emit = defineEmits(["save", "close"]);

const user = ref("");
const telephone = ref("");
const note = ref("");
const userInput = ref(null);

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      user.value = "";
      telephone.value = "";
      note.value = "";
      nextTick(() => {
        userInput.value?.focus();
      });
    }
  },
);

const submit = () => {
  if (user.value.trim() && telephone.value.trim() && note.value.trim()) {
    emit("save", {
      user: user.value.trim(),
      telephone: telephone.value.trim(),
      note: note.value.trim(),
    });
  }
};

const close = () => {
  emit("close");
};
</script>
