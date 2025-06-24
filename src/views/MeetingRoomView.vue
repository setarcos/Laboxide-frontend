<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Manage Meeting Rooms</h1>
    <div class="mb-4 text-right">
      <button class="btn btn-primary" @click="openAddModal">
        Add Meeting Room
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
    <div v-else-if="error" class="alert alert-error">
      <span>Error: {{ error.message || error }}</span>
    </div>

    <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>Room</th>
            <th>Information</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="meetingRooms.length === 0">
            <td colspan="3" class="text-center italic py-4">
              No meeting rooms found.
            </td>
          </tr>
          <tr v-for="room in meetingRooms" :key="room.id">
            <td>
              <router-link
                :to="{
                  name: 'MeetingBookingView',
                  params: { roomId: room.id },
                }"
                class="link link-hover link-primary font-bold"
              >
                {{ room.room }}
              </router-link>
            </td>
            <td>{{ room.info }}</td>
            <td>
              <div class="flex gap-1">
                <button
                  class="btn btn-xs btn-ghost btn-circle"
                  title="Edit"
                  @click="openEditModal(room)"
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
                  @click="openDeleteModal(room)"
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
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Modal -->
    <dialog
      id="meeting_room_modal"
      class="modal"
      :open="showAddModal || showEditModal"
    >
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg">
          {{ isEditing ? "Edit Meeting Room" : "Add New Meeting Room" }}
        </h3>
        <MeetingRoomForm
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
      dialogId="meeting_room_delete_confirm_modal"
      title="Delete Meeting Room"
      :message="`Are you sure you want to delete room '${currentItem?.room}'?`"
      @confirm="handleDelete"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import * as dataService from "@/services/dataService";
import MeetingRoomForm from "@/components/MeetingRoomForm.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue"; // Assuming you have this component

const meetingRooms = ref([]);
const isLoading = ref(true);
const error = ref(null);

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const currentItem = ref(null);

const isEditing = computed(() => !!currentItem.value && showEditModal.value);

const fetchMeetingRooms = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await dataService.getMeetingRooms();
    meetingRooms.value = response.data;
  } catch (err) {
    error.value = err.response?.data || err;
  } finally {
    isLoading.value = false;
  }
};

const openAddModal = () => {
  currentItem.value = null;
  showAddModal.value = true;
};
const openEditModal = (room) => {
  currentItem.value = { ...room };
  showEditModal.value = true;
};
const openDeleteModal = (room) => {
  currentItem.value = room;
  showDeleteModal.value = true;
};

const closeModal = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  currentItem.value = null;
};

const handleSave = async (formData) => {
  try {
    if (isEditing.value) {
      await dataService.updateMeetingRoom(currentItem.value.id, formData);
    } else {
      await dataService.createMeetingRoom(formData);
    }
    closeModal();
    await fetchMeetingRooms();
  } catch (err) {
    // Better error handling can be added here
    console.error("Failed to save meeting room:", err);
  }
};

const handleDelete = async () => {
  if (!currentItem.value) return;
  try {
    await dataService.deleteMeetingRoom(currentItem.value.id);
    closeModal();
    await fetchMeetingRooms();
  } catch (err) {
    console.error("Failed to delete meeting room:", err);
  }
};

onMounted(fetchMeetingRooms);
</script>
