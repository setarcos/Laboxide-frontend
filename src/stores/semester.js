// src/stores/semester.js
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import * as dataService from '@/services/dataService';
// No auth store import needed

export const useSemesterStore = defineStore('semester', () => {
    // --- Semester State ---
    const currentSemester = ref(null);
    const isSemesterLoading = ref(false);
    const semesterError = ref(null);

    // --- Computed Properties ---
    const getCurrentSemesterId = computed(() => currentSemester.value?.id || null);
    const hasCurrentSemester = computed(() => !!currentSemester.value && !semesterError.value);

    // --- Actions ---
    async function fetchCurrentSemester() {

        // Avoid redundant fetching
        if (isSemesterLoading.value || hasCurrentSemester.value) {
             // console.log("Semester already loading or successfully loaded.");
             return;
        }

        console.log("Fetching current semester...");
        isSemesterLoading.value = true;
        semesterError.value = null;
        try {
            // Assume API endpoint /semester/current is publicly accessible
            const response = await dataService.getCurrentSemester();
            currentSemester.value = response.data;
            console.log("Current semester fetched:", currentSemester.value);
        } catch (err) {
            console.error("Failed to fetch current semester:", err);
            semesterError.value = err.response?.data?.error || 'Could not load current semester info.';
            currentSemester.value = null;
        } finally {
            isSemesterLoading.value = false;
        }
    }

    // clearSemester might still be useful if you need to manually reset it
    function clearSemester() {
        currentSemester.value = null;
        semesterError.value = null;
        isSemesterLoading.value = false;
    }


    return {
        // State
        currentSemester,
        isSemesterLoading,
        semesterError,

        // Computed
        getCurrentSemesterId,
        hasCurrentSemester,

        // Actions
        fetchCurrentSemester,
        clearSemester
    };
});
