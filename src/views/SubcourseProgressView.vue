<template>
  <div class="prose max-w-none">
    <h2>
      {{ $t("progress.student_progress") }}:
      {{ subcourseDetails?.course_name }} ({{
        getWeekdayName(subcourseDetails?.weekday)
      }})
      <span v-if="subcourseDetails?.room_name">
        - {{ subcourseDetails.room_name }}
      </span>
    </h2>

    <!-- Loading State -->
    <div v-if="isLoading.initial" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
      <p>{{ $t("progress.loading_course_data") }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error.initial" class="alert alert-error shadow-lg">
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
          >{{ $t("progress.error_loading_data") }}: {{ error.initial }}</span
        >
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Week Selector & Expand All -->
      <div
        class="flex justify-between items-center mb-4 p-4 bg-base-200 rounded-box shadow"
      >
        <div class="form-control w-40">
          <label class="label pb-1">
            <span class="label-text font-semibold"
              >{{ $t("progress.select_week") }}:</span
            >
          </label>
          <select
            class="select select-bordered select-sm"
            v-model.number="selectedWeek"
            :disabled="isLoading.weekly"
          >
            <option
              v-if="semesterStore.isSemesterLoading || !currentWeekNumber"
              disabled
              value=""
            >
              {{ $t("progress.loading_weeks") }}
            </option>
            <!-- Generate options dynamically based on typical semester length or fetched schedules -->
            <option
              v-for="weekNum in availableWeeks"
              :key="weekNum"
              :value="weekNum"
            >
              {{ $t("progress.week", { week: weekNum }) }}
              <span v-if="weekNum === currentWeekNumber">{{
                ` (${$t("progress.current")})`
              }}</span>
            </option>
          </select>
        </div>
        <div>
          <button
            class="btn btn-sm btn-ghost"
            @click="toggleAllTimelines"
            :disabled="isLoading.weekly || !students.length"
          >
            {{
              showAllTimelines
                ? $t("progress.collapse_all_logs")
                : $t("progress.expand_all_logs")
            }}
          </button>
        </div>
      </div>

      <!-- Weekly Data Loading/Error -->
      <div
        v-if="isLoading.weekly && !isLoading.initial"
        class="text-center py-6"
      >
        <span class="loading loading-md loading-spinner text-secondary"></span>
        <p>
          {{ $t("progress.loading_data_for_week", { week: selectedWeek }) }}
        </p>
      </div>
      <div
        v-else-if="error.weekly && !isLoading.initial"
        class="alert alert-warning shadow-sm my-4"
      >
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>{{ error.weekly }}</span>
        </div>
      </div>

      <!-- Recent Logs Loading/Error (Optional - display here or elsewhere) -->
      <div
        v-if="isLoading.recentLogs"
        class="text-center text-sm text-gray-500"
      >
        {{ $t("progress.fetching_recent_final_logs") }}
        <span class="loading loading-dots loading-xs"></span>
      </div>
      <div
        v-else-if="error.recentLogs"
        class="alert alert-error shadow-sm my-2 text-sm"
      >
        {{ $t("progress.error_fetching_recent_logs") }}: {{ error.recentLogs }}
      </div>

      <!-- Students Table -->
      <div
        v-else-if="students.length > 0"
        class="overflow-x-auto bg-base-100 rounded-box shadow-md mt-6"
      >
        <table class="table table-zebra w-full table-sm">
          <thead>
            <tr>
              <th>{{ $t("progress.student_id") }}</th>
              <th>{{ $t("progress.name") }}</th>
              <th>{{ $t("progress.seat") }}</th>
              <th class="w-1/4">
                {{ $t("progress.progress") }} ({{
                  $t("progress.week", { week: selectedWeek })
                }})
              </th>
              <th>{{ $t("progress.actions") }}</th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="studentData in studentProgressData"
              :key="studentData.student.stu_id"
            >
              <tr class="hover">
                <td>{{ studentData.student.stu_id }}</td>
                <td>{{ studentData.student.stu_name }}</td>
                <td>{{ studentData.student.seat || "-" }}</td>
                <td>
                  <!-- Tooltip shows progress count -->
                  <div
                    class="tooltip cursor-pointer"
                    :data-tip="`${studentData.loggedStepsCount} / ${totalStepsForWeek} ${$t('progress.steps_logged')}`"
                    @click="toggleStudentTimeline(studentData.student.stu_id)"
                  >
                    <!-- Progress bar - color is dynamic -->
                    <progress
                      class="progress w-full"
                      :class="{
                        'progress-success': studentData.hasConfirmedFinalLog,
                        'progress-primary': !studentData.hasConfirmedFinalLog,
                      }"
                      :value="studentData.progressPercent"
                      max="100"
                    ></progress>
                  </div>
                </td>
                <td>
                  <div class="flex gap-1 items-center">
                    <button
                      class="btn btn-xs btn-outline btn-info"
                      @click="openTeacherLogModal(studentData.student)"
                      :title="$t('progress.add_general_log_entry')"
                      :disabled="!selectedSchedule?.id"
                    >
                      {{ $t("progress.add_log") }}
                    </button>
                    <!-- Button to Confirm an existing UNCONFIRMED Final Log -->
                    <button
                      v-if="studentData.unconfirmedFinalLog"
                      class="btn btn-xs btn-outline btn-success"
                      @click="
                        openConfirmModalForLog(studentData.unconfirmedFinalLog)
                      "
                      :title="$t('progress.confirm_student_final_log')"
                      :disabled="isLoading.confirmLog || isLoading.forceLog"
                    >
                      {{ $t("progress.confirm_final_log") }}
                    </button>

                    <!-- Button to FORCE a new, CONFIRMED Final Log -->
                    <button
                      v-else-if="
                        !studentData.recentLogForStudent && selectedSchedule?.id
                      "
                      class="btn btn-xs btn-outline btn-warning"
                      @click="confirmForceLog(studentData.student)"
                      :title="$t('progress.force_final_log_entry')"
                      :disabled="
                        isLoading.forceLog === studentData.student.stu_id ||
                        isLoading.weekly ||
                        isLoading.confirmLog
                      "
                    >
                      <span
                        v-if="isLoading.forceLog === studentData.student.stu_id"
                        class="loading loading-spinner loading-sm mr-1"
                      ></span>
                      {{ $t("progress.force_log") }}
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Expanded Timeline Row -->
              <tr
                v-if="
                  expandedStudentId === studentData.student.stu_id ||
                  showAllTimelines
                "
              >
                <td :colspan="5" class="bg-base-200 p-0">
                  <div class="px-4 py-3">
                    <h4 class="text-sm font-semibold mb-2">
                      {{
                        $t("progress.timeline_logs_for", {
                          name: studentData.student.stu_name,
                          week: selectedWeek,
                        })
                      }}:
                      <span
                        v-if="isLoading.timelines[studentData.student.stu_id]"
                        class="loading loading-dots loading-xs ml-2"
                      ></span>
                    </h4>
                    <div
                      v-if="error.timelines[studentData.student.stu_id]"
                      class="text-error text-xs italic"
                    >
                      {{ $t("progress.error_loading_logs") }}:
                      {{ error.timelines[studentData.student.stu_id] }}
                    </div>
                    <ul
                      v-else-if="
                        studentData.weeklyTimelines &&
                        studentData.weeklyTimelines.length > 0
                      "
                      class="list-none space-y-2 pl-2"
                    >
                      <li
                        v-for="entry in studentData.weeklyTimelines"
                        :key="entry.id"
                        class="text-xs border-b border-base-300 pb-1 last:border-b-0"
                      >
                        <div class="flex justify-between items-start">
                          <div>
                            <span class="font-semibold mr-2">
                              {{
                                entry.subschedule ||
                                $t("progress.general_note")
                              }}:
                            </span>
                            <!-- Note/File Display -->
                            <span v-if="entry.notetype === 0">{{
                              entry.note
                            }}</span>
                            <a
                              v-else-if="entry.notetype === 1"
                              href="#"
                              @click.prevent="handleFileClick(entry)"
                              class="link link-hover text-info break-all"
                              :title="`${$t('progress.download_or_preview')} ${entry.note}`"
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
                          </div>
                          <div
                            class="text-right flex-shrink-0 ml-2 whitespace-nowrap"
                          >
                            <span class="text-gray-500 mr-1"
                              >({{ formatTimestamp(entry.timestamp) }})</span
                            >
                            <span
                              class="font-medium mr-1"
                              :class="{
                                'text-success':
                                  entry.tea_id === authStore.user?.userId,
                              }"
                            >
                              {{ entry.tea_id }}
                            </span>
                            <!-- Delete Button -->
                            <button
                              v-if="entry.tea_id === authStore.user?.userId"
                              class="btn btn-xs btn-ghost btn-circle text-error p-0 align-middle"
                              @click="confirmDeleteTimeline(entry)"
                              :title="$t('progress.delete_log_entry')"
                              :disabled="isLoading.weekly"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                class="h-3 w-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  stroke-width="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 3 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    </ul>
                    <p v-else class="text-xs italic text-base-content/70 pl-2">
                      {{ $t("progress.no_timeline_entries_found") }}
                    </p>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
      <div
        v-else-if="!isLoading.initial && !isLoading.weekly"
        class="text-center py-5 italic text-gray-500"
      >
        {{ $t("progress.no_students_found_for_session") }}
      </div>
    </div>

    <!-- Teacher Log Modal (for general notes) -->
    <dialog id="teacher_log_modal" class="modal" :open="showTeacherLogModal">
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg mb-4">
          {{
            $t("progress.add_log_for", {
              name: studentForTeacherLog?.stu_name,
              week: selectedWeek,
            })
          }}
        </h3>
        <TeacherTimelineLogForm
          v-if="studentForTeacherLog && selectedSchedule"
          :key="teacherLogModalKey"
          :student="studentForTeacherLog"
          :subcourse-id="id"
          :schedule-id="selectedSchedule.id"
          :teacher-id="authStore.user?.userId || 'Teacher'"
          @save="handleTeacherLogSave"
          @close="closeTeacherLogModal"
        />
        <div v-else class="text-center text-warning p-4">
          {{ $t("progress.cannot_add_log_missing_info") }}
        </div>
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="closeTeacherLogModal"
        >
          ✕
        </button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeTeacherLogModal">
          {{ $t("progress.close") }}
        </button>
      </form>
    </dialog>

    <!-- Confirm Delete Modal (for timeline entries) -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      dialogId="timeline_delete_confirm_modal"
      :title="$t('progress.delete_log_entry')"
      :message="`${$t('progress.confirm_delete_log_entry')} '${getTimelineEntryDescription(entryToDelete)}'?`"
      @confirm="deleteTimelineEntry"
      @close="
        showDeleteConfirm = false;
        entryToDelete = null;
      "
    />

    <!-- Confirm Final Log Modal (for student-submitted logs) -->
    <dialog
      id="confirm_final_log_modal"
      class="modal"
      :open="showConfirmModalForLog"
    >
      <div class="modal-box w-11/12 max-w-lg">
        <h3 class="font-bold text-lg mb-4">
          {{
            $t("progress.confirm_final_log_for", {
              name: currentLogToConfirm?.stu_name,
            })
          }}
        </h3>
        <div v-if="currentLogToConfirm">
          <p class="mb-3">{{ $t("progress.student_note") }}:</p>
          <div
            class="p-3 bg-base-300 rounded-box mb-4 max-h-40 overflow-y-auto text-sm"
          >
            {{
              currentLogToConfirm.note ||
              $t("progress.no_student_note_provided")
            }}
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">
                {{ $t("progress.teacher_confirmation_note_optional") }}:
              </span>
            </label>
            <textarea
              class="textarea textarea-bordered h-24"
              v-model="teacherConfirmationNote"
              :placeholder="$t('progress.add_notes_about_confirmation')"
            ></textarea>
          </div>

          <div class="modal-action">
            <button
              class="btn btn-success"
              @click="handleConfirmLog"
              :disabled="isLoading.confirmLog"
            >
              <span
                v-if="isLoading.confirmLog"
                class="loading loading-spinner loading-sm mr-2"
              ></span>
              {{ $t("progress.confirm_log") }}
            </button>
            <button
              class="btn"
              @click="closeConfirmModalForLog"
              :disabled="isLoading.confirmLog"
            >
              {{ $t("progress.cancel") }}
            </button>
          </div>
          <div v-if="error.confirmLog" class="text-error text-sm mt-2">
            {{ $t("progress.error") }}: {{ error.confirmLog }}
          </div>
        </div>
        <div v-else class="text-center text-warning p-4">
          {{ $t("progress.cannot_confirm_log_missing_info") }}
        </div>
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="closeConfirmModalForLog"
        >
          ✕
        </button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeConfirmModalForLog">
          {{ $t("progress.close") }}
        </button>
      </form>
    </dialog>

    <!-- Confirm Force Log Modal -->
    <ConfirmDialog
      :show="showForceConfirm"
      dialogId="force_log_confirm_modal"
      :title="$t('progress.force_final_log')"
      :message="`${$t('progress.confirm_force_final_log_msg', { name: studentToForceLog?.stu_name || $t('progress.this_student'), week: selectedWeek })}`"
      confirmButtonText="{{ $t('progress.force_log') }}"
      @confirm="handleForceLog"
      @close="cancelForceLog"
    />
    <dialog
      id="image_preview_modal"
      class="modal"
      :open="isPreviewModalVisible"
    >
      <div class="modal-box w-11/12 max-w-3xl p-6">
        <h3 class="font-bold text-lg mb-4 break-all">
          {{ $t("progress.image_preview") }}: {{ previewImageFilename }}
        </h3>
        <!-- Loading State -->
        <div v-if="isPreviewLoading" class="text-center py-10">
          <span class="loading loading-lg loading-spinner text-info"></span>
          <p>{{ $t("progress.loading_image_preview") }}</p>
        </div>
        <!-- Error State -->
        <div v-else-if="previewError" class="alert alert-error shadow-sm my-4">
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
              >{{ $t("progress.error_loading_preview") }}:
              {{ previewError }}</span
            >
          </div>
        </div>
        <!-- Image Display -->
        <div
          v-else-if="previewImageUrl"
          class="w-full max-h-[70vh] overflow-auto flex justify-center items-center bg-base-300 rounded"
        >
          <img
            :src="previewImageUrl"
            alt="Image Preview"
            class="max-w-full max-h-full object-contain"
          />
        </div>
        <!-- Fallback if no image URL -->
        <div v-else class="text-center text-warning p-4">
          {{ $t("progress.could_not_load_image_preview") }}
        </div>

        <!-- Close Button -->
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="closePreviewModal"
          :disabled="isPreviewLoading"
        >
          ✕
        </button>
        <div class="modal-action mt-4">
          <button
            v-if="previewImageUrl && !previewError"
            class="btn btn-secondary"
            @click="
              downloadFileFromBlobUrl(previewImageUrl, previewImageFilename)
            "
            :disabled="isPreviewLoading"
          >
            {{ $t("progress.download_image") }}
          </button>
          <button
            class="btn btn-ghost"
            @click="closePreviewModal"
            :disabled="isPreviewLoading"
          >
            {{ $t("progress.close") }}
          </button>
        </div>
      </div>
      <!-- Backdrop -->
      <form method="dialog" class="modal-backdrop">
        <button @click="closePreviewModal" :disabled="isPreviewLoading">
          {{ $t("progress.close") }}
        </button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useSemesterStore } from "@/stores/semester";
