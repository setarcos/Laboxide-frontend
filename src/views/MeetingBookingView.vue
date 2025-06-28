<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Meeting Room Booking</h1>

    <!-- Global Error Display -->
    <div v-if="error" class="alert alert-error shadow-lg mb-4">
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
        <span>{{ error }}</span>
        <button class="btn btn-xs btn-ghost" @click="error = null">✕</button>
      </div>
    </div>

    <!-- Room Selector and Week Navigation -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 p-4 bg-base-200 rounded-box mb-6"
    >
      <div class="form-control w-full sm:w-auto">
        <label class="label"
          ><span class="label-text">Select a Meeting Room</span></label
        >
        <select
          v-model="selectedRoomId"
          class="select select-bordered"
          @change="onRoomChange"
        >
          <option disabled value="">Please select a room</option>
          <option v-for="room in meetingRooms" :key="room.id" :value="room.id">
            {{ room.room }} - {{ room.info }}
          </option>
        </select>
      </div>

      <div v-if="selectedRoomId" class="flex items-center gap-2">
        <button class="btn" @click="changeWeek(-1)">« Prev Week</button>
        <div class="text-center font-semibold p-2">
          {{ currentWeekDisplay }}
        </div>
        <button class="btn" @click="changeWeek(1)">Next Week »</button>
      </div>
    </div>

    <!-- Loading / Error / No Selection -->
    <div v-if="isLoading" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
    <div v-else-if="!selectedRoomId" class="text-center py-10 italic">
      Please select a meeting room to see the schedule.
    </div>

    <!-- Weekly Calendar -->
    <WeeklyCalendar
      v-else
      :agendas="agendas"
      :current-date="currentDate"
      @book-slot="openBookingModal"
      @view-agenda="openViewModal"
    />

    <!-- Agenda Booking/Details Modal -->
    <dialog id="agenda_modal" class="modal" @close="handleModalClose">
      <div class="modal-box w-11/12 max-w-lg">
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="closeAgendaModal"
        >
          ✕
        </button>

        <h3 class="font-bold text-lg mb-4">
          {{
            modalMode === "create"
              ? "New Meeting Room Booking"
              : modalMode === "edit"
                ? "Edit Booking"
                : "Booking Details"
          }}
        </h3>

        <!-- FORM for Create/Edit -->
        <AgendaForm
          v-if="modalMode === 'create' || modalMode === 'edit'"
          :initial-data="editingAgenda"
          :booking-slot="newBookingSlot"
          :submission-error="formError"
          @save="handleSaveAgenda"
          @close="closeAgendaModal"
        />

        <!-- READ-ONLY VIEW -->
        <div v-if="modalMode === 'view'" class="space-y-3">
          <div>
            <span class="font-semibold w-24 inline-block">Title:</span>
            {{ viewingAgenda.title }}
          </div>
          <div>
            <span class="font-semibold w-24 inline-block">Booked by:</span>
            {{ viewingAgenda.username }}
          </div>
          <div>
            <span class="font-semibold w-24 inline-block">Date:</span>
            {{ viewingAgenda.date }}
            {{ viewingAgenda.repeat === 1 ? "(Repeats Weekly)" : "" }}
          </div>
          <div>
            <span class="font-semibold w-24 inline-block">Time:</span>
            {{ viewingAgenda.start_time.slice(0, 5) }} -
            {{ viewingAgenda.end_time.slice(0, 5) }}
          </div>
          <div
            class="alert alert-warning text-sm mt-2"
            v-if="!viewingAgenda.confirm"
          >
            This booking is pending confirmation from a manager.
          </div>
          <div
            class="alert alert-success text-sm mt-2"
            v-if="viewingAgenda.confirm"
          >
            This booking is confirmed.
          </div>

          <!-- Action buttons for the read-only view -->
          <div class="modal-action">
            <button class="btn btn-ghost" @click="closeAgendaModal">
              Close
            </button>
            <button
              v-if="
                !viewingAgenda.confirm &&
                authStore.hasPermission(PERMISSION_MEETING_MANAGER)
              "
              class="btn btn-success"
              @click="handleConfirmAgenda(viewingAgenda.id)"
            >
              Confirm
            </button>
            <button
              v-if="canEdit(viewingAgenda)"
              class="btn btn-error"
              @click="openDeleteConfirmModal(viewingAgenda)"
            >
              Delete
            </button>
            <button
              v-if="canEdit(viewingAgenda)"
              class="btn btn-primary"
              @click="switchToEditMode"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>

    <!-- Confirm Delete Modal -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      dialogId="agenda_delete_confirm_modal"
      title="Delete Booking"
      :message="`Are you sure you want to delete the booking '${agendaToDelete?.title}'? This action cannot be undone.`"
      @confirm="handleDeleteAgenda"
      @close="closeDeleteConfirmModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import * as dataService from "@/services/dataService";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  parseISO,
  isBefore,
  getDay,
} from "date-fns";
import { PERMISSION_MEETING_MANAGER } from "@/utils/permissions";

