<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Back Button -->
    <div class="mb-6">
      <button @click="goBack" class="btn btn-ghost">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 mr-2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        {{ $t("timeline.back") }}
      </button>
    </div>

    <!-- Title -->
    <h1 class="text-2xl font-bold mb-4">
      {{
        $t("timeline.timeline_for", { name: studentNameDisplay, id: studentId })
      }}
    </h1>
    <p
      v-if="subcourseNameDisplay"
      class="text-lg mb-6 text-base-content text-opacity-80"
    >
      {{ $t("timeline.course_label", { name: subcourseNameDisplay }) }}
    </p>

    <!-- Loading State -->
    <div v-if="isLoading.page" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
      <p class="mt-2">{{ $t("timeline.loading_timeline") }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error.page" class="alert alert-error shadow-lg mb-6">
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
          >{{ $t("timeline.error_loading_timeline") }}: {{ error.page }}</span
        >
      </div>
    </div>

    <!-- Timeline Display -->
    <div v-else>
      <div
        v-if="Object.keys(groupedTimelines).length === 0"
        class="text-center italic py-6"
      >
        {{ $t("timeline.no_timeline_entries") }}
      </div>

      <!-- Loop through grouped timelines -->
      <div
        v-for="group in groupedTimelines"
        :key="group.scheduleInfo.id"
        class="mb-8 collapse collapse-arrow bg-base-200 rounded-box shadow"
      >
        <input
          type="checkbox"
          class="peer"
          :checked="group.entries.length > 0"
        />
        <div
          class="collapse-title text-xl font-medium peer-checked:bg-base-300"
        >
          {{
            group.scheduleInfo.name ||
            $t("timeline.schedule_fallback", { id: group.scheduleInfo.id })
          }}
          <span class="text-sm font-normal"
            >({{ group.entries.length }} {{ $t("timeline.entries") }})</span
          >
        </div>
        <div class="collapse-content peer-checked:bg-base-100">
          <div v-if="group.entries.length > 0" class="overflow-x-auto mt-4">
            <table class="table table-sm w-full">
              <thead>
                <tr>
                  <th>{{ $t("timeline.timestamp") }}</th>
                  <th>{{ $t("timeline.by") }}</th>
                  <th>{{ $t("timeline.subschedule") }}</th>
                  <th>{{ $t("timeline.note_file") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in group.entries" :key="entry.id">
                  <td
                    class="text-xs text-base-content text-opacity-70 whitespace-nowrap"
                  >
                    {{ formatTimestamp(entry.timestamp) }}
                  </td>
                  <td
                    class="text-xs text-base-content text-opacity-70 whitespace-nowrap"
                  >
                    {{ entry.tea_id }}
                  </td>
                  <td>
                    <span class="badge badge-ghost badge-sm">{{
                      entry.subschedule
                    }}</span>
                  </td>
                  <td>
                    <span v-if="entry.notetype === 0">{{ entry.note }}</span>
                    <a
                      v-else-if="entry.notetype === 1"
                      href="#"
                      @click.prevent="handleFileClick(entry)"
                      class="link link-hover text-info break-all"
                      :title="
                        isImageFile(entry.note)
                          ? $t('timeline.preview_title', { name: entry.note })
                          : $t('timeline.download_title', { name: entry.note })
                      "
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3 w-3 inline-block mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      {{ entry.note }}
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="mt-4 text-sm text-base-content text-opacity-70">
            {{ $t("timeline.no_entries_yet") }}
          </div>
        </div>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <dialog
      id="image_preview_modal"
      class="modal"
      :open="isPreviewModalVisible"
    >
      <div class="modal-box w-11/12 max-w-5xl">
        <h3 class="font-bold text-lg mb-4">
          {{ $t("timeline.preview") }}: {{ previewImageFilename }}
        </h3>

        <div v-if="isPreviewLoading" class="text-center py-10">
          <span class="loading loading-spinner text-primary"></span>
          {{ $t("timeline.loading_image") }}
        </div>
        <div
          v-else-if="previewError"
          class="alert alert-warning text-sm p-2 my-2"
        >
          <span>{{ previewError }}</span>
        </div>
        <div v-else-if="previewImageUrl">
          <img
            :src="previewImageUrl"
            alt="Image Preview"
            class="max-w-full max-h-[70vh] mx-auto object-contain"
          />
        </div>

        <div class="modal-action mt-4">
          <button
            v-if="previewImageUrl && !previewError"
            class="btn btn-secondary"
            @click="
              downloadFileFromBlobUrl(previewImageUrl, previewImageFilename)
            "
            :disabled="isPreviewLoading"
          >
            {{ $t("timeline.download_image") }}
          </button>
          <button
            class="btn btn-ghost"
            @click="closePreviewModal"
            :disabled="isPreviewLoading"
          >
            {{ $t("timeline.close") }}
          </button>
        </div>
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="closePreviewModal"
          :disabled="isPreviewLoading"
        >
          ✕
        </button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closePreviewModal" :disabled="isPreviewLoading">
          {{ $t("timeline.close") }}
        </button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import * as dataService from "@/services/dataService";
import { formatTimestamp } from "@/utils/weekday";
import { isImageFile, useFileHandling } from "@/utils/fileops";
// --- Props, Router, Route ---
const props = defineProps({
  subcourseId: { type: [String, Number], required: true },
  studentId: { type: String, required: true },
});
const router = useRouter();
const route = useRoute();

// --- State ---
const subcourseInfo = ref(null);
const schedules = ref([]);
const timelines = ref([]);
const isLoading = ref({ page: true }); // Combined loading state
const error = ref({ page: null }); // Combined error state

// Get passed state (student name, subcourse name) - provide fallbacks
const studentNameDisplay = ref(
  route.meta?.state?.studentName || props.studentId,
);
const subcourseNameDisplay = ref(route.meta?.state?.subcourseName || "");

const {
  isPreviewModalVisible,
  previewImageUrl,
  previewImageFilename,
  isPreviewLoading,
  previewError,
  handleFileClick, // Get the handler function
  closePreviewModal, // Get the close function
  downloadFileFromBlobUrl, // Get download helper if needed
} = useFileHandling(dataService.downloadTimelineFile);

// --- Computed ---
const groupedTimelines = computed(() => {
  if (!schedules.value.length || !timelines.value.length) {
    return {};
  }

  const groups = {};
  // Initialize groups based on schedules
  schedules.value.forEach((schedule) => {
    groups[schedule.id] = {
      scheduleInfo: schedule,
      entries: [],
    };
  });

  // Populate groups with timeline entries
  timelines.value.forEach((entry) => {
    if (groups[entry.schedule_id]) {
      groups[entry.schedule_id].entries.push(entry);
    } else {
      // Handle entries whose schedule might not be in the list (optional)
      console.warn(
        `Timeline entry ${entry.id} references unknown schedule ID ${entry.schedule_id}`,
      );
      // You could create a fallback group here if needed
    }
  });

  // Filter out schedule groups with no entries if desired
  // return Object.fromEntries(Object.entries(groups).filter(([_, group]) => group.entries.length > 0));
  // Or keep all schedule groups:
  return groups;
});

// --- Methods ---

const goBack = () => {
  router.back();
};

const fetchTimelineData = async () => {
  isLoading.value.page = true;
  error.value.page = null;
  let courseId = null;

  try {
    // 1. Fetch Subcourse details to get course_id
    try {
      const subcourseResponse = await dataService.getSubcourse(
        props.subcourseId,
      );
      subcourseInfo.value =
        subcourseResponse.data?.data || subcourseResponse.data;
      courseId = subcourseInfo.value?.course_id;
      // Update subcourse name if not passed via state or if fetched is better
      if (!subcourseNameDisplay.value && subcourseInfo.value?.course_name) {
        subcourseNameDisplay.value = subcourseInfo.value.course_name;
      }
    } catch (err) {
      console.error("Failed to fetch subcourse details:", err);
      throw new Error(
        `Could not load course information for group ${props.subcourseId}.`,
      );
    }

    if (!courseId) {
      throw new Error("Could not determine the course ID for this group.");
    }

    // 2. Fetch Schedules for the course and Timelines for the student concurrently
    const [schedulesResponse, timelinesResponse] = await Promise.all([
      dataService.getSchedules(courseId),
      dataService.listTimelinesByStudent(props.subcourseId, props.studentId),
    ]);

    schedules.value =
      schedulesResponse.data?.data || schedulesResponse.data || [];
    timelines.value =
      timelinesResponse.data?.data || timelinesResponse.data || [];

    // Basic validation/logging
    console.log(
      `Fetched ${schedules.value.length} schedules for course ${courseId}`,
    );
    console.log(
      `Fetched ${timelines.value.length} timeline entries for student ${props.studentId} in group ${props.subcourseId}`,
    );
  } catch (err) {
    console.error("Failed to load timeline data:", err);
    error.value.page =
      err.message || err.response?.data?.error || "An unknown error occurred.";
    // Clear potentially partial data
    schedules.value = [];
    timelines.value = [];
  } finally {
    isLoading.value.page = false;
  }
};

// --- Lifecycle Hooks ---
onMounted(() => {
  // Update display name from route state if available on mount
  // This handles direct navigation/refresh better if state is preserved
  if (history.state?.studentName) {
    studentNameDisplay.value = history.state.studentName;
  }
  if (history.state?.subcourseName) {
    subcourseNameDisplay.value = history.state.subcourseName;
  }
  fetchTimelineData();
});
</script>

<style scoped>
/* Add specific styles if needed */
.collapse-title {
  cursor: pointer;
}
.prose {
  /* Basic prose styling */
  line-height: 1.6;
}
.prose p {
  margin-bottom: 0.5em; /* Adjust spacing */
}
.prose button.link {
  /* Ensure file links look good in prose */
  text-decoration: none;
}
</style>
