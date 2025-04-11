<template>
  <div class="container mx-auto px-4 py-8">

    <!-- Back Button -->
    <div class="mb-6">
      <button @click="goBack" class="btn btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Courses
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
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Error loading course details: {{ error.message || error }}</span>
      </div>
    </div>

    <!-- Course Content Area (only renders if course loaded successfully) -->
    <div v-else-if="course" class="max-w-4xl mx-auto">
        <!-- Course Title (remains above tabs) -->
         <h1 class="text-3xl font-bold mb-6">
          {{ course.name }}
          <span v-if="course.ename" class="text-xl text-gray-500">({{ course.ename }})</span>
        </h1>

        <!-- Tab Navigation -->
        <div class="tabs tabs-boxed mb-6 bg-base-200">
            <a class="tab tab-lg"
               :class="{ 'tab-active': activeTab === 'details' }"
               @click.prevent="setActiveTab('details')">
               Details
            </a>
            <a class="tab tab-lg"
               :class="{ 'tab-active': activeTab === 'schedule' }"
               @click.prevent="setActiveTab('schedule')">
               Schedule
            </a>
            <a class="tab tab-lg"
               :class="{ 'tab-active': activeTab === 'materials' }"
               @click.prevent="setActiveTab('materials')">
               Materials
            </a>
            <a class="tab tab-lg"
               :class="{ 'tab-active': activeTab === 'subcourse' }"
               @click.prevent="setActiveTab('subcourse')">
               分组信息
            </a>
        </div>

        <!-- Tab Content -->
        <div class="card bg-base-100 shadow-xl">
            <div class="card-body min-h-[400px]">

                <!-- Details Tab Content -->
                <div v-if="activeTab === 'details'">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                        <div>
                            <p class="font-semibold text-sm text-gray-500">课程号</p>
                            <p class="text-lg">{{ course.code.split(',')[0] }}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-sm text-gray-500">学分</p>
                            <p class="text-lg">{{ course.code.split(',')[1] }}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-sm text-gray-500">学时</p>
                            <p class="text-lg">{{ course.code.split(',')[2] }}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-sm text-gray-500">学期</p>
                            <p class="text-lg">
                         {{ course.term === '1' ? '春季' : course.term === '2' ? '秋季' : '暑期' }}
                            </p>
                        </div>
                        <div>
                            <p class="font-semibold text-sm text-gray-500">教师</p>
                            <p class="text-lg">{{ course.tea_name }}</p>
                        </div>
                        <div>
                            <p class="font-semibold text-sm text-gray-500">邮箱</p>
                            <p class="text-lg">
                                <a :href="`mailto:${course.mailbox}`" class="link link-hover">{{ course.mailbox }}</a>
                            </p>
                        </div>
                    </div>

                    <div>
                        <p class="font-semibold text-sm text-gray-500 mb-2">课程大纲</p>
                        <div class="prose max-w-none bg-base-200 p-4 rounded-md">
                            <p style="white-space: pre-wrap;">{{ course.intro }}</p>
                        </div>
                    </div>
                </div>

                <!-- Schedule Tab Content (Placeholder) -->
                <div v-if="activeTab === 'schedule'">
                    <h2 class="text-xl font-semibold mb-4">Course Schedule</h2>
                    <p class="italic text-gray-500">Schedule information will be displayed here.</p>
                    <!-- TODO: Replace with your schedule component -->
                    <!-- Example: <CourseSchedule :courseId="course.id" /> -->
                    <div class="text-center py-10">
                         <span class="loading loading-dots loading-md"></span>
                         <p>Loading schedule...</p>
                    </div>
                </div>

                <!-- Materials Tab Content (Placeholder) -->
                <div v-if="activeTab === 'materials'">
                    <h2 class="text-xl font-semibold mb-4">Downloadable Materials</h2>
                    <p class="italic text-gray-500">Links to course materials will appear here.</p>
                     <!-- TODO: Replace with your materials component -->
                     <!-- Example: <CourseMaterials :courseId="course.id" /> -->
                    <div class="text-center py-10">
                         <span class="loading loading-dots loading-md"></span>
                         <p>Loading materials...</p>
                    </div>
                </div>

                <div v-if="activeTab === 'subcourse'">
                    <SubcourseTab v-if="activeTab === 'subcourse'" :courseId="course.id" />
                </div>

            </div>
        </div>
    </div>

    <!-- Not Found State -->
    <div v-else class="text-center py-20">
        <h2 class="text-2xl font-semibold">Course Not Found</h2>
        <p class="mt-2 text-gray-600">The course you are looking for does not exist or could not be loaded.</p>
     </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue' // Added watch back
