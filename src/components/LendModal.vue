<template>
  <dialog id="lend_modal" class="modal" :open="show">
    <div class="modal-box w-11/12 max-w-md">
      <h3 class="font-bold text-lg">
        {{ $t("equip.lendModal.title", { name: equipmentName }) }}
      </h3>

      <form @submit.prevent="submit" class="py-4 space-y-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">{{
              $t("equip.lendModal.borrowerName")
            }}</span>
          </label>
          <input
            type="text"
            v-model="user"
            :placeholder="$t('equip.lendModal.borrowerNamePlaceholder')"
            class="input input-bordered w-full"
            required
            ref="userInput"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">{{
              $t("equip.lendModal.telephone")
            }}</span>
          </label>
          <input
            type="tel"
            v-model="telephone"
            :placeholder="$t('equip.lendModal.telephonePlaceholder')"
            class="input input-bordered w-full"
            required
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">{{ $t("equip.lendModal.note") }}</span>
          </label>
          <textarea
            v-model="note"
            class="textarea textarea-bordered h-20"
            :placeholder="$t('equip.lendModal.notePlaceholder')"
            required
          ></textarea>
        </div>

        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="close">
            {{ $t("button.cancel") }}
          </button>
          <button type="submit" class="btn btn-primary">
            {{ $t("button.confirm") }}
          </button>
        </div>
      </form>

      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="close"
      >
        ✕
      </button>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button @click="close">{{ $t("button.close") }}</button>
    </form>
  </dialog>
</template>

<script setup>
import { ref, watch, nextTick } from "vue";

const props = defineProps({
  show: Boolean,
  equipmentName: String,
});

const emit = defineEmits(["save", "close"]);

const user = ref("");
const telephone = ref("");
const note = ref("");
const userInput = ref(null);

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      user.value = "";
      telephone.value = "";
      note.value = "";
      nextTick(() => {
        userInput.value?.focus();
      });
    }
  },
);

const submit = () => {
  if (user.value.trim() && telephone.value.trim() && note.value.trim()) {
    emit("save", {
      user: user.value.trim(),
      telephone: telephone.value.trim(),
      note: note.value.trim(),
    });
  }
};

const close = () => {
  emit("close");
};
</script>
