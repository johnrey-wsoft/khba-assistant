// Member-onboarding options. Stable keys are stored on the profile; the labels
// are translated in the message catalogs (onboarding.topics.* / onboarding.roles.*).

export const ONBOARDING_TOPICS = [
  "permits",
  "parking",
  "purchaseNotices",
  "sales",
  "filings",
  "standards",
] as const;

export const ONBOARDING_ROLES = [
  "owner",
  "planning",
  "design",
  "permits",
  "construction",
  "sales",
  "finance",
] as const;

export type OnboardingTopic = (typeof ONBOARDING_TOPICS)[number];
export type OnboardingRole = (typeof ONBOARDING_ROLES)[number];

// Version stamped onto `terms_accepted_at` / `terms_version` when a member
// completes onboarding.
export const CURRENT_TERMS_VERSION = "1.2";
