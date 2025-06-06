<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Manage Lab Rooms</h1>

    <!-- Add Button (Admin or Lab Manager) -->
    <div
      class="mb-4 text-right"
      v-if="authStore.hasPermission(PERMISSION_ADMIN | PERMISSION_LAB_MANAGER)"
    >
      <button class="btn btn-primary" @click="openAddModal">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Lab Room
      </button>
    </div>

    <!-- Loading and Error States -->
    <div v-if="isLoading" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
    <div v-else-if="error" class="alert alert-error shadow-lg">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current flex-shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>Error loading lab rooms: {{ error.message || error }}</span>
      </div>
    </div>

    <!-- Labrooms Table -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Room Code</th>
            <th>Name</th>
            <th>Manager</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="labrooms.length === 0">
            <td colspan="5" class="text-center italic py-4">
              No lab rooms found.
            </td>
          </tr>
          <tr v-for="labroom in labrooms" :key="labroom.id">
            <td>{{ labroom.room }}</td>
            <td>
              <router-link
                :to="{ name: 'StudentLogs', params: { roomId: labroom.id } }"
                class="link link-hover link-primary"
              >
                {{ labroom.name }}
              </router-link>
            </td>
            <td>{{ labroom.manager }}</td>
            <td>
              <div class="flex gap-1">
                <!-- Edit/Delete only for Admin/Lab Manager (API is admin only) -->
                <template
                  v-if="
                    authStore.hasPermission(
                      PERMISSION_ADMIN | PERMISSION_LAB_MANAGER,
                    )
                  "
                >
                  <button
                    class="btn btn-xs btn-ghost btn-circle"
                    title="Edit"
                    @click="openEditModal(labroom)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    class="btn btn-xs btn-ghost btn-circle text-error"
                    title="Delete"
                    @click="openDeleteModal(labroom)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </template>
                <span v-else class="text-xs italic text-base-content/50"
                  >No actions</span
                >
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <dialog
      id="labroom_modal"
      class="modal"
      :open="showAddModal || showEditModal"
    >
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg">
          {{ isEditing ? "Edit Lab Room" : "Add New Lab Room" }}
        </h3>
        <LabroomForm
          :initial-data="currentItem"
          @save="handleSave"
          @close="closeModal"
          class="py-4"
        />
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="closeModal"
        >
          ✕
        </button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
      </form>
    </dialog>

    <!-- Confirm Delete Modal -->
    <ConfirmDialog
      :show="showDeleteModal"
      dialogId="labroom_delete_confirm_modal"
      title="Delete Lab Room"
      :message="`Are you sure you want to delete the lab room '${currentItem?.name}' (Room: ${currentItem?.room})?`"
      @confirm="handleDelete"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import * as dataService from "@/services/dataService";
import LabroomForm from "@/components/LabroomForm.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { PERMISSION_ADMIN, PERMISSION_LAB_MANAGER } from "@/utils/permissions";

const authStore = useAuthStore();

const labrooms = ref([]);
const isLoading = ref(true);
const error = ref(null);

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const currentItem = ref(null);

const isEditing = computed(() => !!currentItem.value && showEditModal.value);

const fetchLabrooms = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await dataService.getLabrooms();
    labrooms.value = response.data;
  } catch (err) {
    console.error("Failed to fetch lab rooms:", err);
    error.value = err.response?.data || err;
  } finally {
    isLoading.value = false;
  }
};

const openAddModal = () => {
  currentItem.value = null;
  showAddModal.value = true;
};

const openEditModal = (labroom) => {
  currentItem.value = { ...labroom };
  showEditModal.value = true;
};

const openDeleteModal = (labroom) => {
  currentItem.value = labroom;
  showDeleteModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  currentItem.value = null;
};

const handleSave = async (formData) => {
  // Ensure user has permission before attempting API call
  if (!authStore.hasPermission(PERMISSION_ADMIN | PERMISSION_LAB_MANAGER)) {
    console.error("Permission denied for saving lab room.");
    error.value = "Permission denied."; // Show error
    closeModal();
    return;
  }

  try {
    if (isEditing.value) {
      await dataService.updateLabroom(currentItem.value.id, formData);
    } else {
      await dataService.createLabroom(formData);
    }
    closeModal();
    await fetchLabrooms(); // Refresh list
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to save lab room:", err);
    error.value = `Failed to save: ${err.response?.data?.error || err.message}`;
    // TODO: Add error notification
  }
};

const handleDelete = async () => {
  if (!currentItem.value) return;

  // Ensure user has permission
  if (!authStore.hasPermission(PERMISSION_ADMIN | PERMISSION_LAB_MANAGER)) {
    console.error("Permission denied for deleting lab room.");
    error.value = "Permission denied.";
    closeModal();
    return;
  }

  try {
    await dataService.deleteLabroom(currentItem.value.id);
    closeModal();
    await fetchLabrooms(); // Refresh list
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to delete lab room:", err);
    error.value = `Failed to delete: ${err.response?.data?.error || err.message}`;
    // TODO: Add error notification
    closeModal();
  }
};

onMounted(fetchLabrooms);
</script>

<style scoped>
.modal {
  display: grid;
  place-items: center;
}
</style>
