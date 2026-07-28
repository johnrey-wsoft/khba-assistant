export const PUBLIC_ROUTES = {
  ROOT: "/",
} as const;

export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
} as const;

export const PROTECTED_ROUTES = {
  DASHBOARD: "/dashboard",
} as const;

export const API_ROUTES = {
  USERS: {
    ME: "/api/users/me",
  },
  MAIL: {
    SEND: "/api/mail/send",
  },
  HEALTHCHECK: "/api/healthcheck",
} as const;

export const PROTECTED_ROUTE_PATTERNS: string[] = Object.values(PROTECTED_ROUTES).map(
  (route) => `${route}/*`
);

export const DEFAULT_AUTH_REDIRECT = PROTECTED_ROUTES.DASHBOARD;

export const DEFAULT_UNAUTH_REDIRECT = AUTH_ROUTES.LOGIN;
