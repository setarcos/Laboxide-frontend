<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">My Equipment</h1>

    <div class="mb-4 text-right">
      <button class="btn btn-primary" @click="openAddModal">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Add Equipment
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
    <div v-else-if="error" class="alert alert-error shadow-lg">
      <span>Error loading equipment: {{ error.message || error }}</span>
    </div>

    <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Name</th>
            <th>Serial No.</th>
            <th>Location</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="equipments.length === 0">
            <td colspan="5" class="text-center italic py-4">You have not added any equipment.</td>
          </tr>
          <tr v-for="item in equipments" :key="item.id">
            <td class="font-bold">{{ item.name }}</td>
            <td>{{ item.serial }}</td>
            <td>{{ item.position }}</td>
            <td>
              <span class="badge" :class="getStatusBadgeClass(item.status)">
                {{ getStatusText(item.status) }}
              </span>
            </td>
            <td>
              <div class="flex gap-1 items-center">
                <button v-if="item.status === 0" class="btn btn-xs btn-outline btn-success" @click="openLendModal(item)">Lend</button>
                <button v-if="item.status === 1" class="btn btn-xs btn-outline btn-info" @click="handleReturn(item)">Return</button>
                
                <button class="btn btn-xs btn-ghost btn-circle" title="History" @click="openHistoryModal(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <button class="btn btn-xs btn-ghost btn-circle" title="Edit" @click="openEditModal(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button class="btn btn-xs btn-ghost btn-circle text-error" title="Delete" @click="openDeleteModal(item)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog id="equipment_modal" class="modal" :open="showAddModal || showEditModal">
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg">{{ isEditing ? 'Edit Equipment' : 'Add New Equipment' }}</h3>
        <EquipmentForm 
          v-if="showAddModal || showEditModal"
          :initial-data="currentItem" 
          @save="handleSave" 
          @close="closeModal" 
          class="py-4"
        />
        <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" @click="closeModal">✕</button>
      </div>
       <form method="dialog" class="modal-backdrop"><button @click="closeModal">close</button></form>
    </dialog>

    <ConfirmDialog
      :show="showDeleteModal"
      dialogId="equipment_delete_confirm_modal"
      title="Delete Equipment"
      :message="`Are you sure you want to delete '${currentItem?.name}'?`"
      @confirm="handleDelete"
      @close="closeModal"
    />

    <EquipmentHistoryModal
      :show="showHistoryModal"
      :equipment="currentItem"
      @close="closeModal"
    />

    <LendModal
      :show="showLendModal"
      :equipmentName="currentItem?.name"
      @save="handleLend"
      @close="closeModal"
    />

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import * as dataService from '@/services/dataService'; 
import EquipmentForm from '@/components/EquipmentForm.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import EquipmentHistoryModal from '@/components/EquipmentHistoryModal.vue';
import LendModal from '@/components/LendModal.vue';

const authStore = useAuthStore();

const statusMap = {
  0: 'Available',
  1: 'Borrowed',
  2: 'Under Maintenance',
  3: 'Decommissioned'
};

const equipments = ref([]);
const isLoading = ref(true);
const error = ref(null);

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const showHistoryModal = ref(false);
const showLendModal = ref(false);
const currentItem = ref(null);

const isEditing = computed(() => !!currentItem.value && showEditModal.value);

const getStatusText = (statusCode) => statusMap[statusCode] || 'Unknown';

const getStatusBadgeClass = (statusCode) => ({
  'badge-success': statusCode === 0,
  'badge-warning': statusCode === 1,
  'badge-info': statusCode === 2,
  'badge-ghost': statusCode === 3
});

const fetchEquipments = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await dataService.listEquipments();
    equipments.value = response.data;
  } catch (err) {
    console.error("Failed to fetch equipment:", err);
    error.value = err.response?.data || err;
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchEquipments);

const openAddModal = () => {
  currentItem.value = { id: 0, name: '', serial: '', value: 0, position: '', status: 0, note: '' };
  showAddModal.value = true;
};

const openEditModal = (item) => {
  currentItem.value = { ...item };
  showEditModal.value = true;
};

const openDeleteModal = (item) => {
  currentItem.value = item;
  showDeleteModal.value = true;
};

const openHistoryModal = (item) => {
  currentItem.value = item;
  showHistoryModal.value = true;
};

const openLendModal = (item) => {
  currentItem.value = item;
  showLendModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  showHistoryModal.value = false;
  showLendModal.value = false;
  currentItem.value = null;
};

const handleSave = async (formData) => {
  if (!authStore.user || !authStore.user.userId) {
    error.value = "Authentication error. Cannot save equipment.";
    console.error("User ID not found in auth store.");
    return;
  }

  const payload = {
    ...formData,
    owner_id: authStore.user.userId
  };

  try {
    if (isEditing.value) {
      await dataService.updateEquipment(currentItem.value.id, payload);
    } else {
      await dataService.createEquipment(payload);
    }
    closeModal();
    await fetchEquipments();
  } catch (err) {
    console.error("Failed to save equipment:", err);
    error.value = `Failed to save: ${err.response?.data?.error || err.message}`;
  }
};

const handleDelete = async () => {
  if (!currentItem.value) return;
  try {
    await dataService.deleteEquipment(currentItem.value.id);
    closeModal();
    await fetchEquipments();
  } catch (err)
 {
    console.error("Failed to delete equipment:", err);
    error.value = `Failed to delete: ${err.response?.data?.error || err.message}`;
    closeModal();
  }
};

const handleLend = async ({ user, telephone, note }) => {
  if (!currentItem.value) return;
  try {
    await dataService.createEquipmentHistory({
      id: 0,
      item_id: currentItem.value.id,
      user: user,
      telephone: telephone,
      note: note,
    });

    const updatedEquipment = { ...currentItem.value, status: 1 }; // 1 = Borrowed
    await dataService.updateEquipment(currentItem.value.id, updatedEquipment);

    closeModal();
    await fetchEquipments();
  } catch (err) {
    console.error("Failed to lend equipment:", err);
    error.value = `Lending failed: ${err.response?.data?.error || err.message}`;
    closeModal();
  }
};

const handleReturn = async (item) => {
    try {
        await dataService.updateEquipmentHistory(item.id);
        await dataService.updateEquipment(item.id, { ...item, status: 0 }); // 0 = Available
        await fetchEquipments();

    } catch (err) {
        console.error("Failed to return equipment:", err);
        error.value = `Return failed: ${err.response?.data?.error || err.message}`;
    }
};
</script>

<style scoped>
.modal {
  display: grid;
  place-items: center;
}
</style>
