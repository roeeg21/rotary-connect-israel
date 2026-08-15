import { z } from "zod";

export const jobSchema = z.object({
  employer: z.string().trim(),
  role: z.string().trim(),
  from: z.string().trim(),
  to: z.string().trim(),
  description: z.string().trim(),
});

export const personSchema = z.object({
  gender: z.string().trim(),
  age: z.string().trim(),
  education: z.string().trim(),
  jobs: z.array(jobSchema),
  boards: z.string().trim(),
  hobbies: z.string().trim(),
});

export const childSchema = z.object({
  name: z.string().trim(),
  dob: z.string().trim(),
  status: z.string().trim(),
});

export const socialProfilesSchema = z.object({
  facebook: z.string().trim(),
  instagram: z.string().trim(),
  linkedin: z.string().trim(),
});

export const registrationSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  dob: z.string().trim().min(1),
  clubId: z.string().trim(),
  customClub: z.string().trim(),
  joinYear: z.string().trim().min(1),
  socialProfiles: socialProfilesSchema,
  me: personSchema,
  married: z.enum(["yes", "no"]),
  spouse: personSchema.nullable(),
  children: z.array(childSchema),
  onboarded: z.literal(true),
});

export type Job = z.infer<typeof jobSchema>;
export type Person = z.infer<typeof personSchema>;
export type Child = z.infer<typeof childSchema>;
export type SocialProfiles = z.infer<typeof socialProfilesSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
