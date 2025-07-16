<template>
  <div class="relative bg-base-100 rounded-box shadow overflow-hidden">
    <!-- Calendar View -->
    <div v-if="viewMode === 'calendar'" class="overflow-x-auto z-0">
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

    <!-- List View -->
    <div v-else-if="viewMode === 'list'" class="overflow-x-auto">
      <div
        v-if="sortedAgendas.length === 0"
        class="text-center py-8 text-gray-500"
      >
        {{ $t("meeting.no_meetings") }}
      </div>

      <div v-else class="p-4">
        <div
          v-for="agenda in sortedAgendas"
          :key="agenda.id + agenda.date"
          class="flex items-center justify-between py-2 px-3 hover:bg-base-200 rounded-lg transition-colors duration-200 cursor-pointer mb-1"
          @click="emit('view-agenda', agenda)"
        >
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <!-- Date -->
            <div
              class="flex flex-col items-center text-sm font-mono w-16 flex-shrink-0"
            >
              <span class="text-xs text-gray-500">{{
                format(parseISO(agenda.displayDate), "MMM d", {
                  locale: localeObject,
                })
              }}</span>
            </div>

            <!-- Time -->
            <div class="text-sm font-mono text-gray-600 w-20 flex-shrink-0">
              {{ agenda.start_time.slice(0, 5) }}
            </div>

            <!-- Title and User -->
            <div class="flex-1 min-w-0">
              <span class="font-medium truncate">{{ agenda.title }}</span>
              <span class="text-gray-500 ml-2 text-sm">{{
                agenda.username
              }}</span>
            </div>

            <!-- Status and Indicators -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span
                v-if="agenda.repeat === 1"
                class="text-xs text-gray-400"
                title="Recurring"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </span>
              <span v-if="!agenda.confirm" class="badge badge-warning badge-xs">
                {{ $t("meeting.pending") }}
              </span>
              <span v-else class="badge badge-primary badge-xs">
                {{ $t("meeting.confirmed") }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
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
  viewMode: { type: String, required: true }, // 'calendar' or 'list'
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

// Sort agendas for list view - one line per event
const sortedAgendas = computed(() => {
  const agendas = [];

  props.agendas.forEach((agenda) => {
    const agendaDate = parseISO(agenda.date);

    if (agenda.repeat === 0) {
      // Non-repeating agenda
      agendas.push({
        ...agenda,
        displayDate: agenda.date,
      });
    } else if (agenda.repeat === 1) {
      // Repeating agenda - show for current week
      const repeatDayOfWeek = getDay(agendaDate);
      weekDays.value.forEach((day) => {
        if (getDay(day) === repeatDayOfWeek && !isBefore(day, agendaDate)) {
          agendas.push({
            ...agenda,
            displayDate: format(day, "yyyy-MM-dd"),
          });
        }
      });
    }
  });

  // Sort by date and time
  return agendas.sort((a, b) => {
    const dateCompare = a.displayDate.localeCompare(b.displayDate);
    if (dateCompare !== 0) return dateCompare;
    return a.start_time.localeCompare(b.start_time);
  });
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
