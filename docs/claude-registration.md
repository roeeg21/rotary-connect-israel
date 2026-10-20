# Claude registration interview

Add `ANTHROPIC_API_KEY` to `.env.local` and restart the development server. The key is read on the server and is never sent to the browser. For a deployed site, configure this secret in the hosting environment. Optional `ANTHROPIC_MODEL` and `ANTHROPIC_SEARCH_MODEL` overrides must name a model supporting structured output. The default is `claude-sonnet-4-6`.

The opening message invites a free-form introduction in Hebrew or English: name, age or birth date, education, work, Rotary membership, partner status and children aged 28 or older. Claude reads the complete conversation and returns both profile updates and one or two follow-up questions in a single structured API response.

Follow-ups cover missing institutions, graduation years, specialization, further study or professional activity, studies during military service, discharge rank when applicable, and Rotary joining date. Known or declined answers are not asked again. Multiple qualifications are kept as separate education records. An age is stored as an age; birth dates and exact joining dates are never fabricated from years.

Education, military, partner, children and networking questions can be skipped. False answers such as no partner, no higher education or no military service suppress related follow-ups. The existing site policy accepts children aged **28 and older**; children below that age or without a confirmed eligible age are excluded from extracted and saved profiles. Family data does not automatically become searchable.

The user reviews the collected details before explicitly choosing to finish. Required account details are validated on the server. Education and service details are saved in the registration document alongside `interviewProfile` and `partnerProfile`; age-only records keep the birth date empty. Saving failures prevent the client from signing in as if registration succeeded.

If Claude is unconfigured or unavailable, the conversation is preserved and a retry/form message appears. The alternative registration form remains available. No API calls are made from the browser. This integration does not change the application's authentication system.

Run the regression tests with `node --test tests/registration-interview.test.mjs`. The tests use synthetic data and mocked Claude responses; they do not call Anthropic or write to MongoDB.

API implementation references: [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) and [TypeScript Messages API](https://platform.claude.com/docs/en/api/typescript/messages).
