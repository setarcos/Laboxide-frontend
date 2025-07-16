<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">{{ $t("user.manageUsers") }}</h1>

    <!-- Add Button (Admin only) -->
    <div class="mb-4 text-right" v-if="authStore.isAdmin">
      <button class="btn btn-primary" @click="openAddModal">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
          />
        </svg>
        {{ $t("user.addUser") }}
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
        <span>{{ $t("user.loadError", { msg: error.message || error }) }}</span>
      </div>
    </div>

    <!-- Users Table -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>{{ $t("user.userId") }}</th>
            <th>{{ $t("user.realName") }}</th>
            <th>{{ $t("user.permissions") }}</th>
            <th>{{ $t("user.roles") }}</th>
            <th>{{ $t("user.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="users.length === 0">
            <td colspan="5" class="text-center italic py-4">
              {{ $t("user.noUsers") }}
            </td>
          </tr>
          <tr v-for="user in users" :key="user.user_id">
            <th>{{ user.user_id }}</th>
            <td>{{ user.username }}</td>
            <td>{{ user.permission }}</td>
            <td>
              <span
                v-if="hasRole(user.permission, PERMISSION_ADMIN)"
                class="badge badge-primary badge-outline mr-1"
                >{{ $t("user.roleAdmin") }}</span
              >
              <span
                v-if="hasRole(user.permission, PERMISSION_MEETING_MANAGER)"
                class="badge badge-secondary badge-outline mr-1"
                >{{ $t("user.roleMeetingManager") }}</span
              >
              <span
                v-if="hasRole(user.permission, PERMISSION_LAB_MANAGER)"
                class="badge badge-accent badge-outline mr-1"
                >{{ $t("user.roleLabManager") }}</span
              >
            </td>
            <td>
              <div class="flex gap-1 items-center">
                <template v-if="authStore.isAdmin">
                  <button
                    class="btn btn-xs btn-ghost btn-circle"
                    :title="$t('user.edit')"
                    @click="openEditModal(user)"
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
                    :title="$t('user.delete')"
                    @click="openDeleteModal(user)"
                    :disabled="authStore.user?.userId === user.user_id"
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
                  <span
                    v-if="authStore.user?.userId === user.user_id"
                    class="text-xs italic text-base-content/50 ml-2"
                  >
                    {{ $t("user.currentUserHint") }}
                  </span>
                </template>
                <span v-else class="text-xs italic text-base-content/50">
                  {{ $t("user.noActions") }}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <dialog id="user_modal" class="modal" :open="showAddModal || showEditModal">
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg">
          {{ isEditing ? $t("user.editUser") : $t("user.addUser") }}
        </h3>
        <UserForm
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
      dialogId="user_delete_confirm_modal"
      :title="$t('user.deleteUser')"
      :message="
        $t('user.deleteConfirm', {
          name: currentItem?.username,
          id: currentItem?.user_id,
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
import UserForm from "@/components/UserForm.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import {
  PERMISSION_ADMIN,
  PERMISSION_LAB_MANAGER,
  PERMISSION_MEETING_MANAGER,
} from "@/utils/permissions";

const authStore = useAuthStore();

const users = ref([]);
const isLoading = ref(true);
const error = ref(null);

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const currentItem = ref(null);

const isEditing = computed(() => !!currentItem.value && showEditModal.value);

// Helper to check specific roles for display
const hasRole = (userPermission, rolePermission) => {
  return (Number(userPermission) & rolePermission) === rolePermission;
};

const fetchUsers = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    // Ensure only admins can fetch users
    if (!authStore.isAdmin) {
      throw new Error("Permission denied to view users.");
    }
    const response = await dataService.getUsers();
    users.value = response.data;
  } catch (err) {
    console.error("Failed to fetch users:", err);
    error.value = err.response?.data || err;
  } finally {
    isLoading.value = false;
  }
};

const openAddModal = () => {
  currentItem.value = null;
  showAddModal.value = true;
};

const openEditModal = (user) => {
  currentItem.value = { ...user };
  showEditModal.value = true;
};

const openDeleteModal = (user) => {
  // Basic check: Prevent deleting the currently logged-in user
  if (authStore.user?.userId === user.user_id) {
    alert("You cannot delete your own account.");
    return;
  }
  currentItem.value = user;
  showDeleteModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  currentItem.value = null;
};

const handleSave = async (formData) => {
  // Double check permission
  if (!authStore.isAdmin) {
    console.error("Permission denied for saving user.");
    error.value = "Permission denied.";
    closeModal();
    return;
  }

  try {
    if (isEditing.value) {
      // The API uses PUT /admin/user/{id} where id is the user_id
      await dataService.updateUser(formData);
    } else {
      await dataService.createUser(formData);
    }
    closeModal();
    await fetchUsers(); // Refresh list
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to save user:", err);
    error.value = `Failed to save: ${err.response?.data?.error || err.message}`;
    // TODO: Add error notification
  }
};

const handleDelete = async () => {
  if (
    !currentItem.value ||
    authStore.user?.userId === currentItem.value.user_id
  ) {
    closeModal(); // Close dialog if trying to delete self (already prevented in openDeleteModal)
    return;
  }

  // Double check permission
  if (!authStore.isAdmin) {
    console.error("Permission denied for deleting user.");
    error.value = "Permission denied.";
    closeModal();
    return;
  }

  try {
    // The API uses DELETE /admin/user/{id} where id is the user_id
    await dataService.deleteUser(currentItem.value.user_id);
    closeModal();
    await fetchUsers(); // Refresh list
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to delete user:", err);
    error.value = `Failed to delete: ${err.response?.data?.error || err.message}`;
    // TODO: Add error notification
    closeModal();
  }
};

// Fetch data only if user is admin
onMounted(() => {
  if (authStore.isAdmin) {
    fetchUsers();
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
