<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Back Button -->
    <div class="mb-6">
      <button @click="goBack" class="btn btn-ghost">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-5 h-5 mr-2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        {{ $t("message.back") }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-20">
      <span class="loading loading-lg loading-spinner text-primary"></span>
      <p class="mt-2">Loading course details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error shadow-lg max-w-xl mx-auto">
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
        <span>Error loading course details: {{ error.message || error }}</span>
      </div>
    </div>

    <!-- Course Content Area (only renders if course loaded successfully) -->
    <div v-else-if="course" class="max-w-4xl mx-auto">
      <!-- Course Title (remains above tabs) -->
      <h1 class="text-3xl font-bold mb-6">
        {{ course.name }}
        <span v-if="course.ename" class="text-xl text-gray-500"
          >({{ course.ename }})</span
        >
      </h1>

      <!-- Tab Navigation -->
      <div class="tabs tabs-boxed mb-6 bg-base-200">
        <a
          class="tab tab-lg"
          :class="{ 'tab-active': activeTab === 'details' }"
          @click.prevent="setActiveTab('details')"
        >
          {{ $t("course.detail") }}
        </a>
        <a
          class="tab tab-lg"
          :class="{ 'tab-active': activeTab === 'schedule' }"
          @click.prevent="setActiveTab('schedule')"
        >
          {{ $t("course.schedule") }}
        </a>
        <a
          class="tab tab-lg"
          :class="{ 'tab-active': activeTab === 'materials' }"
          @click.prevent="setActiveTab('materials')"
        >
          {{ $t("course.material") }}
        </a>
        <a
          class="tab tab-lg"
          :class="{ 'tab-active': activeTab === 'subcourse' }"
          @click.prevent="setActiveTab('subcourse')"
        >
          {{ $t("course.subcourse") }}
        </a>
      </div>

      <!-- Tab Content -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body min-h-[400px]">
          <!-- Details Tab Content -->
          <div v-if="activeTab === 'details'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
              <div>
                <p class="font-semibold text-sm text-gray-500">{{ $t("course.id") }}</p>
                <p class="text-lg">{{ course.code.split(",")[0] }}</p>
              </div>
              <div>
                <p class="font-semibold text-sm text-gray-500">{{ $t("course.credit") }}</p>
                <p class="text-lg">{{ course.code.split(",")[1] }}</p>
              </div>
              <div>
                <p class="font-semibold text-sm text-gray-500">{{ $t("course.hours") }}</p>
                <p class="text-lg">{{ course.code.split(",")[2] }}</p>
              </div>
              <div>
                <p class="font-semibold text-sm text-gray-500">{{ $t("course.term") }}</p>
                <p class="text-lg">
                  {{
                    course.term === "1"
                    ? $t("course.spring")
                      : course.term === "2"
                        ? $t("course.fall")
                        : $t("course.summer")
                  }}
                </p>
              </div>
              <div>
                <p class="font-semibold text-sm text-gray-500">{{ $t("course.teacher") }}</p>
                <p class="text-lg">{{ course.tea_name }}</p>
              </div>
              <div>
                <p class="font-semibold text-sm text-gray-500">{{ $t("course.mail") }}</p>
                <p class="text-lg">
                  <a
                    :href="`mailto:${course.mailbox}`"
                    class="link link-hover"
                    >{{ course.mailbox }}</a
                  >
                </p>
              </div>
            </div>

            <div>
              <p class="font-semibold text-sm text-gray-500 mb-2">{{ $t("course.intro") }}</p>
              <div
                class="prose max-w-none bg-base-200 p-4 rounded-md"
                v-html="course.intro"
              ></div>
            </div>
          </div>

          <!-- Schedule Tab Content (Placeholder) -->
          <div v-if="activeTab === 'schedule'">
            <ScheduleTab
              v-if="activeTab === 'schedule'"
              :courseId="course.id"
            />
          </div>

          <!-- Materials Tab Content (Placeholder) -->
          <div v-if="activeTab === 'materials'">
            <MaterialTab
              v-if="activeTab === 'materials'"
              :courseId="course.id"
            />
          </div>

          <div v-if="activeTab === 'subcourse'">
            <SubcourseTab
              v-if="activeTab === 'subcourse'"
              :courseId="course.id"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found State -->
    <div v-else class="text-center py-20">
      <h2 class="text-2xl font-semibold">Course Not Found</h2>
      <p class="mt-2 text-gray-600">
        The course you are looking for does not exist or could not be loaded.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import * as dataService from "@/services/dataService";
import ScheduleTab from "@/components/ScheduleTab.vue";
import MaterialTab from "@/components/MaterialTab.vue";
import SubcourseTab from "@/components/SubcourseTab.vue";
// Define props passed from the router
const props = defineProps({
  id: {
    type: [String, Number], // Can be string from URL or number
    required: true,
  },
});

const router = useRouter(); // Get the router instance
const route = useRoute(); // Get the current route instance

const course = ref(null);
const isLoading = ref(true);
const error = ref(null);
const baseTitle = "课程详情";
const defaultTab = "details"; // Your default tab key
const activeTab = ref(defaultTab); // State for the active tab, default to 'details'
const validTabs = ["details", "schedule", "materials", "subcourse"]; // List all valid tab keys

// Helper function to set the document title
const updateTitle = (title) => {
  document.title = title;
};

// Function to change the active tab
const setActiveTab = (tabName) => {
  activeTab.value = tabName;
  router.replace({ query: { ...route.query, tab: tabName } });
  if (course.value) {
    updateTitle(`${course.value.name} | ${baseTitle}`);
  }
};

// Function to read the tab from the route query and set the active tab
const setTabFromRoute = () => {
  const tabFromQuery = route.query.tab;
  if (tabFromQuery && validTabs.includes(tabFromQuery)) {
    activeTab.value = tabFromQuery;
  } else {
    // If query param is missing or invalid, set to default
    activeTab.value = defaultTab;
    // Optional: Update URL to reflect the default tab if it wasn't set correctly
    // Be careful not to create infinite loops if route watching triggers this again
    if (route.query.tab !== defaultTab) {
      // Check if query needs updating only if it's not already the default or undefined
      router.replace({ query: { ...route.query, tab: defaultTab } });
    }
  }
};

// Function to fetch course details
const fetchCourseDetails = async (courseId) => {
  isLoading.value = true;
  error.value = null;
  course.value = null; // Reset course data
  activeTab.value = "details"; // Reset to details tab on fetch/refetch

  console.log(`Fetching course with ID: ${courseId}`);
  try {
    // Use the getCourse API call with the ID
    const response = await dataService.getCourse(courseId);
    course.value = response.data;

    if (course.value) {
      // Set title on success
      updateTitle(`${course.value.name} | ${baseTitle}`);
    } else {
      // Handle case where API returns success but empty data
      error.value = new Error("Course data not found.");
    }
  } catch (err) {
    console.error(`Failed to fetch course ${courseId}:`, err);
    if (err.response && err.response.status === 404) {
      error.value = new Error("Course not found.");
    } else {
      error.value = err.response?.data || err;
    }
    course.value = null; // Ensure course is null on error
  } finally {
    isLoading.value = false;
  }
};

// Function to navigate back
const goBack = () => {
  router.back(); // Navigates to the previous entry in the history stack
};

// Fetch details when the component is mounted
onMounted(() => {
  fetchCourseDetails(props.id); // Fetch initial data
  setTabFromRoute();
});

// Watch for route param changes (e.g., navigating /courses/1 -> /courses/2)
// This re-fetches data and updates the title if the ID changes.
watch(
  () => route.params.id,
  (newId, oldId) => {
    // Check if newId exists and is different from the previous one
    // Using route.params.id ensures we always react to URL changes
    if (newId && newId !== oldId) {
      console.log(`Route ID changed from ${oldId} to ${newId}. Refetching...`);
      fetchCourseDetails(newId);
      setTabFromRoute();
    }
  },
  { immediate: false },
); // immediate: false prevents running on initial mount
</script>

<style scoped>
/* Scoped styles for the view */
.prose p {
  margin-top: 0;
  margin-bottom: 1em;
}

/* Optional: Add slight transition for tab content visibility */
.card-body > div[v-if] {
  transition: opacity 0.3s ease-in-out;
  /* Basic animation example, you might want something more sophisticated */
}
</style>
