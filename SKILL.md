# Smart Registration AI Repair Skill

## Purpose

Fix the Smart Registration assistant so it understands context, resolves previously supplied information, and never re-asks answered questions. This skill is for the Rotary Connect Israel registration flow and is intentionally grounded in persistent state, schema validation, and deterministic deduplication.

## Workflow

### 1. Reproduce the failure
- Review the user message, registration state, and the next question logic.
- Check whether the user already answered the field in the current turn, earlier turns, or a saved draft.
- Confirm whether the value was lost in state merge, schema mapping, or question selection.

### 2. Trace the full data flow
- Follow the message from chat input to AI extraction and validation.
- Confirm the canonical field path and verify whether the model emitted a legacy or alias key.
- Check whether facts were merged into the draft, the current conversation state, or the saved registration record.

### 3. Normalize and canonicalize facts
- Map common alias paths to the canonical schema before persistence.
- Examples:
  - company / employer -> profile.workplace
  - role / currentRole -> profile.jobTitle
  - militaryRank / dischargeRank -> profile.military.dischargeRank
- Reject unknown or untrusted paths instead of silently mutating state.

### 4. Merge without overwriting confirmed facts
- Preserve explicit user corrections.
- Do not overwrite a higher-confidence value with a weaker inference.
- Keep multiple education, employment, and family records distinct instead of flattening them.

### 5. Recompute the next question from the latest state
- Evaluate all unresolved required fields using the merged state.
- Exclude already answered, skipped, declined, or not-applicable fields.
- Ask only one or two genuinely missing questions.

### 6. Validate before responding
- Ensure the assistant acknowledges newly learned facts and asks only for truly missing details.
- Confirm that the selected next question is backed by current state, not stale pending questions.
- Guard against duplicate asks or repeated values across the conversation.

## Decision Points

- If a fact is already present in the current draft or profile, do not ask again.
- If a value is explicitly corrected, replace the existing value instead of preserving the stale one.
- If a field is optional and explicitly declined, mark it skipped and do not re-ask in the same session.
- If a user provides multiple facts in one message, extract them all and continue to the next unresolved field.
- If a field is ambiguous or contradictory, ask a targeted clarification rather than guessing.

## Quality Criteria

- Zero repeated questions for already answered data
- Correct field assignment for the canonical schema
- All valid facts captured from each message
- Structured state persists across refresh and switching interfaces
- Required fields are resolved before the review stage
- Optional declines remain remembered and respected
- Tests cover real Hebrew examples and regression cases

## Example Prompts

- "Audit the smart registration flow for repeated-question and wrong-field mapping bugs."
- "Fix the extraction pipeline so company/role/military rank aliases map to the canonical schema and never re-ask resolved questions."
- "Add regression tests for Hebrew introductions, family facts, professional context, and duplicate follow-ups."

## Related Customizations

- Add a stricter canonical field map for additional synonyms and legacy keys.
- Add a state-aware deduplication service for all questionnaire paths.
- Add end-to-end tests that cover cross-interface synchronization between chat and form registration.
