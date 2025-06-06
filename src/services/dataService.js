import api from "./api";

// --- Course ---
export const getCourses = () => api.get("/course");
export const getCourse = (id) => api.get(`/course/${id}`);
export const createCourse = (data) => api.post("/admin/course", data);
export const updateCourse = (id, data) => api.put(`/admin/course/${id}`, data); // Admin edit
export const teacherUpdateCourse = (id, data) =>
  api.put(`/teacher/course/${id}`, data); // Teacher/Stuff edit
export const deleteCourse = (id) => api.delete(`/admin/course/${id}`);

// --- Labroom ---
export const getLabrooms = () => api.get("/labroom");
export const getLabroom = (id) => api.get(`/labroom/${id}`);
export const createLabroom = (data) => api.post("/lab/labroom", data);
export const updateLabroom = (id, data) => api.put(`/lab/labroom/${id}`, data);
export const deleteLabroom = (id) => api.delete(`/lab/labroom/${id}`);
// GET /admin/course/{id}, update labroom - API seems mismatched? Assuming PUT /admin/labroom/{id} is correct for updates

// --- Semester ---
export const getSemesters = () => api.get("/admin/semester");
// export const getSemester = (id) => api.get(`/admin/semester/${id}`) // API missing? Assuming not needed for list view
export const createSemester = (data) => api.post("/admin/semester", data);
export const updateSemester = (id, data) =>
  api.put(`/admin/semester/${id}`, data);
export const deleteSemester = (id) => api.delete(`/admin/semester/${id}`);
export const getCurrentSemester = () => api.get("/semester/current");
// GET /admin/course/{id}, update semester - API seems mismatched? Assuming PUT /admin/semester/{id} is correct

// --- User ---
export const getUsers = () => api.get("/admin/user");
// export const getUser = (id) => api.get(`/admin/user/${id}`) // API missing? Assuming not needed for list view
export const createUser = (data) => api.post("/admin/user", data);
export const updateUser = (data) => api.put("/admin/user", data);
export const deleteUser = (id) => api.delete(`/admin/user/${id}`);
// GET /admin/course/{id}, update user - API seems mismatched? Assuming PUT /admin/user/{id} is correct
// --- Subcourse (Student Group) ---
// params could be { course_id: number, semester_id?: number }
export const getSubcourses = (params) => api.get("/subcourse", { params });
export const getSubcourse = (id) => api.get(`/subcourse/${id}`);
export const getMySubcourses = () => api.get("/mycourse");
export const createSubcourse = (data) => api.post("/teacher/subcourse", data);
export const updateSubcourse = (id, data) =>
  api.put(`/teacher/subcourse/${id}`, data);
export const deleteSubcourse = (id) => api.delete(`/teacher/subcourse/${id}`);

// -- Student Grouping ----

export const teacherRemove = (cid, stu_id) =>
  api.delete(`/teacher/group/remove/${cid}/${stu_id}`);
export const joinGroup = (cid) => api.post(`/stu/group/join/${cid}`);
export const leaveGroup = (cid) => api.delete(`/stu/group/leave/${cid}`);
export const getGroup = (cid) => api.get(`/member/group/${cid}`);
export const setSeat = (sid, seat) =>
  api.put(`/teacher/group/seat/${sid}/${seat}`);

// --- Course Schedule ---
// Get schedules for a specific course
export const getSchedules = (courseId) =>
  api.get(`/schedule/course/${courseId}`);
export const createSchedule = (data) => api.post("/teacher/schedule", data);
export const updateSchedule = (id, data) =>
  api.put(`/teacher/schedule/${id}`, data);
export const deleteSchedule = (id) => api.delete(`/teacher/schedule/${id}`);

// --- Course File Functions ---
export const listCourseFiles = (courseId) =>
  api.get(`/coursefile/list/${courseId}`);
export const uploadCourseFile = (formData) =>
  api.post("/teacher/coursefile/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const deleteCourseFile = (fileId) =>
  api.delete(`/teacher/coursefile/${fileId}`);

// --- StudentLog Functions ---
export const getDefaultStudentLog = (subcourseId, stuId) =>
  api.get("/stu/student_log/default", {
    params: {
      subcourse_id: subcourseId,
      stu_id: stuId,
    },
  });
export const createStudentLog = (logData) =>
  api.post("/stu/student_log", logData);
export const updateStudentLog = (logId, logData) =>
  api.put(`/stu/student_log/${logId}`, logData);
export const confirmStudentLog = (logId, data) =>
  api.put(`/teacher/student_log/confirm/${logId}`, data);
export const forceStudentLog = (subcourseId, stuId) =>
  api.put(`/teacher/student_log/force/${subcourseId}/${stuId}`);
export const getRecentLog = (subcourseId) =>
  api.get(`/teacher/student_log/recent/${subcourseId}`);
export const getStudentLogsByRoom = (roomId, rangeData) =>
  api.post(`/lab/student_log/room/${roomId}`, rangeData);

// --- SubSchedule Functions ---
export const getSubSchedules = (scheduleId) =>
  api.get(`/member/subschedules/${scheduleId}`);
export const createSubSchedule = (subScheduleData) =>
  api.post("/teacher/subschedule", subScheduleData);
export const updateSubSchedule = (subScheduleId, subScheduleData) =>
  api.put(`/teacher/subschedule/${subScheduleId}`, subScheduleData);
export const deleteSubSchedule = (subScheduleId) =>
  api.delete(`/teacher/subschedule/${subScheduleId}`);

// --- Timeline Functions ---
export const createTimeline = (formData) =>
  api.post("/member/timeline", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
export const listTimelinesByStudent = (subcourseId, studentId) =>
  api.get(`/member/timeline/student/${subcourseId}/${studentId}`);
export const deleteTimeline = (timelineId) =>
  api.delete(`/member/timeline/${timelineId}`);
export const downloadTimelineFile = (timelineId) =>
  api.get(`/member/timeline/file/${timelineId}`, { responseType: "blob" });
export const listTimelinesBySchedule = (subcourse_id, schedule_id) =>
  api.get(`/teacher/timeline/schedule/${subcourse_id}/${schedule_id}`);
