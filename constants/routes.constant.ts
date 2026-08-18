export const PUBLIC_ROUTES = {
  ROOT: "/",
  ABOUT: "/about",
  TERMS: "/terms",
} as const;

export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const;

export const PROTECTED_ROUTES = {
  CHAT: "/chat",
  ONBOARDING: "/onboarding",
  PENDING: "/pending",
  ADMIN: "/admin",
} as const;

export const API_ROUTES = {
  USERS: {
    ME: "/api/users/me",
  },
  MAIL: {
    SEND: "/api/mail/send",
  },
  CHAT: "/api/chat",
  CHATS: {
    ROOT: "/api/chats",
    BY_ID: (id: string) => `/api/chats/${id}`,
  },
  ADMIN: {
    USERS: {
      ROOT: "/api/admin/users",
      BY_ID: (id: string) => `/api/admin/users/${id}`,
    },
  },
  HEALTHCHECK: "/api/healthcheck",
  ONBOARDING: "/api/onboarding",
} as const;

export const PROTECTED_ROUTE_PATTERNS: string[] = Object.values(PROTECTED_ROUTES).map(
  (route) => `${route}/*`
);

export const DEFAULT_AUTH_REDIRECT = PROTECTED_ROUTES.CHAT;

export const DEFAULT_UNAUTH_REDIRECT = AUTH_ROUTES.LOGIN;