import WeeklyCalendar from "@/components/WeeklyCalendar.vue";
import AgendaForm from "@/components/AgendaForm.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const props = defineProps({
  roomId: [String, Number],
});

const router = useRouter();
const authStore = useAuthStore();

// --- STATE MANAGEMENT ---
const meetingRooms = ref([]);
const selectedRoomId = ref(null);
const agendas = ref([]);
const currentDate = ref(new Date());
const isLoading = ref(false);
const error = ref(null);
const formError = ref("");

const modalMode = ref("closed"); // 'closed', 'create', 'view', 'edit'
const newBookingSlot = ref(null);
const viewingAgenda = ref(null);
const editingAgenda = ref(null);

const showDeleteConfirm = ref(false);
const agendaToDelete = ref(null);

// --- COMPUTED PROPERTIES ---
const currentWeekDisplay = computed(() => {
  const start = startOfWeek(currentDate.value, { weekStartsOn: 1 });
  const end = endOfWeek(currentDate.value, { weekStartsOn: 1 });
  return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
});

// --- PERMISSIONS HELPER ---
const canEdit = (agenda) => {
  if (!agenda || !authStore.user) return false;
  return (
    (agenda.userid === authStore.user.userId && agenda.confirm === 0) ||
    authStore.hasPermission(PERMISSION_MEETING_MANAGER)
  );
};

// --- DATA FETCHING ---
const fetchMeetingRooms = async () => {
  try {
    const response = await dataService.getMeetingRooms();
    meetingRooms.value = response.data;
    if (props.roomId && meetingRooms.value.some((r) => r.id == props.roomId)) {
      selectedRoomId.value = props.roomId;
    } else if (meetingRooms.value.length > 0 && !props.roomId) {
      router.replace({
        name: "MeetingBookingView",
        params: { roomId: meetingRooms.value[0].id },
      });
    }
  } catch (err) {
    error.value = err.response?.data?.error || "Failed to load meeting rooms.";
  }
};

const fetchAgendas = async (roomId) => {
  if (!roomId) {
    agendas.value = [];
    return;
  }
  isLoading.value = true;
  error.value = null;
  try {
    const response = await dataService.getAgendasForRoom(roomId);
    agendas.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.error || "Failed to load agendas.";
    agendas.value = [];
  } finally {
    isLoading.value = false;
  }
};

// --- CONFLICT CHECKING ---
const checkForConflicts = (newAgendaData) => {
  const newStart = parseISO(
    `${newAgendaData.date}T${newAgendaData.start_time}`,
  );
  const newEnd = parseISO(`${newAgendaData.date}T${newAgendaData.end_time}`);

  for (const existing of agendas.value) {
    if (editingAgenda.value && existing.id === editingAgenda.value.id) {
      continue;
    }

    if (existing.repeat === 0) {
      if (existing.date !== newAgendaData.date) continue;
      const existingStart = parseISO(`${existing.date}T${existing.start_time}`);
      const existingEnd = parseISO(`${existing.date}T${existing.end_time}`);
      if (newStart < existingEnd && newEnd > existingStart) return existing;
    }

    if (existing.repeat === 1) {
      const existingRepeatDay = getDay(parseISO(existing.date));
      const newDay = getDay(newStart);
      if (
        existingRepeatDay !== newDay ||
        isBefore(parseISO(existing.date), newStart)
      ) {
        continue;
      }
      const existingStart = parseISO(
        `${newAgendaData.date}T${existing.start_time}`,
      );
      const existingEnd = parseISO(
        `${newAgendaData.date}T${existing.end_time}`,
      );
      if (newStart < existingEnd && newEnd > existingStart) return existing;
    }
  }
  return null;
};

