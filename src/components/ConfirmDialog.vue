<template>
  <dialog
    ref="dialog"
    :id="dialogId"
    class="modal modal-bottom sm:modal-middle"
  >
    <div class="modal-box">
      <h3 class="font-bold text-lg">{{ title }}</h3>
      <p class="py-4">{{ message }}</p>
      <div class="modal-action">
        <form method="dialog" class="w-full flex justify-end gap-2">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn" @click.prevent="$emit('close')">
            {{ cancelText }}
          </button>
          <button
            class="btn"
            :class="confirmClass"
            @click.prevent="$emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </form>
      </div>
    </div>
    <!-- Optional: Click outside to close -->
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('close')">close</button>
    </form>
  </dialog>
</template>

<script setup>
import { ref, watch } from "vue";

// Define props as before, but it's better practice to type them
const props = defineProps({
  show: Boolean,
  dialogId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: "Confirm Action",
  },
  message: {
    type: String,
    default: "Are you sure?",
  },
  confirmText: {
    type: String,
    default: "Confirm",
  },
  cancelText: {
    type: String,
    default: "Cancel",
  },
  confirmClass: {
    type: String,
    default: "btn-primary",
  },
});

defineEmits(["confirm", "close"]);

// 4. Create a ref to hold the dialog element
const dialog = ref(null);

// 5. Watch the `show` prop for changes
watch(
  () => props.show,
  (newValue) => {
    // Ensure the dialog element exists before trying to use it
    if (dialog.value) {
      if (newValue) {
        // If `show` is true, call the imperative `showModal()` method
        dialog.value.showModal();
      } else {
        // If `show` is false, call `close()`
        dialog.value.close();
      }
    }
  },
);
</script>

<style scoped>
/* Add specific styles for the dialog if needed */
</style>