import { useRouter, useRoute } from 'vue-router' // Added useRoute back
import * as dataService from '@/services/dataService'
// Optional: Import child components if you create them later
// import CourseSchedule from '@/components/CourseSchedule.vue';
// import CourseMaterials from '@/components/CourseMaterials.vue';
import SubcourseTab from '@/components/SubcourseTab.vue'
// Define props passed from the router
const props = defineProps({
  id: {
    type: [String, Number], // Can be string from URL or number
    required: true
  }
})

const router = useRouter() // Get the router instance
const route = useRoute() // Get the current route instance

const course = ref(null)
const isLoading = ref(true)
const error = ref(null)
const originalTitle = ref(document.title)
const activeTab = ref('details') // State for the active tab, default to 'details'

// Helper function to set the document title
const updateTitle = (title) => {
  document.title = title;
}

// Function to change the active tab
const setActiveTab = (tabName) => {
    activeTab.value = tabName;
    // Optional: If you want the URL to reflect the active tab, you could use:
    // router.replace({ query: { tab: tabName } })
    // But this adds complexity to managing state on page load/refresh.
}

// Function to fetch course details
const fetchCourseDetails = async (courseId) => {
  isLoading.value = true
  error.value = null
  course.value = null; // Reset course data
  activeTab.value = 'details'; // Reset to details tab on fetch/refetch
  updateTitle(`Loading Course... | ${originalTitle.value}`) // Set loading title

  console.log(`Fetching course with ID: ${courseId}`)
  try {
    // Use the getCourse API call with the ID
    const response = await dataService.getCourse(courseId)
    course.value = response.data

    if (course.value) {
        // Set title on success
        updateTitle(`${course.value.name} | ${originalTitle.value}`)
    } else {
         // Handle case where API returns success but empty data
         error.value = new Error("Course data not found.");
         updateTitle(`Course Not Found | ${originalTitle.value}`);
    }

  } catch (err) {
    console.error(`Failed to fetch course ${courseId}:`, err)
    if (err.response && err.response.status === 404) {
        error.value = new Error("Course not found.")
        updateTitle(`Course Not Found | ${originalTitle.value}`)
    } else {
        error.value = err.response?.data || err
        updateTitle(`Error Loading Course | ${originalTitle.value}`)
    }
    course.value = null // Ensure course is null on error
  } finally {
    isLoading.value = false
  }
}

// Function to navigate back
const goBack = () => {
  router.back() // Navigates to the previous entry in the history stack
}

// Fetch details when the component is mounted
onMounted(() => {
  originalTitle.value = document.title; // Store original title
  fetchCourseDetails(props.id); // Fetch initial data
})

// Reset title when component is unmounted
onUnmounted(() => {
  updateTitle(originalTitle.value); // Restore the original title
})

// Watch for route param changes (e.g., navigating /courses/1 -> /courses/2)
// This re-fetches data and updates the title if the ID changes.
watch(() => route.params.id, (newId, oldId) => {
    // Check if newId exists and is different from the previous one
    // Using route.params.id ensures we always react to URL changes
    if (newId && newId !== oldId) {
        console.log(`Route ID changed from ${oldId} to ${newId}. Refetching...`);
        fetchCourseDetails(newId);
    }
}, { immediate: false }) // immediate: false prevents running on initial mount


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
