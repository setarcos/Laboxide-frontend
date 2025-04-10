import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PERMISSION_ADMIN, PERMISSION_TEACHER, PERMISSION_LAB_MANAGER } from '@/utils/permissions'
// Import nextTick if you want extra safety, though often not needed for document.title
// import { nextTick } from 'vue'

// View Components (Lazy Loaded)
const DashboardView = () => import('@/views/DashboardView.vue')
const CourseListView = () => import('@/views/CourseListView.vue')
const LabroomListView = () => import('@/views/LabroomListView.vue')
const UserListView = () => import('@/views/UserListView.vue')
const SemesterListView = () => import('@/views/SemesterListView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')
const CourseDetailView = () => import('@/views/CourseDetailView.vue')

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    // Add meta.title
    meta: { requiresAuth: true, title: 'Dashboard' }
  },
  {
    path: '/courses',
    name: 'Courses',
    component: CourseListView,
    // Add meta.title
    meta: { requiresAuth: true, title: 'Manage Courses' }
  },
  {
    path: '/labrooms',
    name: 'Labrooms',
    component: LabroomListView,
    // Add meta.title
    meta: {
        requiresAuth: true,
        requiredPermission: PERMISSION_LAB_MANAGER | PERMISSION_ADMIN,
        title: 'Manage Lab Rooms'
    }
  },
  {
    path: '/users',
    name: 'Users',
    component: UserListView,
    // Add meta.title
    meta: {
        requiresAuth: true,
        requiredPermission: PERMISSION_ADMIN,
        title: 'Manage Users'
    }
  },
  {
    path: '/semesters',
    name: 'Semesters',
    component: SemesterListView,
    // Add meta.title
    meta: {
        requiresAuth: true,
        requiredPermission: PERMISSION_ADMIN,
        title: 'Manage Semesters'
    }
  },
   // Catch-all 404 route
   {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    // Add meta.title for 404
    meta: { title: 'Page Not Found' }
  },
  {
    path: '/courses/:id', // :id is a dynamic parameter
    name: 'CourseDetail', // Matches the name used in <router-link>
    component: CourseDetailView,
    props: true, // Automatically pass route params as props to the component
    meta: { title: '课程详情' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  linkActiveClass: 'active', // Add active class for DaisyUI menu items
})

// --- Existing Navigation Guard (Authentication/Authorization) ---
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. Wait if initial auth check is still loading
  while (authStore.isLoading) {
    await new Promise(resolve => setTimeout(resolve, 50)); // Wait briefly
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredPermission = to.meta.requiredPermission

  // 2. Check if route requires authentication
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('Redirecting to login (or handling via UI)');
    next({ name: 'Dashboard' }); // Or redirect to a public page if you have one
  }
  // 3. Check if route requires specific permissions
  else if (requiredPermission && authStore.isAuthenticated) {
    if (!authStore.hasPermission(requiredPermission)) {
      console.warn(`User does not have required permission (${requiredPermission}) for route ${to.name}`);
      next({ name: 'Dashboard' });
    } else {
      next(); // User is authenticated and has permission
    }
  }
  // 4. No specific auth/permission needed, or user meets criteria
  else {
    next();
  }
})

// --- New Navigation Guard (Update Page Title) ---
const baseTitle = 'Admin Panel'; // Set your default/base title here

router.afterEach((to, from) => {
  // Optional: Use nextTick to wait for potential DOM updates, though often unnecessary for title
  // nextTick(() => {
    document.title = to.meta?.title ? `${to.meta.title}`: baseTitle;
  // });
});


export default router