// --- ACTION & MODAL HANDLERS ---
const onRoomChange = () =>
  router.push({
    name: "MeetingBookingView",
    params: { roomId: selectedRoomId.value },
  });
const changeWeek = (direction) =>
  (currentDate.value =
    direction > 0
      ? addWeeks(currentDate.value, 1)
      : subWeeks(currentDate.value, 1));

const openBookingModal = (slot) => {
  formError.value = "";
  modalMode.value = "create";
  newBookingSlot.value = slot;
  document.getElementById("agenda_modal").showModal();
};

const openViewModal = (agenda) => {
  modalMode.value = "view";
  viewingAgenda.value = agenda;
  document.getElementById("agenda_modal").showModal();
};

const switchToEditMode = () => {
  if (viewingAgenda.value) {
    editingAgenda.value = { ...viewingAgenda.value };
    modalMode.value = "edit";
  }
};

const closeAgendaModal = () => document.getElementById("agenda_modal").close();

const handleModalClose = () => {
  modalMode.value = "closed";
  viewingAgenda.value = null;
  editingAgenda.value = null;
  newBookingSlot.value = null;
};

const handleSaveAgenda = async (formData) => {
  formError.value = "";
  const conflict = checkForConflicts(formData);
  if (conflict) {
    formError.value = `This time conflicts with "${conflict.title}" (${conflict.start_time.slice(0, 5)}-${conflict.end_time.slice(0, 5)}).`;
    return;
  }

  const isEditing = modalMode.value === "edit";

  // When editing, preserve the original user's ID and name. When creating, use the current user's.
  // This is important for when a manager edits someone else's booking.
  const userDetails = isEditing
    ? {
        userid: editingAgenda.value.userid,
        username: editingAgenda.value.username,
        confirm: editingAgenda.value.confirm,
      }
    : {
        userid: authStore.user.userId,
        username: authStore.user.realname,
        confirm: 0,
      };

  const fullPayload = {
    ...formData,
    ...userDetails,
    room_id: Number(selectedRoomId.value),
  };

  try {
    if (isEditing) {
      await dataService.updateAgenda(editingAgenda.value.id, fullPayload);
    } else {
      await dataService.createAgenda(fullPayload);
    }
    closeAgendaModal();
    await fetchAgendas(selectedRoomId.value);
  } catch (err) {
    if (err.response?.status === 409) {
      formError.value = `Conflict detected by server: ${err.response.data.error}`;
    } else {
      error.value = `Failed to save: ${err.response?.data?.error || err.message}`;
    }
  }
};

const handleConfirmAgenda = async (agendaId) => {
  try {
    const response = await dataService.confirmAgenda(agendaId);
    const index = agendas.value.findIndex((a) => a.id === agendaId);
    if (index !== -1) {
      agendas.value.splice(index, 1, response.data);
    }
    closeAgendaModal();
  } catch (err) {
    error.value = `Failed to confirm: ${err.response?.data?.error || err.message}`;
  }
};

const openDeleteConfirmModal = (agenda) => {
  agendaToDelete.value = agenda;
  showDeleteConfirm.value = true;
};

const closeDeleteConfirmModal = () => {
  agendaToDelete.value = null;
  showDeleteConfirm.value = false;
};

const handleDeleteAgenda = async () => {
  if (!agendaToDelete.value) return;
  try {
    await dataService.deleteAgenda(agendaToDelete.value.id);
    closeDeleteConfirmModal();
    closeAgendaModal();
    await fetchAgendas(selectedRoomId.value);
  } catch (err) {
    error.value = `Failed to delete: ${err.response?.data?.error || err.message}`;
    closeDeleteConfirmModal();
  }
};

// --- LIFECYCLE & WATCHERS ---
watch(
  () => props.roomId,
  (newRoomId) => {
    selectedRoomId.value = newRoomId;
    if (newRoomId) fetchAgendas(newRoomId);
  },
  { immediate: true },
);

onMounted(fetchMeetingRooms);
</script>
