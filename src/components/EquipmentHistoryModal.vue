<template>
  <dialog id="history_modal" class="modal" :open="show">
    <div class="modal-box w-11/12 max-w-4xl">
      <h3 class="font-bold text-lg">Borrow History for: {{ equipment?.name }}</h3>
      
      <div class="py-4">
        <div v-if="isLoading" class="text-center py-6">
          <span class="loading loading-spinner text-primary"></span>
        </div>
        <div v-else-if="error" class="alert alert-warning">
          <span>Could not load history: {{ error.message }}</span>
        </div>
        <div v-else-if="histories.length === 0" class="text-center italic">
          No history records found for this item.
        </div>
        <div v-else class="overflow-x-auto max-h-96">
          <table class="table table-zebra table-pin-rows table-sm">
            <thead>
              <tr>
                <th>User</th>
                <th>Telephone</th>
                <th>Borrowed Date</th>
                <th>Returned Date</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="history in histories" :key="history.id">
                <td class="font-semibold">{{ history.user }}</td>
                <td>{{ history.telephone }}</td>
                <td>{{ formatDateTime(history.borrowed_date) }}</td>
                <td>{{ history.returned_date ? formatDateTime(history.returned_date) : '—' }}</td>
                <td class="text-xs whitespace-normal">{{ history.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn" @click="$emit('close')">Close</button>
      </div>
       <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="$emit('close')">✕</button>
    </div>
    <form method="dialog" class="modal-backdrop"><button @click="$emit('close')">close</button></form>
  </dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import * as dataService from '@/services/dataService';

const props = defineProps({
  show: Boolean,
  equipment: Object
});

defineEmits(['close']);

const histories = ref([]);
const isLoading = ref(false);
const error = ref(null);

const fetchHistory = async (itemId) => {
  isLoading.value = true;
  error.value = null;
  histories.value = [];
  try {
    const response = await dataService.listHistoriesByItem(itemId);
    histories.value = response.data.sort((a, b) => new Date(b.borrowed_date) - new Date(a.borrowed_date));
  } catch (err) {
    console.error('Failed to fetch history:', err);
    error.value = err.response?.data || err;
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.show, (newVal) => {
  if (newVal && props.equipment) {
    fetchHistory(props.equipment.id);
  }
});

const formatDateTime = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString();
};
</script>
