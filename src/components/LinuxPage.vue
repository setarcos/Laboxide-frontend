<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">{{ $t("linux.linuxTitle") }}</h2>

    <textarea
      v-model="sshKey"
      class="textarea textarea-bordered w-full"
      :placeholder="$t('linux.enterSSHKey')"
      rows="4"
    ></textarea>

    <button
      class="btn btn-primary"
      @click="submitSSHKey"
      :disabled="isLoading || !sshKey"
    >
      <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
      <span v-else>{{ $t("linux.submitSSHKey") }}</span>
    </button>

    <div v-if="error" class="alert alert-error shadow-sm text-sm">
      ⚠️ {{ $t("linux.sshError") }}: {{ error }}
    </div>

    <div v-if="result" class="alert alert-success shadow-sm text-sm">
      ✅ {{ $t("linux.sshSuccess") }}
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import * as dataService from "@/services/dataService";

const sshKey = ref("");
const isLoading = ref(false);
const error = ref(null);
const result = ref(null);

const submitSSHKey = async () => {
  isLoading.value = true;
  error.value = null;
  result.value = null;
  try {
    const cleanKey = sshKey.value.replace(/\r?\n|\r/g, "").trim(); // one-line
    await dataService.addLinuxUser({ sshkey: cleanKey });
    result.value = "Success";
  } catch (err) {
    error.value =
      err.response?.data?.message || err.message || "Unexpected error occurred";
  } finally {
    isLoading.value = false;
  }
};
</script>
