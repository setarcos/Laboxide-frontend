<template>
  <!-- The parent div needs to be a positioning context for the absolute-positioned events -->
  <div class="relative bg-base-100 rounded-box shadow overflow-x-auto">
    <table class="table table-fixed w-full border-collapse">
      <thead>
        <tr>
          <!-- Header for the time column -->
          <th
            class="w-24 border p-2 text-center bg-base-200 z-20 sticky left-0"
          >
            Time
          </th>
          <!-- Headers for each day of the week -->
          <th
            v-for="day in weekDays"
            :key="day.toISOString()"
            class="border p-2 text-center bg-base-200"
          >
            <div>{{ format(day, "E") }}</div>
            <div class="font-normal text-sm">{{ format(day, "MMM d") }}</div>
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
          <!-- The empty cells that form the grid. They are now just placeholders. -->
          <td
            v-for="day in weekDays"
            :key="day.toISOString()"
            class="border p-0.5 align-top relative hover:bg-base-200/50 group"
            @click="
              emit('book-slot', { date: format(day, 'yyyy-MM-dd'), time })
            "
          >
            <!-- The empty cell itself is the click-to-book target -->
            <div class="h-full w-full hover:bg-base-200/50 group"></div>
          </td>
        </tr>
        <div
          v-for="agenda in props.agendas"
          :key="agenda.id"
          class="absolute z-10 p-1.5 rounded-lg text-xs leading-tight flex flex-col overflow-hidden"
          :class="{
            'bg-primary/80 text-primary-content backdrop-blur-sm':
              agenda.confirm,
            'bg-warning/80 text-warning-content backdrop-blur-sm border-2 border-dashed border-base-content/30':
              !agenda.confirm,
            'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-secondary':
              canEdit(agenda),
          }"
          :style="getAgendaStyle(agenda)"
          @click.stop="emit('view-agenda', agenda)"
        >
          <p class="font-bold truncate">{{ agenda.title }}</p>
          <p class="truncate">{{ agenda.username }}</p>
          <p v-if="!agenda.confirm" class="text-xs italic mt-auto">(Pending)</p>
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
/* We use a higher z-index on the header to ensure it stays above the events when scrolling */
thead th {
  z-index: 30;
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
const endHour = 18;

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

// --- CORE POSITIONING LOGIC ---
const getAgendaStyle = (agenda) => {
  // Find which day column the event belongs to
  const agendaDay = getAgendaDay(agenda);
  if (agendaDay === -1) {
    // If the event is not in the current week, don't render it.
    return { display: "none" };
  }

  // Calculate vertical position (top) and height
  const startTime = parseISO(`2000-01-01T${agenda.start_time}`);
  const minutesFromStartOfDay =
    (startTime.getHours() - startHour) * 60 + startTime.getMinutes();
  const top = `calc(${minutesFromStartOfDay / 60} * ${rowHeight})`;

  const endTime = parseISO(`2000-01-01T${agenda.end_time}`);
  const durationMinutes = differenceInMinutes(endTime, startTime);
  const height = `calc(${durationMinutes / 60} * ${rowHeight})`;

  // Calculate horizontal position (left) and width
  const left = `calc(${timeHeaderWidth} + ${agendaDay} * ${dayColumnWidth})`;
  const width = dayColumnWidth;

  return {
    top,
    height,
    left,
    width,
  };
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
      const isWithinDateRange =
        isBefore(day, agendaKeyDate) || isEqual(day, agendaKeyDate);
      if (isCorrectDayOfWeek && isWithinDateRange) return i;
    }
  }
  return -1; // Not in this week
};
</script>
