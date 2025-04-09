<template>
  <dialog :id="dialogId" class="modal modal-bottom sm:modal-middle" :open="show">
    <div class="modal-box">
      <h3 class="font-bold text-lg">{{ title }}</h3>
      <p class="py-4">{{ message }}</p>
      <div class="modal-action">
        <form method="dialog" class="w-full flex justify-end gap-2">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn" @click.prevent="$emit('close')">{{ cancelText }}</button>
          <button class="btn" :class="confirmClass" @click.prevent="$emit('confirm')">{{ confirmText }}</button>
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
import { computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  dialogId: {
    type: String,
    required: true,
    default: 'confirm-dialog' // Ensure unique if multiple on page
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmClass: {
    type: String,
    default: 'btn-error' // Default to danger style for confirm
  }
})

defineEmits(['confirm', 'close'])

</script>

<style scoped>
/* Add specific styles for the dialog if needed */
</style>
