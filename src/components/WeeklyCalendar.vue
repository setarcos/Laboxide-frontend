<template>
  <div class="relative bg-base-100 rounded-box shadow overflow-x-auto z-0">
    <table class="table table-fixed w-full border-collapse">
      <thead>
        <tr>
          <!-- Header for the time column -->
          <th
            class="w-24 border p-2 text-center bg-base-200 z-20 sticky left-0"
          >
            {{ $t("meeting.time") }}
          </th>
          <!-- Headers for each day of the week -->
          <th
            v-for="day in weekDays"
            :key="day.toISOString()"
            class="border p-2 text-center bg-base-200"
          >
            <div>{{ format(day, "EEE", { locale: localeObject }) }}</div>
            <div class="font-normal text-sm">
              {{ format(day, "MMM d", { locale: localeObject }) }}
            </div>
          </th>
        </tr>
      </thead>
      <tbody class="relative">
        <!-- Each row represents a time slot -->
        <tr v-for="time in timeSlots" :key="time">
          <!-- The time label cell -->
          <td
            class="border p-2 text-center font-mono text-sm bg-base-200 h-20 z-20 sticky left-0"
          >
            {{ time }}
          </td>
          <!-- The empty cells that form the grid. -->
          <td
            v-for="day in weekDays"
            :key="day.toISOString()"
            class="border p-0.5 align-top relative"
            @click="
              emit('book-slot', { date: format(day, 'yyyy-MM-dd'), time })
            "
          >
            <div
              class="h-full w-full hover:bg-base-200/50 transition-colors duration-200"
            ></div>
          </td>
        </tr>

        <!-- Positioned Agenda Items -->
        <div
          v-for="agenda in props.agendas"
          :key="agenda.id"
          class="absolute z-10 p-1.5 rounded-md text-xs leading-tight flex flex-col overflow-hidden box-border"
          :class="getAgendaClasses(agenda)"
          :style="getAgendaStyle(agenda)"
          @click.stop="emit('view-agenda', agenda)"
        >
          <p class="font-bold truncate">{{ agenda.title }}</p>
          <p class="truncate">{{ agenda.username }}</p>
          <p v-if="!agenda.confirm" class="text-xs italic mt-auto">
            {{ $t("meeting.pending") }}
          </p>
        </div>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Making the time column sticky for better scrolling is a nice UX touch. */
th.sticky,
td.sticky {
  position: sticky;
  left: 0;
}
/* Make the click target more obvious on hover */
td:hover {
  cursor: pointer;
}
</style>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import { PERMISSION_MEETING_MANAGER } from "@/utils/permissions";
import {
  format,
  startOfWeek,
  addDays,
  getDay,
  parseISO,
  isBefore,
  isEqual,
  differenceInMinutes,
} from "date-fns";
import { useI18n } from "vue-i18n";
import { enUS, zhCN } from "date-fns/locale";

const { locale } = useI18n();
const localeObject = computed(() => (locale.value === "zh" ? zhCN : enUS));

const props = defineProps({
  agendas: { type: Array, required: true },
  currentDate: { type: Date, required: true },
});

const emit = defineEmits(["book-slot", "view-agenda"]);
const authStore = useAuthStore();

// --- CONFIGURATION ---
const weekStartsOn = 1; // 1 for Monday
const timeHeaderWidth = "6rem"; // 96px, must match `w-24` class
const dayColumnWidth = `calc((100% - ${timeHeaderWidth}) / 7)`;
const rowHeight = "5rem"; // 80px, must match `h-20` class on time cell
const startHour = 8;
const endHour = 23;

// --- COMPUTED PROPERTIES ---
const timeSlots = computed(() => {
  const slots = [];
  for (let i = startHour; i < endHour; i++) {
    slots.push(`${String(i).padStart(2, "0")}:00`);
  }
  return slots;
});

const weekDays = computed(() => {
  const start = startOfWeek(props.currentDate, { weekStartsOn });
  return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
});

// --- HELPER FUNCTIONS ---
const canEdit = (agenda) => {
  if (!agenda || !authStore.user) return false;
  return (
    agenda.userid === authStore.user.userId ||
    authStore.hasPermission(PERMISSION_MEETING_MANAGER)
  );
};

// --- STYLING LOGIC ---
const getAgendaClasses = (agenda) => {
  const classes = {
    "cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-secondary":
      canEdit(agenda),
  };
  if (agenda.confirm) {
    return {
      ...classes,
      "bg-primary/20 text-gray-800 dark:text-gray-200 border-l-4 border-primary": true,
    };
  } else {
    return {
      ...classes,
      "bg-warning/20 text-gray-800 dark:text-gray-200 border-l-4 border-warning": true,
    };
  }
};

const getAgendaStyle = (agenda) => {
  const agendaDay = getAgendaDay(agenda);
  if (agendaDay === -1) {
    return { display: "none" };
  }

  const startTime = parseISO(`2000-01-01T${agenda.start_time}`);
  const minutesFromStartOfDay =
    (startTime.getHours() - startHour) * 60 + startTime.getMinutes();
  const top = `calc(${minutesFromStartOfDay / 60} * ${rowHeight})`;

  const endTime = parseISO(`2000-01-01T${agenda.end_time}`);
  const durationMinutes = differenceInMinutes(endTime, startTime);
  const height = `calc((${durationMinutes / 60} * ${rowHeight}) - 1px)`;

  const left = `calc(${timeHeaderWidth} + ${agendaDay} * ${dayColumnWidth})`;
  const width = `calc(${dayColumnWidth} - 4px)`;

  return { top, height, left, width };
};

// Helper to find the column index (0-6) for an agenda item
const getAgendaDay = (agenda) => {
  for (let i = 0; i < weekDays.value.length; i++) {
    const day = weekDays.value[i];
    const agendaKeyDate = parseISO(agenda.date);

    if (agenda.repeat === 0) {
      if (isEqual(agendaKeyDate, day)) return i;
    }

    if (agenda.repeat === 1) {
      const repeatDayOfWeek = getDay(agendaKeyDate);
      const isCorrectDayOfWeek = getDay(day) === repeatDayOfWeek;
      const isAfterStart = !isBefore(day, agendaKeyDate);
      if (isCorrectDayOfWeek && isAfterStart) return i;
    }
  }
  return -1; // Not in this week
};
</script>
