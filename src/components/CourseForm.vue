<template>
  <form @submit.prevent="submitForm" class="space-y-4 p-2">
    <div>
      <label class="label" for="course-name">
        <span class="label-text">Course Name</span>
      </label>
      <input id="course-name" type="text" v-model="formData.name" placeholder="e.g., Introduction to Programming" class="input input-bordered w-full" required />
    </div>
    <div>
      <label class="label" for="course-ename">
        <span class="label-text">English Name</span>
      </label>
      <input id="course-ename" type="text" v-model="formData.ename" placeholder="e.g., Intro to Programming" class="input input-bordered w-full" required/>
    </div>
    <div>
      <label class="label" for="course-code">
        <span class="label-text">Course Code</span>
      </label>
      <input id="course-code" type="text" v-model="formData.code" placeholder="e.g., CS101" class="input input-bordered w-full" required/>
    </div>
     <div>
      <label class="label" for="course-tea_id">
        <span class="label-text">Teacher ID</span>
      </label>
      <input id="course-tea_id" type="text" v-model="formData.tea_id" placeholder="Teacher's unique ID" class="input input-bordered w-full" required/>
    </div>
     <div>
      <label class="label" for="course-tea_name">
        <span class="label-text">Teacher Name</span>
      </label>
      <input id="course-tea_name" type="text" v-model="formData.tea_name" placeholder="Teacher's full name" class="input input-bordered w-full" required/>
    </div>
     <div>
      <label class="label" for="course-intro">
        <span class="label-text">Introduction</span>
      </label>
      <textarea id="course-intro" v-model="formData.intro" class="textarea textarea-bordered w-full" placeholder="Brief course description" rows="3"></textarea>
    </div>
     <div>
      <label class="label" for="course-mailbox">
        <span class="label-text">Mailbox</span>
      </label>
      <input id="course-mailbox" type="email" v-model="formData.mailbox" placeholder="Contact email" class="input input-bordered w-full"/>
    </div>
     <div>
      <label class="label" for="course-term">
        <span class="label-text">Term (Semester ID)</span>
      </label>
      <!-- Consider using a dropdown populated from semesters -->
      <input id="course-term" type="number" v-model.number="formData.term" placeholder="ID of the semester" class="input input-bordered w-full" required/>
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <button type="button" class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      <button type="submit" class="btn btn-primary">Save Course</button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['save', 'close'])

const defaultFormData = {
    id: 0,
    name: '',
    ename: '',
    code: '',
    tea_id: '',
    tea_name: '',
    intro: '',
    mailbox: '',
    term: null, // Initialize as null or a default ID
}

const formData = ref({ ...defaultFormData })

// Watch for changes in initialData to populate the form for editing
watch(() => props.initialData, (newData) => {
  if (newData) {
    // Ensure term is a number if it comes from API
    formData.value = { ...newData, term: Number(newData.term) || null };
  } else {
    formData.value = { ...defaultFormData }; // Reset if no initial data
  }
}, { immediate: true }); // Run immediately when component mounts


const submitForm = () => {
    // Basic validation check (more can be added)
    if (formData.value.name && formData.value.code && formData.value.tea_id && formData.value.term !== null) {
        // Clean up data before emitting - e.g., ensure term is integer
        const dataToSave = {
            ...formData.value,
            term: parseInt(formData.value.term, 10) || 0 // Ensure integer
        };
         // Remove ID if it exists, backend should handle ID on create/update based on endpoint
        emit('save', dataToSave);
    } else {
        alert('Please fill in all required fields.');
    }
}

// Reset form when the component is mounted without initial data (for create)
// onMounted(() => {
//     if (!props.initialData) {
//         formData.value = { ...defaultFormData };
//     }
// })

</script>
