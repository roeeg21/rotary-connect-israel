import { createServerFn } from "@tanstack/react-start";

import { registrationSchema } from "./user-registration";
import { upsertUserRegistration } from "./users.server";

export const saveUserRegistration = createServerFn({ method: "POST" })
  .validator(registrationSchema)
  .handler(async ({ data }) => {
    await upsertUserRegistration(data);
    return { ok: true };
  });
