// src/components/StudentLogForm.vue
<template>
  <form @submit.prevent="handleSubmit">
    <div class="space-y-4">
      <!-- Display Student Info (Read-only, name from store) -->
      <div class="text-sm">
         <strong>Student:</strong> {{ authStore.user?.realname || formData.stu_name || 'N/A' }} ({{ formData.stu_id || 'N/A' }})
      </div>

      <div class="divider text-xs">Editable Log Details</div>

      <!-- Editable Fields -->
      <div class="form-control">
        <label for="lab_name" class="label">
          <span class="label-text">Lab / Experiment Name</span>
        </label>
        <input
          id="lab_name"
          type="text"
          v-model.trim="formData.lab_name"
          placeholder="Enter the lab or experiment name"
          class="input input-bordered w-full"
        />
      </div>

      <div class="form-control">
        <label for="seat" class="label">
          <span class="label-text">Seat Number</span>
        </label>
        <input
          id="seat"
          type="number"
          v-model.number="formData.seat"
          placeholder="Enter your seat number (if applicable)"
          class="input input-bordered w-full"
          min="0"
        />
      </div>

      <div class="form-control">
        <label for="note" class="label">
          <span class="label-text">Student Note <span class="text-error">*</span></span>
        </label>
        <textarea
          id="note"
          v-model.trim="formData.note"
          placeholder="Describe your work, issues encountered, etc."
          class="textarea textarea-bordered h-32 w-full"
          required
        ></textarea>
         <label class="label">
            <span class="label-text-alt text-gray-500">Describe work or enter "None". Field is required.</span>
         </label>
      </div>

      <!-- Mandatory Confirmation Checkboxes -->
      <div class="divider text-xs">Post-Lab Checks</div>
      <div class="space-y-2 mt-2">
         <div class="form-control">
            <label for="check-clean" class="label cursor-pointer justify-start gap-3">
               <input
                  type="checkbox"
                  id="check-clean"
                  v-model="isTableCleaned"
                  class="checkbox checkbox-primary checkbox-sm"
               />
               <span class="label-text">Clean the table <span class="text-error">*</span></span>
            </label>
         </div>
         <div class="form-control">
            <label for="check-off" class="label cursor-pointer justify-start gap-3">
               <input
                  type="checkbox"
                  id="check-off"
                  v-model="isEquipmentOff"
                  class="checkbox checkbox-primary checkbox-sm"
               />
               <span class="label-text">Turn off all equipment <span class="text-error">*</span></span>
            </label>
         </div>
      </div>
      <!-- End Confirmation Checkboxes -->

    </div>

    <!-- Actions -->
    <div class="modal-action mt-6">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isSubmitDisabled"
        :class="{ loading: isSaving }"
      >
        {{ isSaving ? 'Saving...' : (formData.id ? 'Update Log' : 'Save Log') }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'; // Add computed
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  initialData: {
    type: Object,
    required: true,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['save', 'close']);
const authStore = useAuthStore();

// --- State for Checkboxes (not part of formData) ---
const isTableCleaned = ref(false);
const isEquipmentOff = ref(false);
// ----------------------------------------------------

// Default structure matching the backend model, excluding fields we don't display/use
const defaultLogStructure = {
    id: null,
    stu_id: '',
    stu_name: '',
    subcourse_id: null,
    room_id: null,
    seat: null,
    lab_name: '',
    note: '',
};

const formData = ref({ ...defaultLogStructure });

// Watch for changes in initialData prop to update the form
watch(() => props.initialData, (newData) => {
    // Merge newData into the default structure
    const mergedData = { ...defaultLogStructure, ...newData };

    // Override stu_name and ensure stu_id
    mergedData.stu_name = authStore.user?.realname || mergedData.stu_name || '';
    mergedData.stu_id = mergedData.stu_id || authStore.user?.userId || '';

    // Set default note to "None" if it's empty
    if (!mergedData.note || mergedData.note.trim() === '') {
        mergedData.note = 'None';
    }

    // Handle seat conversion
    if (mergedData.seat === 0) {
        mergedData.seat = null;
    }

    formData.value = mergedData;

    // *** Reset confirmation checkboxes when data changes ***
    isTableCleaned.value = false;
    isEquipmentOff.value = false;


} , { immediate: true, deep: true });

// --- Computed property to control submit button disabled state ---
const isSubmitDisabled = computed(() => {
    return props.isSaving ||            // Disabled if saving
           !formData.value.note ||      // Disabled if note is empty
           !isTableCleaned.value ||     // Disabled if table not cleaned
           !isEquipmentOff.value;       // Disabled if equipment not off
});
// ------------------------------------------------------------------

// Handle form submission
const handleSubmit = () => {
  // Validation is now handled by the isSubmitDisabled computed property

  // We don't need extra checks here for the checkboxes, as the button won't be clickable
  // unless they are checked and the note is filled.

  if (!props.isSaving) { // Only proceed if not already saving
    // Prepare data to emit (does NOT include isTableCleaned or isEquipmentOff)
    const dataToSave = {
        ...formData.value,
        seat: formData.value.seat === null ? 0 : formData.value.seat,
        stu_id: formData.value.stu_id || authStore.user?.userId || '',
        stu_name: authStore.user?.realname || formData.value.stu_name || '',
        // Carry over original confirm/tea_note if needed by backend
        confirm: props.initialData?.confirm || 0,
        tea_note: props.initialData?.tea_note || '',
    };


    if (!dataToSave.stu_id) {
        console.error("Cannot save log: Missing student ID.");
        alert("Error: Could not determine student ID.");
        return;
    }

    emit('save', dataToSave);
  }
};
</script>

<style scoped>
/* Add any specific styles if needed */
</style>
