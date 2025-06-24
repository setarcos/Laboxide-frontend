import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { PERMISSION_ADMIN, PERMISSION_LAB_MANAGER } from "@/utils/permissions";
// Import nextTick if you want extra safety, though often not needed for document.title
// import { nextTick } from 'vue'

// View Components (Lazy Loaded)
const DashboardView = () => import("@/views/DashboardView.vue");
const CourseListView = () => import("@/views/CourseListView.vue");
const LabroomListView = () => import("@/views/LabroomListView.vue");
const UserListView = () => import("@/views/UserListView.vue");
const SemesterListView = () => import("@/views/SemesterListView.vue");
const NotFoundView = () => import("@/views/NotFoundView.vue");
const CourseDetailView = () => import("@/views/CourseDetailView.vue");
const SubcourseStudentsView = () => import("@/views/SubcourseStudentsView.vue");
const SubcourseProgressView = () => import("@/views/SubcourseProgressView.vue");
const StudentTimelineView = () => import("@/views/StudentTimelineView.vue");
const StudentLogsView = () => import("@/views/StudentLogsView.vue");
const LoginView = () => import("@/views/LoginView.vue");
const AuthView = () => import("@/views/AuthView.vue");
const EquipmentView = () => import("@/views/EquipmentView.vue");

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: DashboardView,
    // Add meta.title
    meta: { requiresAuth: false, title: "Dashboard" },
  },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { requiresAuth: false, title: "Login" },
  },
  {
    path: "/auth",
    name: "auth",
    component: AuthView,
    meta: { requiresAuth: false, title: "Auth" },
  },
  {
    path: "/courses",
    name: "Courses",
    component: CourseListView,
    // Add meta.title
    meta: { requiresAuth: false, title: "Manage Courses" },
  },
  {
    path: "/labrooms",
    name: "Labrooms",
    component: LabroomListView,
    // Add meta.title
    meta: {
      requiresAuth: true,
      requiredPermission: PERMISSION_LAB_MANAGER | PERMISSION_ADMIN,
      title: "Manage Lab Rooms",
    },
  },
  {
    path: "/users",
    name: "Users",
    component: UserListView,
    // Add meta.title
    meta: {
      requiresAuth: true,
      requiredPermission: PERMISSION_ADMIN,
      title: "Manage Users",
    },
  },
  {
    path: "/semesters",
    name: "Semesters",
    component: SemesterListView,
    // Add meta.title
    meta: {
      requiresAuth: true,
      requiredPermission: PERMISSION_ADMIN,
      title: "Manage Semesters",
    },
  },
  // Catch-all 404 route
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFoundView,
    // Add meta.title for 404
    meta: { title: "Page Not Found" },
  },
  {
    path: "/courses/:id", // :id is a dynamic parameter
    name: "CourseDetail", // Matches the name used in <router-link>
    component: CourseDetailView,
    props: true, // Automatically pass route params as props to the component
  },
  {
    path: "/subcourses/:id",
    name: "SubcourseStudents",
    component: SubcourseStudentsView,
    props: true, // Pass route param 'id' as prop to the component
    meta: { requiresAuth: true, title: "学生列表" },
  },
  {
    path: "/progress/:id", // Use subcourse ID from route
    name: "SubcourseProgress",
    component: SubcourseProgressView, // Use imported component
    props: true, // Pass route param 'id' as prop
    meta: { requiresAuth: true, title: "学生进度" }, // Protect route
  },
  {
    path: "/timeline/:subcourseId/:studentId/",
    name: "StudentTimeline",
    component: StudentTimelineView,
    props: true, // Pass route params (subcourseId, studentId) as props
    meta: { requiresAuth: true, title: "学生时间线" },
  },
  {
    path: "/labrooms/logs/:roomId", // The new route
    name: "StudentLogs",
    component: StudentLogsView,
    props: true,
    meta: { requiresAuth: true, title: "学生日志" },
  },
  {
    path: '/equipments',
    name: 'EquipmentView',
    component: EquipmentView,
    meta: { requiresAuth: true, title: "设备管理" }
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  linkActiveClass: "active", // Add active class for DaisyUI menu items
});

// --- Existing Navigation Guard (Authentication/Authorization) ---
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  // 1. Wait if initial auth check is still loading
  while (authStore.isLoading) {
    await new Promise((resolve) => setTimeout(resolve, 50)); // Wait briefly
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiredPermission = to.meta.requiredPermission;

  // 2. Check if route requires authentication
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log("Redirecting to login (or handling via UI)");
    next({ name: "login" });
  }
  // 3. Check if route requires specific permissions
  else if (requiredPermission && authStore.isAuthenticated) {
    if (!authStore.hasPermission(requiredPermission)) {
      console.warn(
        `User does not have required permission (${requiredPermission}) for route ${to.name}`,
      );
      next({ name: "Dashboard" });
    } else {
      next(); // User is authenticated and has permission
    }
  }
  // 4. No specific auth/permission needed, or user meets criteria
  else {
    next();
  }
});

router.afterEach((to) => {
  // Optional: Use nextTick to wait for potential DOM updates, though often unnecessary for title
  // nextTick(() => {
  if (to.meta?.title) document.title = `${to.meta.title}`;
  // });
});

export default router;
