<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">
      {{ $t("term.manageSemesters") }}
    </h1>

    <!-- Add Button (Admin only) -->
    <div class="mb-4 text-right" v-if="authStore.isAdmin">
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
        {{ $t("term.addSemester") }}
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
        <span>{{ $t("term.loadError", { msg: error.message || error }) }}</span>
      </div>
    </div>

    <!-- Semesters Table -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>{{ $t("term.name") }}</th>
            <th>{{ $t("term.startDate") }}</th>
            <th>{{ $t("term.endDate") }}</th>
            <th>{{ $t("term.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="semesters.length === 0">
            <td colspan="5" class="text-center italic py-4">
              {{ $t("term.noSemesters") }}
            </td>
          </tr>
          <tr v-for="semester in semesters" :key="semester.id">
            <td>{{ semester.name }}</td>
            <td>{{ formatDate(semester.start) }}</td>
            <td>{{ formatDate(semester.end) }}</td>
            <td>
              <div class="flex gap-1">
                <!-- Edit/Delete only for Admin -->
                <template v-if="authStore.isAdmin">
                  <button
                    class="btn btn-xs btn-ghost btn-circle"
                    :title="$t('term.edit')"
                    @click="openEditModal(semester)"
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
                    :title="$t('term.delete')"
                    @click="openDeleteModal(semester)"
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
                <span v-else class="text-xs italic text-base-content/50">
                  {{ $t("term.noActions") }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <dialog
      id="semester_modal"
      class="modal"
      :open="showAddModal || showEditModal"
    >
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg">
          {{ isEditing ? $t("term.editSemester") : $t("term.addSemester") }}
        </h3>
        <SemesterForm
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
      dialogId="semester_delete_confirm_modal"
      :title="$t('term.deleteSemester')"
      :message="
        $t('term.deleteConfirm', {
          name: currentItem?.name,
          id: currentItem?.id,
        })
      "
      @confirm="handleDelete"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import * as dataService from "@/services/dataService";
import SemesterForm from "@/components/SemesterForm.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const authStore = useAuthStore();

const semesters = ref([]);
const isLoading = ref(true);
const error = ref(null);

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const currentItem = ref(null);

const isEditing = computed(() => !!currentItem.value && showEditModal.value);

// Helper to format date for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    // Assuming backend sends a format parsable by Date
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  } catch (e) {
    console.error("Failed to format date:", e);
    return dateString; // Return original if formatting fails
  }
};

const fetchSemesters = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // Ensure only admins can fetch semesters as per API spec
    if (!authStore.isAdmin) {
      throw new Error("Permission denied to view semesters.");
    }
    const response = await dataService.getSemesters();
    semesters.value = response.data;
  } catch (err) {
    console.error("Failed to fetch semesters:", err);
    error.value = err.response?.data || err;
  } finally {
    isLoading.value = false;
  }
};

const openAddModal = () => {
  currentItem.value = null;
  showAddModal.value = true;
};

const openEditModal = (semester) => {
  currentItem.value = { ...semester };
  showEditModal.value = true;
};

const openDeleteModal = (semester) => {
  currentItem.value = semester;
  showDeleteModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  currentItem.value = null;
};

const handleSave = async (formData) => {
  // Double check permission just in case UI allowed access incorrectly
  if (!authStore.isAdmin) {
    console.error("Permission denied for saving semester.");
    error.value = "Permission denied.";
    closeModal();
    return;
  }
  try {
    if (isEditing.value) {
      await dataService.updateSemester(currentItem.value.id, formData);
    } else {
      await dataService.createSemester(formData);
    }
    closeModal();
    await fetchSemesters(); // Refresh list
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to save semester:", err);
    error.value = `Failed to save: ${err.response?.data?.error || err.message}`;
    // TODO: Add error notification
  }
};

const handleDelete = async () => {
  if (!currentItem.value) return;

  // Double check permission
  if (!authStore.isAdmin) {
    console.error("Permission denied for deleting semester.");
    error.value = "Permission denied.";
    closeModal();
    return;
  }

  try {
    await dataService.deleteSemester(currentItem.value.id);
    closeModal();
    await fetchSemesters(); // Refresh list
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to delete semester:", err);
    error.value = `Failed to delete: ${err.response?.data?.error || err.message}`;
    // TODO: Add error notification
    closeModal();
  }
};

// Fetch data only if user is admin
onMounted(() => {
  if (authStore.isAdmin) {
    fetchSemesters();
  } else {
    isLoading.value = false;
    error.value = "You do not have permission to view this page.";
  }
});
</script>

<style scoped>
.modal {
  display: grid;
  place-items: center;
}
</style>
