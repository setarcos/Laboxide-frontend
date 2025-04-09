import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { PERMISSION_ADMIN, PERMISSION_TEACHER, PERMISSION_LAB_MANAGER } from '@/utils/permissions'

// View Components (Lazy Loaded)
const DashboardView = () => import('@/views/DashboardView.vue')
const CourseListView = () => import('@/views/CourseListView.vue')
const LabroomListView = () => import('@/views/LabroomListView.vue')
const UserListView = () => import('@/views/UserListView.vue')
const SemesterListView = () => import('@/views/SemesterListView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true } // Dashboard requires login
  },
  {
    path: '/courses',
    name: 'Courses',
    component: CourseListView,
    meta: { requiresAuth: true } // Viewing courses might require login, specific actions checked in component
  },
  {
    path: '/labrooms',
    name: 'Labrooms',
    component: LabroomListView,
    meta: { requiresAuth: true, requiredPermission: PERMISSION_LAB_MANAGER | PERMISSION_ADMIN } // Only Lab Managers or Admins
  },
  {
    path: '/users',
    name: 'Users',
    component: UserListView,
    meta: { requiresAuth: true, requiredPermission: PERMISSION_ADMIN } // Only Admins
  },
  {
    path: '/semesters',
    name: 'Semesters',
    component: SemesterListView,
    meta: { requiresAuth: true, requiredPermission: PERMISSION_ADMIN } // Only Admins
  },
   // Catch-all 404 route
   {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  linkActiveClass: 'active', // Add active class for DaisyUI menu items
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // 1. Wait if initial auth check is still loading
  // This prevents race conditions on initial load or refresh
  while (authStore.isLoading) {
    await new Promise(resolve => setTimeout(resolve, 50)); // Wait briefly
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiredPermission = to.meta.requiredPermission

  // 2. Check if route requires authentication
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('Redirecting to login (or handling via UI)');
    // In a real app, you might redirect to a login page:
    // window.location.href = '/login'; // If login is external
    // Or show a login modal / redirect to an internal login route
    // For this example, we rely on the UI hiding elements, but prevent access
    next({ name: 'Dashboard' }); // Or redirect to a public page if you have one
  }
  // 3. Check if route requires specific permissions
  else if (requiredPermission && authStore.isAuthenticated) {
    if (!authStore.hasPermission(requiredPermission)) {
      console.warn(`User does not have required permission (${requiredPermission}) for route ${to.name}`);
      // Redirect to a safe page like dashboard or show an unauthorized message
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

export default router
