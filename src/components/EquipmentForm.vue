<template>
  <form @submit.prevent="submitForm" class="space-y-4">
    <div class="form-control">
      <label class="label">
        <span class="label-text">{{ $t("equip.form.name") }}</span>
      </label>
      <input
        type="text"
        v-model="form.name"
        :placeholder="$t('equip.form.namePlaceholder')"
        class="input input-bordered w-full"
        required
      />
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">{{ $t("equip.form.serial") }}</span>
      </label>
      <input
        type="text"
        v-model="form.serial"
        :placeholder="$t('equip.form.serialPlaceholder')"
        class="input input-bordered w-full"
        required
      />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">{{ $t("equip.form.value") }}</span>
        </label>
        <input
          type="number"
          v-model.number="form.value"
          :placeholder="$t('equip.form.valuePlaceholder')"
          class="input input-bordered w-full"
          required
        />
      </div>
      <div class="form-control">
        <label class="label">
          <span class="label-text">{{ $t("equip.form.position") }}</span>
        </label>
        <input
          type="text"
          v-model="form.position"
          :placeholder="$t('equip.form.positionPlaceholder')"
          class="input input-bordered w-full"
          required
        />
      </div>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">{{ $t("equip.form.status") }}</span>
      </label>
      <select
        v-model.number="form.status"
        class="select select-bordered w-full"
      >
        <option :value="0">{{ $t("equip.status.available") }}</option>
        <option :value="1">{{ $t("equip.status.borrowed") }}</option>
        <option :value="2">{{ $t("equip.status.maintenance") }}</option>
        <option :value="3">{{ $t("equip.status.decommissioned") }}</option>
      </select>
    </div>

    <div class="form-control">
      <label class="label">
        <span class="label-text">{{ $t("equip.form.note") }}</span>
      </label>
      <textarea
        v-model="form.note"
        class="textarea textarea-bordered h-24"
        :placeholder="$t('equip.form.notePlaceholder')"
      ></textarea>
    </div>

    <div class="modal-action">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">
        {{ $t("button.cancel") }}
      </button>
      <button type="submit" class="btn btn-primary">
        {{ $t("button.save") }}
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["save", "close"]);

const form = ref({});

const defaultFormState = () => ({
  id: 0,
  name: "",
  serial: "",
  value: 0,
  position: "",
  status: 0,
  note: "",
});

watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      form.value = { ...newData, status: Number(newData.status || 0) };
    } else {
      form.value = defaultFormState();
    }
  },
  { immediate: true, deep: true },
);

const submitForm = () => {
  emit("save", { ...form.value });
};
</script>