import * as dataService from "@/services/dataService";
import {
  getWeekdayName,
  calculateCurrentWeek,
  formatTimestamp,
} from "@/utils/weekday";
import TeacherTimelineLogForm from "@/components/TeacherTimelineLogForm.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useFileHandling } from "@/utils/fileops";
import { useI18n } from "vue-i18n";

const props = defineProps({
  id: {
    // Subcourse ID from route
    type: [String, Number],
    required: true,
  },
});

const { t } = useI18n();
const authStore = useAuthStore();
const semesterStore = useSemesterStore();

// --- State ---
const subcourseDetails = ref(null);
const students = ref([]);
const schedules = ref([]); // All schedules for the parent course
const selectedWeek = ref(null);
const selectedSchedule = ref(null); // Schedule item for selectedWeek
const subSchedulesForWeek = ref([]); // Steps for selectedWeek
const timelineEntries = ref({}); // { stu_id: [entry1, entry2,...] } for selected week

// New state for recent student logs and confirmation
const allRecentStudentLogs = ref([]); // Array of ALL recent StudentLog objects from getRecentLog API (unfiltered by confirm status)
const showConfirmModalForLog = ref(false);
const currentLogToConfirm = ref(null); // The specific StudentLog object being confirmed
const teacherConfirmationNote = ref("");

