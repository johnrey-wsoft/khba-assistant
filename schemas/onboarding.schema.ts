import { z } from "zod";

import { ONBOARDING_ROLES, ONBOARDING_TOPICS } from "@/constants/onboarding.constant";

// Korean business registration number: 10 digits, optionally 000-00-00000.
const bizRegNoRegex = /^\d{3}-?\d{2}-?\d{5}$/;

export const onboardingSchema = z.object({
  company: z.string().trim().min(1, "Company name is required").max(200),
  businessRegistrationNumber: z
    .string()
    .trim()
    .regex(bizRegNoRegex, "Enter 10 digits in the 000-00-00000 format"),
  memberNumber: z.string().trim().max(50).optional().or(z.literal("")),
  role: z.enum(ONBOARDING_ROLES),
  topics: z.array(z.enum(ONBOARDING_TOPICS)),
  marketingOptIn: z.boolean(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
