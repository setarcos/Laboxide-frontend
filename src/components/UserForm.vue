<template>
  <form @submit.prevent="submitForm" class="space-y-4 p-2">
    <div>
      <label class="label" for="user-id">
        <span class="label-text">{{ $t("user.userIdLabel") }}</span>
      </label>
      <!-- Disable user_id field when editing -->
      <input
        id="user-id"
        type="text"
        v-model="formData.user_id"
        :placeholder="$t('user.userIdPlaceholder')"
        class="input input-bordered w-full"
        :disabled="isEditing"
        required
      />
      <p v-if="isEditing" class="text-xs text-base-content/60 mt-1">
        {{ $t("user.userIdImmutable") }}
      </p>
    </div>

    <div>
      <label class="label" for="user-username">
        <span class="label-text">{{ $t("user.realNameLabel") }}</span>
      </label>
      <input
        id="user-username"
        type="text"
        v-model="formData.username"
        :placeholder="$t('user.realNamePlaceholder')"
        class="input input-bordered w-full"
        required
      />
    </div>

    <div>
      <span class="label label-text">{{ $t("user.permissions") }}</span>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              :checked="hasPermission(PERMISSION_ADMIN)"
              @change="togglePermission(PERMISSION_ADMIN)"
              class="checkbox checkbox-primary"
            />
            <span class="label-text">{{ $t("user.roleAdmin") }}</span>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              :checked="hasPermission(PERMISSION_MEETING_MANAGER)"
              @change="togglePermission(PERMISSION_MEETING_MANAGER)"
              class="checkbox checkbox-primary"
            />
            <span class="label-text">{{ $t("user.roleMeetingManager") }}</span>
          </label>
        </div>
        <div class="form-control">
          <label class="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              :checked="hasPermission(PERMISSION_LAB_MANAGER)"
              @change="togglePermission(PERMISSION_LAB_MANAGER)"
              class="checkbox checkbox-primary"
            />
            <span class="label-text">{{ $t("user.roleLabManager") }}</span>
          </label>
        </div>
      </div>
      <p class="text-xs text-base-content/60 mt-1">
        {{ $t("user.currentPermission") }}: {{ formData.permission }}
      </p>
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        {{ $t("button.cancel") }}
      </button>
      <button type="submit" class="btn btn-primary">
        {{ $t("user.saveUser") }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import {
  PERMISSION_ADMIN,
  PERMISSION_LAB_MANAGER,
  PERMISSION_MEETING_MANAGER,
} from "@/utils/permissions";

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["save", "close"]);

const isEditing = computed(() => !!props.initialData?.user_id);

const defaultFormData = {
  user_id: "",
  username: "",
  permission: 0, // Default to no permissions
};

const formData = ref({ ...defaultFormData });

// Watch for changes in initialData
watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      // Ensure permission is a number
      formData.value = {
        ...newData,
        permission: Number(newData.permission) || 0,
      };
    } else {
      formData.value = { ...defaultFormData };
    }
  },
  { immediate: true },
);

// --- Permission Checkbox Logic ---
const hasPermission = (perm) => {
  // Ensure formData.permission is treated as a number
  const currentPerm = Number(formData.value.permission) || 0;
  return (currentPerm & perm) === perm;
};

const togglePermission = (perm) => {
  // Ensure formData.permission is treated as a number
  const currentPerm = Number(formData.value.permission) || 0;
  if (hasPermission(perm)) {
    // Remove permission (using bitwise XOR)
    formData.value.permission = currentPerm ^ perm;
  } else {
    // Add permission (using bitwise OR)
    formData.value.permission = currentPerm | perm;
  }
};
// --- End Permission Logic ---

const submitForm = () => {
  if (formData.value.user_id && formData.value.username) {
    // Ensure permission is an integer before sending
    const dataToSave = {
      ...formData.value,
      permission: parseInt(formData.value.permission, 10) || 0,
    };
    // For updates, the API uses PUT /admin/user/{id}, where {id} is the user_id.
    // For create, the API uses POST /admin/user.
    // We send the whole object; the service call uses the correct endpoint/method.
    emit("save", dataToSave);
  } else {
    alert("Please fill in User ID and Real Name.");
  }
};
</script>