// New state for force log confirmation
const showForceConfirm = ref(false);
const studentToForceLog = ref(null); // The student object for the force action

const isLoading = reactive({
  initial: true, // Loading students, schedules
  weekly: false, // Loading subschedules, timelines for the selected week
  timelines: {}, // Per-student timeline loading: { stu_id: boolean } - might not be needed if fetching all at once
  recentLogs: false, // Loading recent student logs
  confirmLog: false, // Confirming a specific student log
  forceLog: null, // Forcing a specific student log: null or the stu_id being forced
});
const error = reactive({
  initial: null,
  weekly: null,
  timelines: {}, // Per-student timeline errors: { stu_id: string }
  recentLogs: null, // Error fetching recent student logs
  confirmLog: null, // Error confirming student log
  forceLog: null, // Error forcing student log
});

const expandedStudentId = ref(null); // Track individually expanded student
const showAllTimelines = ref(false); // Track expand all state

// Teacher log modal state (for general notes)
const showTeacherLogModal = ref(false);
const studentForTeacherLog = ref(null);
const teacherLogModalKey = ref(Date.now());

// Delete confirmation state (for timeline entries)
const showDeleteConfirm = ref(false);
const entryToDelete = ref(null);

const {
  isPreviewModalVisible,
  previewImageUrl,
  previewImageFilename,
  isPreviewLoading,
  previewError,
  handleFileClick,
  closePreviewModal,
  downloadFileFromBlobUrl,
} = useFileHandling(dataService.downloadTimelineFile); // Pass the download function

