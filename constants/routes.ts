export const ROUTES = {
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Main routes
  HOME: '/',
  QUINIELAS: '/quinielas',
  RANKINGS: '/rankings',
  PROFILE: '/profile',
  
  // Quiniela routes
  QUINIELA_CREATE: '/quiniela/create',
  QUINIELA_JOIN: '/quiniela/join',
  QUINIELA_DETAIL: (id: string) => `/quiniela/${id}`,
  QUINIELA_PREDICT: (id: string) => `/quiniela/${id}/predict`,
  
  // Admin routes
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_MATCHES: '/admin/matches',
} as const;
