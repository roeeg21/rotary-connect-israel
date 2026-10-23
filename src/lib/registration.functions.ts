/**
 * Registration Functions
 *
 * Server functions for registration draft management.
 * These functions are called from the client via useServerFn.
 */

import { createServerFn } from "@tanstack/react-start";
import type { RegistrationData, RegistrationStep, RegistrationDraft } from "./registration-schema";
import * as registrationService from "./registration-service.server";

/**
 * Create a new registration draft
 */
export const createDraft = createServerFn({ method: "POST" })
  .validator(
    (data: {
      method: "form" | "chat";
      email?: string;
      sessionId?: string;
      initialData?: Partial<RegistrationData>;
    }) => data
  )
  .handler(async ({ data }) => {
    const draft = await registrationService.createDraft(
      data.method,
      data.email,
      data.sessionId,
      data.initialData
    );
    return draft;
  });

/**
 * Get draft by ID
 */
export const getDraftById = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const draft = await registrationService.getDraftById(data.id);
    return draft;
  });

/**
 * Get draft by email (for resuming registration)
 */
export const getDraftByEmail = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const draft = await registrationService.getDraftByEmail(data.email);
    return draft;
  });

/**
 * Get draft by session ID (for chat registration)
 */
export const getDraftBySessionId = createServerFn({ method: "POST" })
  .validator((data: { sessionId: string }) => data)
  .handler(async ({ data }) => {
    const draft = await registrationService.getDraftBySessionId(data.sessionId);
    return draft;
  });

/**
 * Update draft data
 */
export const updateDraft = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      updates: {
        data?: Partial<RegistrationData>;
        currentStep?: RegistrationStep;
        completedSteps?: RegistrationStep[];
        email?: string;
        sessionId?: string;
        registrationMethod?: "form" | "chat";
      };
    }) => data
  )
  .handler(async ({ data }) => {
    const draft = await registrationService.updateDraft(data.id, data.updates);
    return draft;
  });

/**
 * Patch draft data (incremental update)
 */
export const patchDraftData = createServerFn({ method: "POST" })
  .validator((data: { id: string; partialData: Partial<RegistrationData> }) => data)
  .handler(async ({ data }) => {
    const draft = await registrationService.patchDraftData(data.id, data.partialData);
    return draft;
  });

/**
 * Mark step as complete
 */
export const completeStep = createServerFn({ method: "POST" })
  .validator((data: { id: string; step: RegistrationStep }) => data)
  .handler(async ({ data }) => {
    const draft = await registrationService.completeStep(data.id, data.step);
    return draft;
  });

/**
 * Delete draft
 */
export const deleteDraft = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const success = await registrationService.deleteDraft(data.id);
    return { success };
  });

/**
 * Switch registration method (form ↔ chat)
 */
export const switchRegistrationMethod = createServerFn({ method: "POST" })
  .validator(
    (data: { id: string; newMethod: "form" | "chat"; sessionId?: string }) => data
  )
  .handler(async ({ data }) => {
    const draft = await registrationService.switchRegistrationMethod(
      data.id,
      data.newMethod,
      data.sessionId
    );
    return draft;
  });

/**
 * Complete registration and create user account
 */
export const completeRegistration = createServerFn({ method: "POST" })
  .validator((data: { draftId: string; password?: string }) => data)
  .handler(async ({ data }) => {
    const result = await registrationService.completeRegistration(
      data.draftId,
      data.password
    );
    return result;
  });

/**
 * Validate draft and get status
 */
export const validateDraft = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const draft = await registrationService.getDraftById(data.id);
    if (!draft) {
      return { isValid: false, error: "Draft not found" };
    }
    return registrationService.validateDraft(draft);
  });

/**
 * Get draft summary for display
 */
export const getDraftSummary = createServerFn({ method: "POST" })
  .validator((data: { id: string; language?: "he" | "en" }) => data)
  .handler(async ({ data }) => {
    const draft = await registrationService.getDraftById(data.id);
    if (!draft) {
      return { sections: [] };
    }
    return registrationService.getDraftSummary(draft, data.language || "he");
  });
