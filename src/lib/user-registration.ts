import { z } from "zod";
import {
  educationRecordSchema,
  extractedProfileSchema,
  extractedSpouseSchema,
} from "./conversation";

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
  educationHistory: z.array(educationRecordSchema).optional(),
  militaryService: z.boolean().optional(),
  militaryDischargeRank: z.string().optional(),
});

export const childSchema = z.object({
  name: z.string().trim(),
  dob: z.string().trim(),
  status: z.string().trim(),
  age: z.number().int().min(28).max(130).optional(),
  education: z.string().optional(),
  institution: z.string().optional(),
  graduationYear: z.string().optional(),
  workplace: z.string().optional(),
});

export const socialProfilesSchema = z.object({
  facebook: z.string().trim(),
  instagram: z.string().trim(),
  linkedin: z.string().trim(),
});

export const contactInfoSchema = z.object({
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  telegram: z.string().trim().optional(),
  preferredContact: z.enum(["email", "phone", "whatsapp", "telegram"]).optional(),
});

export const registrationSchema = z
  .object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.string().trim().email(),
    dob: z.string().trim(),
    clubId: z.string().trim(),
    customClub: z.string().trim(),
    joinYear: z.string().trim().min(1),
    socialProfiles: socialProfilesSchema,
    contactInfo: contactInfoSchema.optional(),
    me: personSchema,
    married: z.enum(["yes", "no", "undisclosed"]),
    spouse: personSchema.nullable(),
    children: z.array(childSchema),
    onboarded: z.literal(true),
    rotaryJoinDate: z.string().optional(),
    interviewProfile: extractedProfileSchema.optional(),
    partnerProfile: extractedSpouseSchema.optional(),
    hasChildren: z.boolean().optional(),
    networkingPreferences: z
      .object({
        opportunities: z.array(z.string()).optional(),
        connectionTypes: z.array(z.string()).optional(),
        mentoring: z.boolean().optional(),
        partnerships: z.boolean().optional(),
        updates: z.boolean().optional(),
      })
      .optional(),
  })
  .refine((input) => !!input.dob || (Number(input.me.age) >= 18 && Number(input.me.age) <= 130), {
    message: "An age or date of birth is required",
    path: ["dob"],
  });

export type Job = z.infer<typeof jobSchema>;
export type Person = z.infer<typeof personSchema>;
export type Child = z.infer<typeof childSchema>;
export type SocialProfiles = z.infer<typeof socialProfilesSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
