<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">{{ $t("meeting.title") }}</h1>

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
        <span>{{ $t("meeting.error_prefix") }} {{ error }}</span>
        <button class="btn btn-xs btn-ghost" @click="error = null">✕</button>
      </div>
    </div>

    <!-- Room Selector and Week Navigation -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 p-4 bg-base-200 rounded-box mb-6"
    >
      <div class="form-control w-full sm:w-auto">
        <div class="flex items-center gap-4">
          <label class="label"
            ><span class="label-text">{{
              $t("meeting.select_room_label")
            }}</span></label
          >
          <select
            v-model="selectedRoomId"
            class="select select-bordered"
            @change="onRoomChange"
          >
            <option disabled value="">
              {{ $t("meeting.select_room_placeholder") }}
            </option>
            <option
              v-for="room in meetingRooms"
              :key="room.id"
              :value="room.id"
            >
              {{ room.room }} - {{ room.info }}
            </option>
          </select>
        </div>
      </div>
      <div v-if="selectedRoomId" class="flex items-center gap-2">
        <button class="btn" @click="changeWeek(-1)">
          {{ $t("meeting.prev_week") }}
        </button>
        <div class="text-center font-semibold p-2">
          {{ currentWeekDisplay }}
        </div>
        <button class="btn" @click="changeWeek(1)">
          {{ $t("meeting.next_week") }}
        </button>

        <!-- View Toggle Button -->
        <button
          class="btn btn-ghost"
          @click="viewMode = viewMode === 'calendar' ? 'list' : 'calendar'"
          :title="
            viewMode === 'calendar'
              ? $t('meeting.switch_to_list')
              : $t('meeting.switch_to_calendar')
          "
        >
          <svg
            v-if="viewMode === 'calendar'"
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading / Error / No Selection -->
    <div v-if="isLoading" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
    </div>
    <div v-else-if="!selectedRoomId" class="text-center py-10 italic">
      {{ $t("meeting.no_room_selected") }}
    </div>

    <!-- Weekly Calendar -->
    <WeeklyCalendar
      v-else
      :agendas="agendas"
      :current-date="currentDate"
      :view-mode="viewMode"
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
              ? $t("meeting.modal.new")
              : modalMode === "edit"
                ? $t("meeting.modal.edit")
                : $t("meeting.modal.view")
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
            <span class="font-semibold w-24 inline-block">{{
              $t("meeting.modal.title")
            }}</span>
            {{ viewingAgenda.title }}
          </div>
          <div>
            <span class="font-semibold w-24 inline-block">{{
              $t("meeting.modal.booked_by")
            }}</span>
            {{ viewingAgenda.username }}
          </div>
          <div>
            <span class="font-semibold w-24 inline-block">{{
              $t("meeting.modal.date")
            }}</span>
            {{ viewingAgenda.date }}
            {{ viewingAgenda.repeat === 1 ? $t("meeting.modal.repeats") : "" }}
          </div>
          <div>
            <span class="font-semibold w-24 inline-block">{{
              $t("meeting.modal.time")
            }}</span>
            {{ viewingAgenda.start_time.slice(0, 5) }} -
            {{ viewingAgenda.end_time.slice(0, 5) }}
          </div>
          <div
            class="alert alert-warning text-sm mt-2"
            v-if="!viewingAgenda.confirm"
          >
            {{ $t("meeting.modal.pending") }}
          </div>
          <div
            class="alert alert-success text-sm mt-2"
            v-if="viewingAgenda.confirm"
          >
            {{ $t("meeting.modal.confirmed") }}
          </div>

          <!-- Action buttons for the read-only view -->
          <div class="modal-action">
            <button class="btn btn-ghost" @click="closeAgendaModal">
              {{ $t("meeting.modal.close") }}
            </button>
            <button
              v-if="
                !viewingAgenda.confirm &&
                authStore.hasPermission(PERMISSION_MEETING_MANAGER)
              "
              class="btn btn-success"
              @click="handleConfirmAgenda(viewingAgenda.id)"
            >
              {{ $t("meeting.modal.confirm") }}
            </button>
            <button
              v-if="canEdit(viewingAgenda)"
              class="btn btn-error"
              @click="openDeleteConfirmModal(viewingAgenda)"
            >
              {{ $t("meeting.modal.delete") }}
            </button>
            <button
              v-if="canEdit(viewingAgenda)"
              class="btn btn-primary"
              @click="switchToEditMode"
            >
              {{ $t("meeting.modal.edit") }}
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
      :title="$t('meeting.delete_modal.title')"
      :message="
        $t('meeting.delete_modal.message', { title: agendaToDelete?.title })
      "
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
import { useI18n } from "vue-i18n";

const { t, d: formatDate } = useI18n();
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
const viewMode = ref("calendar"); // 'calendar' or 'list'

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
  return `${formatDate(start, "short")} - ${formatDate(end, "long")}`;
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
  const newDate = parseISO(newAgendaData.date);
  const newStart = parseISO(
    `${newAgendaData.date}T${newAgendaData.start_time}`,
  );
  const newEnd = parseISO(`${newAgendaData.date}T${newAgendaData.end_time}`);

  for (const existing of agendas.value) {
    if (editingAgenda.value && existing.id === editingAgenda.value.id) {
      continue; // Skip self when editing
    }

    // Handle repeating agendas
    if (existing.repeat === 1) {
      const repeatStart = parseISO(existing.date);
      const existingRepeatDay = getDay(repeatStart);
      const newAgendaDay = getDay(newDate);

      // Skip if weekday doesn't match or new date is before repeat start
      if (
        existingRepeatDay !== newAgendaDay ||
        isBefore(newDate, repeatStart)
      ) {
        continue;
      }

      const existingStart = parseISO(
        `${newAgendaData.date}T${existing.start_time}`,
      );
      const existingEnd = parseISO(
        `${newAgendaData.date}T${existing.end_time}`,
      );

      if (newStart < existingEnd && newEnd > existingStart) {
        return existing;
      }
    }
    // Handle one-time agendas
    else {
      if (existing.date !== newAgendaData.date) {
        continue;
      }

      const existingStart = parseISO(`${existing.date}T${existing.start_time}`);
      const existingEnd = parseISO(`${existing.date}T${existing.end_time}`);

      if (newStart < existingEnd && newEnd > existingStart) {
        return existing;
      }
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
  formError.value = "";
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
    formError.value = t("meeting.form.error.time_conflict", {
      title: conflict.title,
      startTime: conflict.start_time.slice(0, 5),
      endTime: conflict.end_time.slice(0, 5),
    });
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
