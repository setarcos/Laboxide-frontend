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

    <!-- Course Details -->
    <div v-else-if="course" class="card bg-base-100 shadow-xl max-w-3xl mx-auto">
      <div class="card-body">
        <h1 class="card-title text-3xl mb-4">
          {{ course.name }}
          <span v-if="course.ename" class="text-xl text-gray-500">({{ course.ename }})</span>
        </h1>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div>
            <p class="font-semibold text-sm text-gray-500 uppercase">Course Code</p>
            <p class="text-lg">{{ course.code }}</p>
          </div>
          <div>
            <p class="font-semibold text-sm text-gray-500 uppercase">Teacher</p>
            <p class="text-lg">{{ course.tea_name }}</p>
          </div>
          <div>
            <p class="font-semibold text-sm text-gray-500 uppercase">Teacher Email</p>
            <p class="text-lg">
                <a :href="`mailto:${course.mailbox}`" class="link link-hover">{{ course.mailbox }}</a>
            </p>
          </div>
          <div>
            <p class="font-semibold text-sm text-gray-500 uppercase">Term ID</p>
            <p class="text-lg">{{ course.term }}</p>
          </div>
        </div>

        <div>
          <p class="font-semibold text-sm text-gray-500 uppercase mb-2">Introduction</p>
          <!-- Use v-html if intro contains safe HTML, otherwise just {{ course.intro }} -->
          <!-- Be cautious with v-html if the source is not trusted -->
          <div class="prose max-w-none bg-base-200 p-4 rounded-md">
             <!-- Using whitespace pre-wrap for simple text formatting -->
             <p style="white-space: pre-wrap;">{{ course.intro }}</p>
          </div>
        </div>

        <!-- Add other details as needed -->

      </div>
    </div>

    <!-- Not Found State (Optional but good practice) -->
     <div v-else class="text-center py-20">
        <h2 class="text-2xl font-semibold">Course Not Found</h2>
        <p class="mt-2 text-gray-600">The course you are looking for does not exist.</p>
     </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted} from 'vue'
import { useRouter } from 'vue-router' // Import useRouter for navigation
import * as dataService from '@/services/dataService'

// Define props passed from the router (because we used props: true)
const props = defineProps({
  id: {
    type: [String, Number], // Can be string from URL or number
    required: true
  }
})

const router = useRouter() // Get the router instance

const course = ref(null)
const isLoading = ref(true)
const error = ref(null)
const originalTitle = ref(document.title)

const updateTitle = (title) => {
  document.title = title;
}

// Function to fetch course details
const fetchCourseDetails = async () => {
  isLoading.value = true
  error.value = null
  try {
    // Use the getCourse API call with the ID from props
    const response = await dataService.getCourse(props.id)
    course.value = response.data
    if (course.value) {
      updateTitle(`${course.value.name} | ${originalTitle.value}`)
    }
  } catch (err) {
    console.error(`Failed to fetch course ${props.id}:`, err)
    // Handle specific errors like 404 Not Found if your API provides them
    if (err.response && err.response.status === 404) {
        error.value = new Error("Course not found.")
        course.value = null // Ensure course is null if not found
    } else {
        error.value = err.response?.data || err // Store the error object or message
    }
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
  originalTitle.value = document.title;
  fetchCourseDetails()
})

onUnmounted(() => {
  updateTitle(originalTitle.value); // Restore the original title
})


</script>

<style scoped>
/* Add any specific styles for the detail view here */
.prose p {
    margin-top: 0;
    margin-bottom: 1em;
}
</style>
