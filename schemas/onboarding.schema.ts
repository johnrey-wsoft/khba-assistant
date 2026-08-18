import { z } from "zod";

// Simplified onboarding: just the member's name and company. Company defaults
// to the org name on the form (WLabs); other profile fields stay optional.
export const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  company: z.string().trim().min(1, "Company name is required").max(200),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
