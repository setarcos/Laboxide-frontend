<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">{{ $t("course.title") }}</h1>

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
        {{ $t("course.add") }}
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
        <span>Error loading courses: {{ error.message || error }}</span>
      </div>
    </div>

    <!-- Courses Table -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>{{ $t("course.name") }}</th>
            <th>{{ $t("course.id") }}</th>
            <th>{{ $t("course.credit") }}</th>
            <th>{{ $t("course.hours") }}</th>
            <th>{{ $t("course.term") }}</th>
            <th>{{ $t("course.teacher") }}</th>
            <th>{{ $t("course.op") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="courses.length === 0">
            <td colspan="6" class="text-center italic py-4">
              No courses found.
            </td>
          </tr>
          <tr v-for="course in courses" :key="course.id">
            <td>
              <router-link
                :to="{ name: 'CourseDetail', params: { id: course.id } }"
                class="link link-hover link-primary"
              >
                {{ course.name }} ({{ course.ename }})
              </router-link>
            </td>
            <td>{{ course.code.split(",")[0] }}</td>
            <td>{{ course.code.split(",")[1] }}</td>
            <td>{{ course.code.split(",")[2] }}</td>
            <td>
              {{
                course.term === 1 ? $t("course.spring") : course.term === 2 ? $t("course.fall") : $t("course.summer")
              }}
            </td>
            <td>{{ course.tea_name }}</td>
            <td>
              <div class="flex gap-1">
                <!-- Edit Button (Admin or Teacher - API check might be needed for specific course) -->
                <!-- Using Admin PUT for now, adjust if /teacher/course PUT has different fields -->
                <button
                  v-if="
                    authStore.isAdmin ||
                    (authStore.user && authStore.user.userId === course.tea_id)
                  "
                  class="btn btn-xs btn-ghost btn-circle"
                  title="Edit"
                  @click="openEditModal(course)"
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
                <!-- Delete Button (Admin only) -->
                <button
                  v-if="authStore.isAdmin"
                  class="btn btn-xs btn-ghost btn-circle text-error"
                  title="Delete"
                  @click="openDeleteModal(course)"
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
      id="course_modal"
      class="modal"
      :open="showAddModal || showEditModal"
    >
      <div class="modal-box w-11/12 max-w-2xl">
        <h3 class="font-bold text-lg">
          {{ isEditing ? $t("course.edit") : $t("course.add") }}
        </h3>
        <CourseForm
          :initial-data="currentItem"
          @save="handleSave"
          @close="closeModal"
          class="py-4"
        />
        <!-- Close button inside modal-box for accessibility -->
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
      dialogId="course_delete_confirm_modal"
      :title="$t('course.delete')"
      :message="`Are you sure you want to delete the course '${currentItem?.name}' (ID: ${currentItem?.id})? This action cannot be undone.`"
      @confirm="handleDelete"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import * as dataService from "@/services/dataService";
import CourseForm from "@/components/CourseForm.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";

const authStore = useAuthStore();

const courses = ref([]);
const isLoading = ref(true);
const error = ref(null);

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const currentItem = ref(null); // Holds the item being edited or deleted

const isEditing = computed(() => !!currentItem.value && showEditModal.value);

const fetchCourses = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await dataService.getCourses();
    courses.value = response.data;
  } catch (err) {
    console.error("Failed to fetch courses:", err);
    error.value = err.response?.data || err;
  } finally {
    isLoading.value = false;
  }
};

const openAddModal = () => {
  currentItem.value = null; // Ensure no initial data for add form
  showAddModal.value = true;
};

const openEditModal = (course) => {
  currentItem.value = { ...course }; // Copy course data to avoid direct mutation
  showEditModal.value = true;
};

const openDeleteModal = (course) => {
  currentItem.value = course;
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
      // Admin Edit API
      if (authStore.isAdmin)
        await dataService.updateCourse(currentItem.value.id, formData);
      else
        await dataService.teacherUpdateCourse(currentItem.value.id, formData);
      // Add logic here if you need to distinguish Teacher edit (teacherUpdateCourse)
    } else {
      // Create API
      await dataService.createCourse(formData);
    }
    closeModal();
    await fetchCourses(); // Refresh list
    // TODO: Add success notification (e.g., using a toast library)
  } catch (err) {
    console.error("Failed to save course:", err);
    error.value = `Failed to save: ${err.response?.data?.error || err.message}`; // Show error to user
    // TODO: Add error notification
  }
};

const handleDelete = async () => {
  if (!currentItem.value) return;
  try {
    await dataService.deleteCourse(currentItem.value.id);
    closeModal();
    await fetchCourses(); // Refresh list
    // TODO: Add success notification
  } catch (err) {
    console.error("Failed to delete course:", err);
    error.value = `Failed to delete: ${err.response?.data?.error || err.message}`; // Show error to user
    // TODO: Add error notification
    closeModal(); // Close confirm dialog even on error
  }
};

onMounted(fetchCourses);
</script>

<style scoped>
/* Scoped styles for the view */
.modal {
  display: grid; /* Use grid to allow opening via :open */
  place-items: center;
}
</style>
