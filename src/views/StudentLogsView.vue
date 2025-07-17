<template>
  <div class="p-4 md:p-6">
    <div class="mb-4">
      <router-link to="/labrooms" class="btn btn-ghost">
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {{ $t("log.back_to_labrooms") }}
      </router-link>
    </div>

    <h1 class="text-2xl font-semibold mb-4">
      {{ $t("log.student_logs_for") }}
      {{ fetchedRoomName || $t("log.room_id_prefix") + props.roomId }}
    </h1>

    <!-- Time Range Filter -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title">{{ $t("log.filter_by_time_range") }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label class="label" for="start_time">
              <span class="label-text">{{ $t("log.start_time") }}</span>
            </label>
            <input
              type="datetime-local"
              id="start_time"
              v-model="startTime"
              class="input input-bordered w-full"
            />
          </div>
          <div>
            <label class="label" for="end_time">
              <span class="label-text">{{ $t("log.end_time") }}</span>
            </label>
            <input
              type="datetime-local"
              id="end_time"
              v-model="endTime"
              class="input input-bordered w-full"
            />
          </div>
          <button
            class="btn btn-primary md:mt-9"
            @click="fetchLogs"
            :disabled="isLoading || !startTime || !endTime"
          >
            <span
              v-if="isLoading"
              class="loading loading-spinner loading-xs"
            ></span>
            {{ $t("log.fetch_logs") }}
          </button>
        </div>
        <p v-if="filterError" class="text-error text-sm mt-2">
          {{ $t(filterError) }}
        </p>
      </div>
    </div>

    <!-- Loading and Error States -->
    <div v-if="isLoadingInitial" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
      <p>{{ $t("log.loading_logs") }}</p>
    </div>
    <div v-else-if="fetchError" class="alert alert-error shadow-lg">
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
        <span
          >{{ $t("log.error_loading_logs") }}
          {{ fetchError.message || fetchError }}</span
        >
      </div>
    </div>

    <!-- Student Logs Table -->
    <div
      v-else-if="logs.length > 0"
      class="overflow-x-auto bg-base-100 rounded-box shadow"
    >
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>{{ $t("log.student_id") }}</th>
            <th>{{ $t("log.student_name") }}</th>
            <th>{{ $t("log.seat") }}</th>
            <th>{{ $t("log.lab_name") }}</th>
            <th>{{ $t("log.finish_time") }}</th>
            <th>{{ $t("log.confirmed") }}</th>
            <th>{{ $t("log.student_note") }}</th>
            <th>{{ $t("log.teacher") }}</th>
            <th>{{ $t("log.teacher_note") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in logs" :key="log.id">
            <td>{{ log.stu_id || "N/A" }}</td>
            <td>{{ log.stu_name || "N/A" }}</td>
            <td>{{ log.seat || "N/A" }}</td>
            <td>{{ log.lab_name || "N/A" }}</td>
            <td>{{ formatTimestamp(log.fin_time) }}</td>
            <td>
              <span
                :class="
                  log.confirm ? 'badge badge-success' : 'badge badge-ghost'
                "
              >
                {{ log.confirm ? $t("log.yes") : $t("log.no") }}
              </span>
            </td>
            <td class="whitespace-pre-wrap max-w-xs truncate" :title="log.note">
              {{ log.note || "-" }}
            </td>
            <td>{{ log.tea_name || "N/A" }}</td>
            <td
              class="whitespace-pre-wrap max-w-xs truncate"
              :title="log.tea_note"
            >
              {{ log.tea_note || "-" }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div
      v-else-if="searchedOnce && logs.length === 0"
      class="text-center italic py-10"
    >
      {{ $t("log.no_logs_found") }}
    </div>
    <div v-else class="text-center italic py-10">
      {{ $t("log.select_time_prompt") }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as dataService from "@/services/dataService";
import { formatTimestamp } from "@/utils/weekday";

const props = defineProps({
  roomId: {
    type: [String, Number],
    required: true,
  },
});

const fetchedRoomName = ref("");
const isLoadingRoomDetails = ref(true); // For loading state of room details
const roomDetailsError = ref(null);

const logs = ref([]);
const isLoading = ref(false); // For fetch button
const isLoadingInitial = ref(false); // For initial load indication (might not be used if fetch is manual)
const fetchError = ref(null);
const filterError = ref(""); // For errors related to time range input
const searchedOnce = ref(false); // To track if a search has been attempted

const now = new Date();
const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

// Format to YYYY-MM-DDTHH:MM (for datetime-local input)
const formatInputDateTime = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const startTime = ref(formatInputDateTime(oneDayAgo));
const endTime = ref(formatInputDateTime(now));

const fetchRoomDetails = async () => {
  isLoadingRoomDetails.value = true;
  roomDetailsError.value = null;
  try {
    const response = await dataService.getLabroom(props.roomId);
    fetchedRoomName.value = response.data.name;
  } catch (err) {
    console.error("Failed to fetch room details:", err);
    roomDetailsError.value = err.response?.data || err;
    fetchedRoomName.value = ""; // Clear on error
  } finally {
    isLoadingRoomDetails.value = false;
  }
};

const fetchLogs = async () => {
  if (!startTime.value || !endTime.value) {
    filterError.value = "log.select_both_times";
    return;
  }
  const start = new Date(startTime.value);
  const end = new Date(endTime.value);
  if (start >= end) {
    filterError.value = "log.start_before_end";
    return;
  }
  filterError.value = "";
  isLoading.value = true;
  if (!searchedOnce.value) isLoadingInitial.value = true; // Show full page loader on first search
  fetchError.value = null;

  try {
    // Append ':00' for seconds, as datetime-local doesn't include them
    // and NaiveDateTime might expect them for full parsing.
    const rangeData = {
      start_time: startTime.value + ":00",
      end_time: endTime.value + ":00",
    };
    const response = await dataService.getStudentLogsByRoom(
      props.roomId,
      rangeData,
    );
    logs.value = response.data;
  } catch (err) {
    console.error("Failed to fetch student logs:", err);
    fetchError.value = err.response?.data || err;
    logs.value = []; // Clear previous logs on error
  } finally {
    isLoading.value = false;
    isLoadingInitial.value = false;
    searchedOnce.value = true;
  }
};

onMounted(() => {
  fetchRoomDetails();
  if (startTime.value && endTime.value) {
    fetchLogs();
  }
});
</script>

<style scoped>
/* Add any specific styles if needed */
.max-w-xs {
  max-width: 12rem; /* Adjust as needed for note columns */
}
</style>
