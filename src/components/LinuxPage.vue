<template>
  <div class="space-y-6">
    <!-- Section for Linux User / SSH Key -->
    <div>
      <h2 class="text-xl font-semibold mb-2">{{ $t("linux.linuxTitle") }}</h2>
      <p class="text-sm text-gray-500 mb-4">{{ $t("linux.linuxSubtitle") }}</p>
      <textarea
        v-model="sshKey"
        class="textarea textarea-bordered w-full"
        :placeholder="$t('linux.enterSSHKey')"
        rows="4"
      ></textarea>
      <button
        class="btn btn-primary mt-2"
        @click="submitSSHKey"
        :disabled="isSshLoading || !sshKey"
      >
        <span
          v-if="isSshLoading"
          class="loading loading-spinner loading-sm"
        ></span>
        <span v-else>{{ $t("linux.submitSSHKey") }}</span>
      </button>
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Section for Git (Forgejo) User -->
    <div>
      <h2 class="text-xl font-semibold mb-2">{{ $t("linux.gitTitle") }}</h2>
      <p class="text-sm text-gray-500 mb-4">{{ $t("linux.gitSubtitle") }}</p>
      <div class="flex gap-4">
        <!-- Create Git User Button -->
        <button
          class="btn btn-secondary"
          @click="createGitUser"
          :disabled="isGitCreateLoading"
        >
          <span
            v-if="isGitCreateLoading"
            class="loading loading-spinner loading-sm"
          ></span>
          <span v-else>{{ $t("linux.createGitUser") }}</span>
        </button>

        <!-- Reset Git Password Button -->
        <button
          class="btn btn-accent"
          @click="resetGitPassword"
          :disabled="isGitResetLoading"
        >
          <span
            v-if="isGitResetLoading"
            class="loading loading-spinner loading-sm"
          ></span>
          <span v-else>{{ $t("linux.resetGitPassword") }}</span>
        </button>
      </div>
    </div>

    <!-- Unified Notification Area -->
    <div
      v-if="notification.message"
      class="alert shadow-sm text-sm"
      :class="{
        'alert-success': notification.type === 'success',
        'alert-error': notification.type === 'error',
      }"
    >
      <div>
        <span v-if="notification.type === 'success'">✅</span>
        <span v-if="notification.type === 'error'">⚠️</span>
        <span>{{ notification.message }}</span>
        <div
          v-if="notification.password"
          class="mt-2 font-mono bg-gray-200 text-gray-800 p-2 rounded"
        >
          <p>
            {{ $t("linux.yourNewPassword") }}:
            <code>{{ notification.password }}</code>
          </p>
          <p class="font-sans text-xs mt-1">
            {{ $t("linux.savePasswordWarning") }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import * as dataService from "@/services/dataService";

// State for SSH Key submission
const sshKey = ref("");
const isSshLoading = ref(false);

// State for Git user actions
const isGitCreateLoading = ref(false);
const isGitResetLoading = ref(false);

// Unified notification state
const notification = ref({
  type: null, // 'success' or 'error'
  message: null,
  password: null,
});

// Clear notification helper
const clearNotification = () => {
  notification.value = { type: null, message: null, password: null };
};

// --- METHODS ---

const submitSSHKey = async () => {
  isSshLoading.value = true;
  clearNotification();
  try {
    const cleanKey = sshKey.value.replace(/\r?\n|\r/g, "").trim();
    await dataService.addLinuxUser({ sshkey: cleanKey });
    notification.value = {
      type: "success",
      message: "SSH key submitted successfully!",
    };
  } catch (err) {
    notification.value = {
      type: "error",
      message:
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred.",
    };
  } finally {
    isSshLoading.value = false;
  }
};

const createGitUser = async () => {
  isGitCreateLoading.value = true;
  clearNotification();
  try {
    const response = await dataService.addForgejoUser();
    notification.value = {
      type: "success",
      message: response.data.message,
      password: response.data.password,
    };
  } catch (err) {
    notification.value = {
      type: "error",
      message:
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred.",
    };
  } finally {
    isGitCreateLoading.value = false;
  }
};

const resetGitPassword = async () => {
  isGitResetLoading.value = true;
  clearNotification();
  try {
    const response = await dataService.resetForgejoPassword();
    notification.value = {
      type: "success",
      message: response.data.message,
      password: response.data.password,
    };
  } catch (err) {
    notification.value = {
      type: "error",
      message:
        err.response?.data?.error ||
        err.message ||
        "An unexpected error occurred.",
    };
  } finally {
    isGitResetLoading.value = false;
  }
};
</script>
