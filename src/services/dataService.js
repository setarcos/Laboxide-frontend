import api from './api'

// --- Course ---
export const getCourses = () => api.get('/course')
export const getCourse = (id) => api.get(`/course/${id}`)
export const createCourse = (data) => api.post('/admin/course', data)
export const updateCourse = (id, data) => api.put(`/admin/course/${id}`, data) // Admin edit
export const stuffUpdateCourse = (id, data) => api.put(`/stuff/course/${id}`, data) // Teacher/Stuff edit
export const deleteCourse = (id) => api.delete(`/admin/course/${id}`)

// --- Labroom ---
export const getLabrooms = () => api.get('/stuff/labroom')
// export const getLabroom = (id) => api.get(`/stuff/labroom/${id}`) // API missing? Assuming not needed for list view
export const createLabroom = (data) => api.post('/lab/labroom', data)
export const updateLabroom = (id, data) => api.put(`/lab/labroom/${id}`, data)
export const deleteLabroom = (id) => api.delete(`/lab/labroom/${id}`)
// GET /admin/course/{id}, update labroom - API seems mismatched? Assuming PUT /admin/labroom/{id} is correct for updates

// --- Semester ---
export const getSemesters = () => api.get('/admin/semester')
// export const getSemester = (id) => api.get(`/admin/semester/${id}`) // API missing? Assuming not needed for list view
export const createSemester = (data) => api.post('/admin/semester', data)
export const updateSemester = (id, data) => api.put(`/admin/semester/${id}`, data)
export const deleteSemester = (id) => api.delete(`/admin/semester/${id}`)
// GET /admin/course/{id}, update semester - API seems mismatched? Assuming PUT /admin/semester/{id} is correct

// --- User ---
export const getUsers = () => api.get('/admin/user')
// export const getUser = (id) => api.get(`/admin/user/${id}`) // API missing? Assuming not needed for list view
export const createUser = (data) => api.post('/admin/user', data)
export const updateUser = (id, data) => api.put(`/admin/user/${id}`, data)
export const deleteUser = (id) => api.delete(`/admin/user/${id}`)
// GET /admin/course/{id}, update user - API seems mismatched? Assuming PUT /admin/user/{id} is correct