// --- Computed Properties ---
const currentWeekNumber = computed(() => {
  // Reuse logic from DashboardView if available, or recalculate
  if (
    semesterStore.isSemesterLoading ||
    semesterStore.semesterError ||
    !semesterStore.currentSemester
  )
    return null;
  return calculateCurrentWeek(semesterStore.currentSemester);
});

const totalStepsForWeek = computed(() => subSchedulesForWeek.value.length);

// Generate week options based on fetched schedules or a default range
const availableWeeks = computed(() => {
  if (schedules.value.length > 0) {
    return schedules.value.map((s) => s.week).sort((a, b) => a - b);
  }
  // Fallback if schedules haven't loaded yet or are empty
  const current = currentWeekNumber.value || 1;
  const range = 16; // Default semester length guess
  const start = Math.max(1, current - Math.floor(range / 2));
  // Ensure we don't go below week 1
  const end = start + range - 1;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

const studentProgressData = computed(() => {
  const validStepTitles = new Set(
    subSchedulesForWeek.value.map((sub) => sub.title),
  );

  return students.value.map((student) => {
    const weeklyTimelines = (timelineEntries.value[student.stu_id] || []).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    );

    // Count logged entries whose 'subschedule' title is in the valid set for the week
    let loggedStepsCount = 0;
    const loggedTitles = new Set(); // Use a set to count unique valid titles logged
    weeklyTimelines.forEach((entry) => {
      if (entry.subschedule && validStepTitles.has(entry.subschedule)) {
        loggedTitles.add(entry.subschedule);
      }
    });
    loggedStepsCount = loggedTitles.size; // Count unique valid titles logged

    const total = totalStepsForWeek.value;
    const progressPercent =
      total > 0 ? Math.round((loggedStepsCount / total) * 100) : 100;

    // Find if this student has ANY recent final log (confirmed or unconfirmed)
    const recentLogForStudent = allRecentStudentLogs.value.find(
      (log) => log.stu_id === student.stu_id,
    );

    // Determine if the log is unconfirmed (for the Confirm button)
    const unconfirmedFinalLog =
      recentLogForStudent && recentLogForStudent.confirm === 0
        ? recentLogForStudent
        : null;

    // Determine if the log is confirmed (for the bar color)
    const hasConfirmedFinalLog = recentLogForStudent
      ? recentLogForStudent.confirm === 1
      : false;
    // Note: This check relies on the backend's "recent" time window.
    // A log confirmed outside this window won't make the bar green based on *this* API.

    return {
      student,
      loggedStepsCount,
      progressPercent,
      weeklyTimelines, // Keep sorted list for display
      unconfirmedFinalLog, // Add the unconfirmed log if found (for button)
      hasConfirmedFinalLog, // Add status if a recent log is confirmed (for bar color)
      recentLogForStudent, // Add the raw recent log (or null) to easily check for *any* recent log
    };
  });
});

// --- Methods ---
const fetchInitialData = async () => {
  isLoading.initial = true;
  error.initial = null;
  try {
    // Fetch students for this subcourse
    const studentsRes = await dataService.getGroup(props.id);
    students.value = studentsRes.data || [];
    const subCourse = await dataService.getSubcourse(props.id);
    subcourseDetails.value = subCourse.data;

    const parentCourseId = subCourse.data?.course_id;
    if (!parentCourseId && students.value.length > 0) {
      console.warn(
        "Could not determine parent course ID. Fetching schedules might fail.",
      );
    }

    if (parentCourseId) {
      // Only fetch if we have a course ID
      const schedulesRes = await dataService.getSchedules(parentCourseId); // Use fetched parent ID
      schedules.value = schedulesRes.data || [];
    } else if (students.value.length > 0) {
      // Only throw error if there are students but no course ID, as empty subcourse is possible
      throw new Error(
        "Could not determine the parent course ID to fetch schedules.",
      );
    }

    // Set initial week based on store once it loads, or fallback
    // We do NOT await fetchWeeklyData here anymore. It will be called after initial load finishes.
    if (selectedWeek.value === null && currentWeekNumber.value) {
      selectedWeek.value = currentWeekNumber.value;
    } else if (selectedWeek.value === null && schedules.value.length > 0) {
      selectedWeek.value =
        schedules.value.map((s) => s.week).sort((a, b) => a - b)[0] || 1; // Fallback to first week if schedules exist
    } else if (selectedWeek.value === null) {
      selectedWeek.value = 1; // Absolute fallback if no students/schedules and no current week
    }
  } catch (err) {
    console.error("Error loading initial data:", err);
    error.initial = err.response?.data?.error || err.message || "Unknown error";
    // Keep students/schedules/subcourse null or empty on error
    students.value = [];
    schedules.value = [];
    subcourseDetails.value = null;
    selectedWeek.value = 1; // Ensure selectedWeek has a value even on error
  } finally {
    isLoading.initial = false;
    // Fetch recent logs after initial student/subcourse data is loaded.
    // This does not need to be awaited, can run in parallel.
    fetchRecentLogs();
  }
};

const fetchWeeklyData = async () => {
  console.log("Fetching weekly data for week:", selectedWeek.value);
  // Prevent fetching if selectedWeek is still null OR initial load is still running
  // (The check in onMounted handles the initial call after initial load)
  if (selectedWeek.value === null || isLoading.initial) {
    console.log(
      "Skipping weekly fetch: selectedWeek is null or initial load is pending.",
    );
    return;
  }

  isLoading.weekly = true;
  error.weekly = null;
  selectedSchedule.value = null;
  subSchedulesForWeek.value = [];
  timelineEntries.value = {}; // Reset timelines for the new week

  try {
    // Find the main schedule for the selected week
    const scheduleForWeek = schedules.value.find(
      (s) => s.week === selectedWeek.value,
    );

    if (!scheduleForWeek) {
      // This is not necessarily an error if a course has gaps in weeks
      console.warn(`No schedule found for Week ${selectedWeek.value}.`);
      error.weekly = t("progress.no_schedule_for_week", {
        week: selectedWeek.value,
      });
      subSchedulesForWeek.value = []; // Ensure steps are empty
      timelineEntries.value = {}; // Ensure timelines are empty
      selectedSchedule.value = null; // Ensure selectedSchedule is null if no schedule found
    } else {
      selectedSchedule.value = scheduleForWeek;
      // Fetch sub-schedules (steps) for this week
      const subSchedulesRes = await dataService.getSubSchedules(
        selectedSchedule.value.id,
      );
      subSchedulesForWeek.value = (subSchedulesRes.data || []).sort(
        (a, b) => a.step - b.step,
      );

      // Fetch all timeline entries for this subcourse AND this week's schedule_id
      const timelineRes = await dataService.listTimelinesBySchedule(
        props.id,
        selectedSchedule.value.id,
      );
      const allWeeklyEntries = timelineRes.data || [];

      // Group entries by student ID
      const groupedEntries = {};
      allWeeklyEntries.forEach((entry) => {
        if (!groupedEntries[entry.stu_id]) {
          groupedEntries[entry.stu_id] = [];
        }
        groupedEntries[entry.stu_id].push(entry);
      });
      timelineEntries.value = groupedEntries;
      error.weekly = null; // Clear any previous weekly error if fetch succeeds
    }
  } catch (err) {
    console.error(`Error loading data for week ${selectedWeek.value}:`, err);
    error.weekly = err.response?.data?.error || err.message || "Unknown error";
    // Clear data related to the failed week
    subSchedulesForWeek.value = [];
    timelineEntries.value = {};
    selectedSchedule.value = null; // Ensure selectedSchedule is null on error
  } finally {
    isLoading.weekly = false;
  }
};

const fetchRecentLogs = async () => {
  isLoading.recentLogs = true;
  error.recentLogs = null;
  allRecentStudentLogs.value = []; // Clear previous recent logs
  try {
    // Fetch ALL recent logs for the entire subcourse (backend filters by time)
    const res = await dataService.getRecentLog(props.id);
    // Store the full result; filtering by confirm status happens in the computed property
    allRecentStudentLogs.value = res.data || [];
    console.log(
      "Fetched all recent logs (filtered by backend time window):",
      allRecentStudentLogs.value,
    );
  } catch (err) {
    console.error("Error fetching recent student logs:", err);
    error.recentLogs =
      err.response?.data?.error || err.message || "Unknown error";
  } finally {
    isLoading.recentLogs = false;
  }
};

const toggleStudentTimeline = (studentId) => {
  if (showAllTimelines.value) return; // Don't toggle individual if showing all
  expandedStudentId.value =
    expandedStudentId.value === studentId ? null : studentId;
};

const toggleAllTimelines = () => {
  showAllTimelines.value = !showAllTimelines.value;
  expandedStudentId.value = null; // Clear individual expansion when toggling all
};

const openTeacherLogModal = (student) => {
  if (!selectedSchedule.value) {
    alert("Cannot add log: No schedule loaded for the selected week.");
    return;
  }
  studentForTeacherLog.value = student;
  teacherLogModalKey.value = Date.now(); // Force refresh modal form
  showTeacherLogModal.value = true;
};

const closeTeacherLogModal = () => {
  showTeacherLogModal.value = false;
  studentForTeacherLog.value = null;
};

const handleTeacherLogSave = async (/* Maybe receive feedback? */) => {
  // formData was handled by the child component
  closeTeacherLogModal();
  // Refresh weekly data to show the new log entry
  // Note: This refresh might cause the table to scroll depending on browser behavior
  await fetchWeeklyData();
  // TODO: Add success notification (e.g., toast)
};

// --- Confirm Final Log Methods ---
const openConfirmModalForLog = (log) => {
  error.confirmLog = null; // Clear previous error
  isLoading.confirmLog = false; // Reset loading
  currentLogToConfirm.value = log;
  teacherConfirmationNote.value = ""; // Reset note
  showConfirmModalForLog.value = true;
};

const closeConfirmModalForLog = () => {
  showConfirmModalForLog.value = false;
  currentLogToConfirm.value = null;
  teacherConfirmationNote.value = "";
  error.confirmLog = null;
  isLoading.confirmLog = false;
};

const handleConfirmLog = async () => {
  if (!currentLogToConfirm.value) {
    error.confirmLog = "No log selected for confirmation.";
    return;
  }

  isLoading.confirmLog = true;
  error.confirmLog = null;

  try {
    // Prepare data for the API call
    const logId = currentLogToConfirm.value.id;
    const data = { tea_note: teacherConfirmationNote.value }; // API expects { tea_note: string }

    // Call the data service
    await dataService.confirmStudentLog(logId, data);

    // Confirmation successful
    closeConfirmModalForLog();
    // Refresh the list of *all* recent logs to update the confirmed status
    // and potentially remove the unconfirmed log/button
    await fetchRecentLogs();
    // Optional: Show a success message
    // alert(`Final log for ${currentLogToConfirm.value.stu_name} confirmed.`); // Or use a toast
  } catch (err) {
    console.error("Failed to confirm student log:", err);
    error.confirmLog =
      err.response?.data?.error ||
      err.message ||
      "Unknown error during confirmation.";
    // Keep modal open to show the error
  } finally {
    isLoading.confirmLog = false;
  }
};

// --- Force Final Log Methods ---
const confirmForceLog = (student) => {
  if (!selectedSchedule.value) {
    alert("Cannot force log: No schedule loaded for the selected week.");
    return;
  }
  error.forceLog = null; // Clear previous error
  studentToForceLog.value = student;
  showForceConfirm.value = true;
};

const cancelForceLog = () => {
  showForceConfirm.value = false;
  studentToForceLog.value = null;
  error.forceLog = null; // Clear error on cancel
};

const handleForceLog = async () => {
  if (!studentToForceLog.value || !selectedSchedule.value) {
    console.warn(
      "Attempted to force log without a selected student or schedule.",
    );
    // Ensure confirm dialog is closed and state reset
    cancelForceLog();
    return;
  }

  // Close the confirm dialog immediately
  showForceConfirm.value = false;

  isLoading.forceLog = studentToForceLog.value.stu_id; // Set loading state for this specific student
  error.forceLog = null; // Clear previous error

  try {
    // Call the new force API
    await dataService.forceStudentLog(props.id, studentToForceLog.value.stu_id);

    // Force successful!
    // Refresh recent logs to update UI (hide Force button, potentially change bar color)
    await fetchRecentLogs();

    // TODO: Add success notification (e.g., toast) - "Forced final log for [student name]"
  } catch (err) {
    console.error(
      `Failed to force log for student ${studentToForceLog.value.stu_id}:`,
      err,
    );
    error.forceLog =
      err.response?.data?.error || err.message || "Unknown error forcing log.";
    // Display error - maybe alert or a specific error message area
    alert(
      `Failed to force log for ${studentToForceLog.value.stu_name}: ${error.forceLog}`,
    );
  } finally {
    isLoading.forceLog = null; // Reset loading state
    studentToForceLog.value = null; // Clear student reference
  }
};

// --- Timeline Delete Methods ---
const confirmDeleteTimeline = (entry) => {
  entryToDelete.value = entry;
  showDeleteConfirm.value = true;
};

const getTimelineEntryDescription = (entry) => {
  if (!entry) return "";
  // Use subschedule title if available, otherwise indicate note/file
  const prefix = entry.subschedule
    ? `Step "${entry.subschedule}" log`
    : entry.notetype === 1
      ? "File log"
      : "General Note";
  const content = entry.note?.substring(0, 50); // Take first 50 chars of the note/filename
  const ellipsis = entry.note?.length > 50 ? "..." : "";
  return `${prefix}: "${content}${ellipsis}"`;
};

const deleteTimelineEntry = async () => {
  if (!entryToDelete.value) return;

  isLoading.weekly = true; // Reusing weekly loader for simplicity during this operation
  showDeleteConfirm.value = false; // Close the confirm dialog immediately
  const entryIdToDelete = entryToDelete.value.id; // Store ID before clearing entryToDelete
  entryToDelete.value = null; // Clear entryToDelete immediately

  try {
    await dataService.deleteTimeline(entryIdToDelete);
    // Refresh weekly data to remove the deleted entry
    await fetchWeeklyData();
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to delete timeline entry:", err);
    alert(`Delete failed: ${err.response?.data?.error || err.message}`);
  } finally {
    isLoading.weekly = false;
  }
};

// --- Watchers ---
watch(
  selectedWeek,
  (newWeek, oldWeek) => {
    // Trigger fetchWeeklyData when selectedWeek changes,
    // but *only if* initial load is finished (!isLoading.initial).
    // The *initial* fetch after load is handled below in onMounted.
    if (newWeek !== null && newWeek !== oldWeek && !isLoading.initial) {
      console.log(
        `selectedWeek changed from ${oldWeek} to ${newWeek}. Triggering weekly data fetch.`,
      );
      fetchWeeklyData();
    } else if (newWeek === null && oldWeek !== null) {
      // Handle case where week might be unset, clear data
      console.log("selectedWeek unset. Clearing weekly data.");
      selectedSchedule.value = null;
      subSchedulesForWeek.value = [];
      timelineEntries.value = {};
      error.weekly = null; // Clear weekly error if any
    }
  },
  { immediate: false },
); // Immediate is false here because initial fetch is handled in onMounted

// Set initial week based on store once it loads
// This might set selectedWeek before fetchInitialData finishes, or afterwards.
// The fetchWeeklyData call in onMounted is the primary trigger for the *first* fetch.
watch(
  currentWeekNumber,
  (newStoreWeek) => {
    // Only set the selected week based on the store if it hasn't been set yet
    // or if the component is still in its initial loading phase.
    // The goal is to set the *initial* week preference.
    if (selectedWeek.value === null && newStoreWeek !== null) {
      console.log(
        "Current week from store loaded:",
        newStoreWeek,
        "Setting selectedWeek.",
      );
      selectedWeek.value = newStoreWeek;
      // No need to trigger fetchWeeklyData here; onMounted will do it after initial data.
    }
  },
  { immediate: true },
); // Check immediately on component creation

// --- Lifecycle ---
onMounted(async () => {
  // 1. Fetch initial data (students, subcourse details, ALL schedules)
  //    This will also set the initial value of selectedWeek.value
  await fetchInitialData();

  // 2. AFTER initial data is loaded and selectedWeek is set (in fetchInitialData),
  //    trigger the fetch for the *first* week's detailed data.
  //    The selectedWeek watcher handles subsequent changes from the dropdown.
  if (selectedWeek.value !== null) {
    console.log(
      "Initial data fetch complete. Triggering first weekly data fetch for week:",
      selectedWeek.value,
    );
    // Await this to ensure data is there before table renders fully for the first time
    await fetchWeeklyData();
  } else if (students.value.length > 0) {
    // Edge case: students loaded but no schedules and no current week could be determined.
    // selectedWeek remains 1 default, but fetchWeeklyData didn't find a schedule.
    // The error.weekly message should explain this.
    console.warn(
      "No selected week determined after initial fetch or no schedule found for week 1. Weekly data will not load.",
    );
    // In this case, error.weekly would already be set by fetchWeeklyData if it ran and failed to find a schedule.
  }

  // fetchRecentLogs is already called in the finally block of fetchInitialData,
  // which is fine for parallel loading and ensures the button/color status
  // can be determined as soon as possible.
});
</script>

<style scoped>
/* Add specific styles if needed */
.tooltip:before {
  white-space: pre-wrap; /* Allow tooltip text to wrap */
}
</style>
