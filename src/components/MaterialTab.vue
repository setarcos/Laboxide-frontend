// src/components/CourseMaterialsTab.vue
<template>
  <div>
    <!-- Upload Section (Teacher Only) -->
    <div v-if="isTeacher" class="mb-6 p-3 bg-base-200 rounded-lg shadow">
      <div class="form-control w-full mb-2">
        <label class="label py-1" for="file-description">
          <span class="label-text text-sm">{{ $t("course.newfile") }}</span>
        </label>
        <input
          id="file-description"
          type="text"
          placeholder="Brief description of the file"
          class="input input-bordered w-full input-sm"
          v-model="fileDescription"
        />
      </div>

      <div class="flex items-center gap-2 mt-1">
        <input
          id="course-file"
          type="file"
          ref="fileInputRef"
          class="file-input file-input-bordered file-input-primary file-input-sm w-full max-w-xs flex-grow"
          @change="handleFileSelect"
        />
        <button
          class="btn btn-sm btn-primary"
          @click="handleUpload"
          :disabled="!selectedFile || !fileDescription || isUploading"
        >
          <span
            v-if="isUploading"
            class="loading loading-spinner loading-xs"
          ></span>
          {{ isUploading ? "..." : $t("button.upload") }}
        </button>
      </div>

      <p v-if="uploadError" class="text-error text-xs mt-1">
        {{ uploadError }}
      </p>
      <p v-if="uploadSuccess" class="text-success text-xs mt-1">Uploaded!</p>
    </div>

    <!-- Loading Files State -->
    <div v-if="isLoading" class="text-center py-10">
      <span class="loading loading-lg loading-spinner text-primary"></span>
      <p class="mt-2">Loading materials...</p>
    </div>

    <!-- Error Fetching Files State -->
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
        <span>Error loading materials: {{ error.message || error }}</span>
      </div>
    </div>

    <!-- Files Table -->
    <div v-else class="overflow-x-auto bg-base-100 rounded-box shadow-md">
      <table class="table table-zebra w-full">
        <thead>
          <tr>
            <th>{{ $t("course.filename") }}</th>
            <th>{{ $t("course.filedesc") }}</th>
            <!-- Add other relevant headers if backend provides (e.g., upload date) -->
            <th>{{ $t("course.op") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="files.length === 0">
            <td colspan="3" class="text-center italic py-4">
              No materials uploaded for this course yet.
            </td>
          </tr>
          <tr v-for="file in files" :key="file.id">
            <td>
              <!-- Direct download link -->
              <a
                :href="getDownloadUrl(file.id)"
                :download="file.fname"
                class="link link-hover link-primary"
                target="_blank"
                rel="noopener noreferrer"
                :title="`Download ${file.fname}`"
              >
                {{ file.fname }}
              </a>
            </td>
            <td>{{ file.finfo || "-" }}</td>
            <td>
              <div class="flex gap-1">
                <!-- Download Button (Alternative) -->
                <a
                  :href="getDownloadUrl(file.id)"
                  :download="file.fname"
                  class="btn btn-xs btn-ghost btn-circle"
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-4 h-4"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                </a>
                <!-- Delete Button (Teacher Only) -->
                <button
                  v-if="isTeacher"
                  class="btn btn-xs btn-ghost btn-circle text-error"
                  title="Delete"
                  @click="openDeleteModal(file)"
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

    <!-- Confirm Delete Modal -->
    <ConfirmDialog
      :show="showDeleteModal"
      dialogId="coursefile_delete_confirm_modal"
      :title="$t('course.delete_modal_title')"
      :message="
        $t('course.delete_modal_message', { title: fileToDelete?.fname })
      "
      @confirm="handleDeleteConfirm"
      @close="closeDeleteModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import * as dataService from "@/services/dataService";
import ConfirmDialog from "@/components/ConfirmDialog.vue"; // Use your existing dialog

const props = defineProps({
  courseId: {
    type: Number,
    required: true,
  },
});

const authStore = useAuthStore();

const files = ref([]);
const isLoading = ref(true);
const error = ref(null);

// Upload state
const fileInputRef = ref(null); // Ref for the file input element
const selectedFile = ref(null);
const fileDescription = ref("");
const isUploading = ref(false);
const uploadError = ref(null);
const uploadSuccess = ref(false);

// Delete state
const showDeleteModal = ref(false);
const fileToDelete = ref(null);

const isTeacher = computed(() => authStore.isTeacher);

// Fetch course files logic
const fetchFiles = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await dataService.listCourseFiles(props.courseId);
    files.value = response.data || [];
  } catch (err) {
    console.error("Failed to fetch course files:", err);
    error.value = err.response?.data || err;
    files.value = []; // Clear on error
  } finally {
    isLoading.value = false;
  }
};

// Handle file selection from input
const handleFileSelect = (event) => {
  const fileList = event.target.files;
  if (fileList && fileList.length > 0) {
    selectedFile.value = fileList[0];
    uploadError.value = null; // Clear previous error on new selection
    uploadSuccess.value = false;
  } else {
    selectedFile.value = null;
  }
};

// Handle file upload
const handleUpload = async () => {
  if (!selectedFile.value || !fileDescription.value || !props.courseId) {
    uploadError.value = "Please select a file and provide a description.";
    return;
  }

  isUploading.value = true;
  uploadError.value = null;
  uploadSuccess.value = false;

  const formData = new FormData();
  formData.append("file", selectedFile.value); // Key must match backend ('file')
  formData.append("finfo", fileDescription.value); // Key must match backend ('finfo')
  formData.append("course_id", props.courseId.toString()); // Key must match backend ('course_id')

  try {
    await dataService.uploadCourseFile(formData);
    uploadSuccess.value = true;
    // Clear inputs after successful upload
    fileDescription.value = "";
    selectedFile.value = null;
    if (fileInputRef.value) {
      fileInputRef.value.value = ""; // Clear the file input visually
    }
    await fetchFiles(); // Refresh the list
    // Hide success message after a few seconds
    setTimeout(() => {
      uploadSuccess.value = false;
    }, 3000);
  } catch (err) {
    console.error("Failed to upload file:", err);
    uploadError.value = `Upload failed: ${err.response?.data?.error || err.message}`;
  } finally {
    isUploading.value = false;
  }
};

// --- Delete Operations ---
const openDeleteModal = (file) => {
  fileToDelete.value = file;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  fileToDelete.value = null;
};

const handleDeleteConfirm = async () => {
  if (!fileToDelete.value) return;

  try {
    await dataService.deleteCourseFile(fileToDelete.value.id);
    closeDeleteModal();
    await fetchFiles(); // Refresh the list
    // TODO: Add success notification (optional)
  } catch (err) {
    console.error("Failed to delete file:", err);
    // Display error to user (e.g., as toast or alert)
    alert(`Failed to delete: ${err.response?.data?.error || err.message}`);
    // Keep modal open or close on error? Closing for now.
    closeDeleteModal();
  }
};

// Helper to construct download URL
const getDownloadUrl = (fileId) => {
  // Adjust the base path '/api' if your API is served elsewhere
  // Ensure your backend download route is GET /coursefile/download/{id}
  // This avoids exposing potential API keys if using api.defaults.baseURL directly
  const baseApiUrl = "/api"; // Or process.env.VUE_APP_API_BASE_URL if configured
  return `${baseApiUrl}/member/coursefile/download/${fileId}`;
};

// --- Lifecycle Hook ---
onMounted(() => {
  fetchFiles();
});
</script>

<style scoped>
/* Add specific styles if needed */
</style>
