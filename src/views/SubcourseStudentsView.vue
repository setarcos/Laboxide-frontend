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
        {{ $t("stu.back") }}
      </button>
    </div>

    <!-- Loading State (Subcourse Info) -->
    <div v-if="isLoadingSubcourse" class="text-center py-5">
      <span class="loading loading-spinner text-info"></span>
      {{ $t("stu.loading_group_details") }}
    </div>
    <!-- Error State (Subcourse Info) -->
    <div v-else-if="subcourseError" class="alert alert-warning shadow-sm mb-4">
      {{ $t("stu.could_not_load_group_details") }}:
      {{ subcourseError.message || subcourseError }}
    </div>
    <!-- Subcourse Info Display -->
    <div v-else-if="subcourse" class="mb-6 p-4 bg-base-200 rounded-lg shadow">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="mb-2">
            <strong>{{ $t("stu.course") }}:</strong>
            {{ subcourse.course_name || $t("stu.n_a") }}
          </p>
          <p class="mb-2">
            <strong>{{ $t("stu.teacher") }}:</strong> {{ subcourse.tea_name }}
          </p>
        </div>
        <div>
          <p class="mb-2">
            <strong>{{ $t("stu.day") }}:</strong>
            {{ getWeekdayName(subcourse.weekday) }}
          </p>
          <p class="mb-2">
            <strong>{{ $t("stu.room") }}:</strong>
            {{ subcourse.room_name || $t("stu.n_a") }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State (Student List) -->
    <div v-if="isLoadingStudents" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
      <p class="mt-2">{{ $t("stu.loading_student_list") }}</p>
    </div>

    <!-- Error State (Student List) -->
    <div v-else-if="studentsError" class="alert alert-error shadow-lg">
      {{ $t("stu.error_loading_students") }}:
      {{ studentsError.message || studentsError }}
    </div>

    <!-- Student Table -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow">
      <table class="table table-zebra w-full table-sm">
        <thead>
          <tr>
            <th>{{ $t("stu.student_id") }}</th>
            <th>{{ $t("stu.student_name") }}</th>
            <th class="text-center">{{ $t("stu.seat") }}</th>
            <th v-if="isTeacher">{{ $t("stu.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!isLoadingStudents && students.length === 0">
            <td colspan="3" class="text-center italic py-4">
              {{ $t("stu.no_students_enrolled") }}
            </td>
          </tr>
          <tr v-for="student in students" :key="student.id">
            <td>{{ student.stu_id }}</td>
            <td>
              <router-link
                v-if="isTeacher || authStore.user.userId === student.stu_id"
                :to="{
                  name: 'StudentTimeline', // Define this route name later
                  params: { subcourseId: props.id, studentId: student.stu_id }, // Pass IDs in params
                  state: {
                    studentName: student.stu_name,
                    subcourseName: subcourse?.course_name,
                  }, // Pass extra info via state
                }"
                class="link link-hover link-primary"
                :title="
                  isTeacher
                    ? $t('stu.view_student_timeline')
                    : $t('stu.view_your_timeline')
                "
              >
                {{ student.stu_name }}
              </router-link>
              <span v-else>
                {{ student.stu_name }}
              </span>
            </td>
            <td class="text-center">
              <!-- Make seat clickable for teachers -->
              <button
                v-if="isTeacher"
                @click="openSeatModal(student)"
                class="btn btn-xs btn-ghost"
                :title="$t('stu.change_seat')"
              >
                {{ student.seat ?? "-" }}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-3 w-3 ml-1 inline-block"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <span v-else>
                {{ student.seat ?? "-" }}
              </span>
            </td>
            <td v-if="isTeacher" class="whitespace-nowrap">
              <div class="flex gap-1 items-center justify-start">
                <button
                  class="btn btn-xs btn-ghost text-error"
                  :title="$t('stu.remove_student_from_group')"
                  @click="openRemoveConfirm(student)"
                  :disabled="isRemovingStudent"
                  :class="{
                    loading:
                      isRemovingStudent &&
                      studentToRemove?.stu_id === student.stu_id,
                  }"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
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
    <!-- Remove Student Confirmation Modal -->
    <ConfirmDialog
      :show="showRemoveConfirmDialog"
      dialogId="student_remove_confirm_modal"
      :title="$t('stu.remove_student')"
      :message="removeConfirmationMessage"
      confirmButtonClass="btn-error"
      @confirm="handleRemoveStudent"
      @close="closeRemoveConfirm"
    />
    <!-- Change Seat Modal -->
    <dialog id="change_seat_modal" class="modal" :open="showSeatModal">
      <div class="modal-box">
        <h3 class="font-bold text-lg">
          {{ $t("stu.change_seat_for", { name: studentToEditSeat?.stu_name }) }}
        </h3>
        <p class="py-2 text-sm text-base-content text-opacity-80">
          {{ $t("stu.student_id") }}: {{ studentToEditSeat?.stu_id }}
        </p>

        <div class="form-control w-full max-w-xs py-4">
          <label class="label" for="seat_input">
            <span class="label-text">{{ $t("stu.new_seat_number") }}</span>
          </label>
          <input
            id="seat_input"
            type="number"
            placeholder="Enter seat number"
            class="input input-bordered w-full"
            v-model.number="newSeatValue"
            @keyup.enter="handleSaveSeat"
            ref="seatInputRef"
          />
          <label class="label" v-if="seatInputError">
            <span class="label-text-alt text-error">{{ seatInputError }}</span>
          </label>
        </div>

        <div v-if="seatSaveError" class="alert alert-error text-sm p-2 my-2">
          <span
            >{{ $t("stu.failed_to_save_seat") }}:
            {{ seatSaveError.message || seatSaveError }}</span
          >
        </div>

        <div class="modal-action">
          <button
            class="btn btn-primary"
            @click="handleSaveSeat"
            :disabled="isSavingSeat"
            :class="{ loading: isSavingSeat }"
          >
            {{ $t("stu.save_seat") }}
          </button>
          <button
            class="btn btn-ghost"
            @click="closeSeatModal"
            :disabled="isSavingSeat"
          >
            {{ $t("button.cancel") }}
          </button>
        </div>
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="closeSeatModal"
          :disabled="isSavingSeat"
        >
          ✕
        </button>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeSeatModal" :disabled="isSavingSeat">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick, watch } from "vue"; // Added watch
import { useRouter } from "vue-router";
import { getWeekdayName } from "@/utils/weekday";
import * as dataService from "@/services/dataService";
import { useAuthStore } from "@/stores/auth";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
// import { useLabroomStore } from '@/stores/labroom';
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// --- Props, Router, Stores ---
const props = defineProps({
  id: { type: [String, Number], required: true },
});
const router = useRouter();
const authStore = useAuthStore();

// --- Component State ---
const subcourse = ref(null);
const students = ref([]);
const isLoadingSubcourse = ref(false);
const isLoadingStudents = ref(true);
const subcourseError = ref(null);
const studentsError = ref(null);

// Remove Student State
const showRemoveConfirmDialog = ref(false);
const studentToRemove = ref(null);
const isRemovingStudent = ref(false);
const removeError = ref(null);

// Change Seat State
const showSeatModal = ref(false);
const studentToEditSeat = ref(null);
const newSeatValue = ref(null); // Keep as null for number type
const isSavingSeat = ref(false);
const seatSaveError = ref(null);
const seatInputError = ref(null);
const seatInputRef = ref(null); // Ref for the input element

// --- Computed ---
const isTeacher = computed(() => authStore.isTeacher || authStore.isAdmin);
const removeConfirmationMessage = computed(() => {
  if (!studentToRemove.value) return "Are you sure?";
  return t("stu.remove_confirm", {
    name: studentToRemove.value.stu_name,
    id: studentToRemove.value.stu_id,
  });
});

// --- Methods ---

// Data Fetching
const fetchSubcourseDetails = async () => {
  isLoadingSubcourse.value = true;
  subcourseError.value = null;
  try {
    const response = await dataService.getSubcourse(props.id);
    subcourse.value = response.data?.data || response.data;
  } catch (err) {
    console.error(`Failed to fetch subcourse details ${props.id}:`, err);
    subcourseError.value = err.response?.data || err;
  } finally {
    isLoadingSubcourse.value = false;
  }
};

const fetchStudents = async () => {
  isLoadingStudents.value = true;
  studentsError.value = null;
  students.value = [];
  try {
    const response = await dataService.getGroup(props.id);
    const fetchedData = response.data?.data || response.data || [];
    console.log(
      `Fetched ${fetchedData.length} students for group ${props.id}.`,
    ); // Basic log
    // Add more detailed key validation logs here if the "invalid character" error returns
    students.value = fetchedData;
  } catch (err) {
    console.error(`Failed to fetch students for group ${props.id}:`, err);
    studentsError.value = err.response?.data || err;
    students.value = [];
  } finally {
    isLoadingStudents.value = false;
  }
};

// Remove Student Logic
const openRemoveConfirm = (student) => {
  studentToRemove.value = student;
  showRemoveConfirmDialog.value = true;
};
const closeRemoveConfirm = () => {
  showRemoveConfirmDialog.value = false;
  studentToRemove.value = null;
  removeError.value = null;
};
const handleRemoveStudent = async () => {
  if (!studentToRemove.value || !isTeacher.value) return;
  isRemovingStudent.value = true;
  removeError.value = null;
  const subcourseId = props.id;
  const studentIdToRemove = studentToRemove.value.stu_id;
  try {
    await dataService.teacherRemove(subcourseId, studentIdToRemove);
    closeRemoveConfirm();
    await fetchStudents();
  } catch (err) {
    console.error(`Failed to remove student ${studentIdToRemove}:`, err);
    removeError.value = err.response?.data || err;
    alert(
      `Failed to remove student: ${removeError.value?.error || "Unknown error"}`,
    );
    closeRemoveConfirm();
  } finally {
    isRemovingStudent.value = false;
  }
};

// Change Seat Logic
const openSeatModal = (student) => {
  studentToEditSeat.value = student;
  newSeatValue.value = typeof student.seat === "number" ? student.seat : null;
  seatSaveError.value = null;
  seatInputError.value = null;
  showSeatModal.value = true; // Trigger the watch
};

const closeSeatModal = () => {
  showSeatModal.value = false;
  studentToEditSeat.value = null;
  newSeatValue.value = null;
  seatSaveError.value = null;
  seatInputError.value = null;
  isSavingSeat.value = false;
};

const handleSaveSeat = async () => {
  if (!studentToEditSeat.value || !isTeacher.value || isSavingSeat.value)
    return;
  seatSaveError.value = null;
  seatInputError.value = null;

  if (
    newSeatValue.value === null ||
    newSeatValue.value === undefined ||
    isNaN(newSeatValue.value)
  ) {
    seatInputError.value = "Please enter a valid seat number.";
    nextTick(() => {
      seatInputRef.value?.focus();
    });
    return;
  }

  const subcourseIdNumber = Number(props.id);
  if (isNaN(subcourseIdNumber)) {
    seatSaveError.value = "Internal error: Invalid group ID.";
    console.error("Subcourse ID prop is not a number:", props.id);
    return;
  }

  isSavingSeat.value = true;
  try {
    await dataService.setSeat(studentToEditSeat.value.id, newSeatValue.value);
    closeSeatModal();
    await fetchStudents();
  } catch (err) {
    console.error(
      `Failed to update seat for student ${studentToEditSeat.value.stu_name}:`,
      err,
    );
    seatSaveError.value =
      err.response?.data?.error || "An unknown error occurred";
    alert(`Failed to update seat: ${seatSaveError.value}`);
  } finally {
    isSavingSeat.value = false;
  }
};

// Navigation
const goBack = () => {
  router.back();
};

watch(showSeatModal, (isShowing) => {
  if (isShowing) {
    // Wait for the DOM update triggered by showSeatModal = true
    nextTick(() => {
      // Check if the ref is populated before focusing
      if (seatInputRef.value) {
        seatInputRef.value.focus();
      } else {
        console.warn("Seat input ref not available in watch/nextTick");
      }
    });
  }
});

// --- Lifecycle Hooks ---
onMounted(() => {
  fetchSubcourseDetails();
  fetchStudents();
});
</script>

<style scoped>
/* Make the clickable seat look more like a button */
td button.btn-ghost {
  text-decoration: underline dotted; /* Subtle indication it's clickable */
  padding: 0.1rem 0.25rem; /* Fine-tune padding */
}
</style>
