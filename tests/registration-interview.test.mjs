import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

const server = await createServer({
  configFile: false,
  cacheDir: "node_modules/.cache/registration-interview-tests",
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
});
after(() => server.close());
const { createInitialState, createMessage, getRegistrationGreeting, applyChatResponse } =
  await server.ssrLoadModule("/src/lib/conversation.ts");
const {
  applyInterviewUpdates,
  getInterviewQuestions,
  skipInterviewQuestions,
  eligibleChildren,
  ageFromBirthDate,
  generateProfileSummary,
  toRegistrationInput,
} = await server.ssrLoadModule("/src/lib/registration-interview.ts");
const { processRegistrationMessage, buildInterviewHistory, interviewTurnSchema } =
  await server.ssrLoadModule("/src/lib/ai-registration-interviewer.server.ts");
const { processUserMessage } = await server.ssrLoadModule("/src/lib/ai-service.server.ts");

const initial = () => createInitialState("test-session", "en");
const patch = (values) =>
  Object.entries(values).map(([path, value]) => ({
    path,
    value: typeof value === "string" ? value : JSON.stringify(value),
  }));
function coreState() {
  return applyInterviewUpdates(
    initial(),
    patch({
      "profile.firstName": "Dana",
      "profile.lastName": "Example",
      "profile.email": "dana@example.com",
      "profile.age": 60,
      "profile.hasHigherEducation": false,
      "profile.profession": "Engineer",
      "profile.workplace": "Example Ltd",
      "profile.militaryService": false,
      hasSpouse: false,
      hasChildren: false,
      customClub: "Rotary Haifa",
      joinYear: "2015",
    }),
  );
}
const sender = (result) => async () => ({
  response: "Thanks. Tell me more.",
  updates: [],
  skippedFields: [],
  questionFields: [],
  ...result,
});

test("the initial invitation asks for a free-form introduction in both languages", () => {
  assert.match(getRegistrationGreeting("en"), /name, age or date of birth, education/);
  assert.match(getRegistrationGreeting("en"), /partner status/);
  assert.match(getRegistrationGreeting("en"), /children aged 28/);
  assert.match(getRegistrationGreeting("he"), /שם, גיל או תאריך לידה, השכלה/);
});

test("one Claude turn extracts an introduction and asks only missing education details", async () => {
  const message =
    "I'm Dana Example, 60, an engineer with a BSc, married, and joined Rotary Haifa in 2015. My email is dana@example.com.";
  const history = [
    createMessage("assistant", getRegistrationGreeting("en")),
    createMessage("user", message),
  ];
  let calls = 0;
  const response = await processRegistrationMessage(
    message,
    history,
    initial(),
    async (messages, prompt) => {
      calls++;
      assert.equal(
        messages.filter((item) => item.role === "user" && item.content === message).length,
        1,
      );
      assert.match(prompt, /military discharge rank/);
      return {
        response: "Which institution awarded your BSc, and in which year did you graduate?",
        updates: patch({
          "profile.firstName": "Dana",
          "profile.lastName": "Example",
          "profile.age": 60,
          "profile.email": "dana@example.com",
          "profile.profession": "Engineer",
          "profile.hasHigherEducation": true,
          "profile.educationHistory.0.degree": "BSc",
          customClub: "Rotary Haifa",
          joinYear: "2015",
          hasSpouse: true,
        }),
        skippedFields: [],
        questionFields: [
          "profile.educationHistory.0.institution",
          "profile.educationHistory.0.graduationYear",
        ],
      };
    },
  );
  assert.equal(calls, 1);
  assert.equal(response.nextStage, "professional");
  assert.equal(response.state.profile.firstName, "Dana");
  assert.equal(response.state.hasSpouse, true);
  assert.deepEqual(response.state.pendingQuestions, [
    "profile.educationHistory.0.institution",
    "profile.educationHistory.0.graduationYear",
  ]);
  assert(
    !getInterviewQuestions(response.state).some((question) =>
      ["profile.age", "profile.firstName", "profile.email", "customClub", "joinYear"].includes(
        question.key,
      ),
    ),
  );
});

test("history keeps previous replies and includes the latest user message once", () => {
  const history = [
    createMessage("assistant", "Welcome"),
    createMessage("user", "My name is Dana"),
    createMessage("assistant", "Your age?"),
  ];
  const result = buildInterviewHistory("60", history);
  assert.deepEqual(
    result.map((message) => message.content),
    ["My name is Dana", "Your age?", "60"],
  );
  assert.equal(buildInterviewHistory("60", [...history, createMessage("user", "60")]).length, 3);
});

test("education corrections merge into the correct qualification without erasing other degrees", () => {
  const state = applyInterviewUpdates(
    coreState(),
    patch({
      "profile.hasHigherEducation": true,
      "profile.educationHistory.0.degree": "BSc",
      "profile.educationHistory.0.institution": "Example University",
      "profile.educationHistory.0.graduationYear": "1989",
      "profile.educationHistory.1.degree": "MSc",
      "profile.educationHistory.1.institution": "Second University",
      "profile.educationHistory.1.graduationYear": "1994",
    }),
  );
  const corrected = applyInterviewUpdates(
    state,
    patch({ "profile.educationHistory.0.graduationYear": "1990" }),
  );
  assert.equal(corrected.profile.educationHistory[0].graduationYear, "1990");
  assert.equal(corrected.profile.educationHistory[0].institution, "Example University");
  assert.equal(corrected.profile.educationHistory[1].graduationYear, "1994");
});

test("negative partner, education and military answers suppress inapplicable questions", () => {
  const questions = getInterviewQuestions(coreState());
  assert(!questions.some((question) => question.key.startsWith("spouse.")));
  assert(!questions.some((question) => question.key.startsWith("profile.educationHistory")));
  assert(!questions.some((question) => question.key === "profile.militaryDischargeRank"));
  assert(!questions.some((question) => question.key === "hasEligibleChildren"));
});

test("military rank is asked only after service is confirmed; false education answers stay answered", () => {
  const state = applyInterviewUpdates(
    coreState(),
    patch({
      "profile.militaryService": true,
      "profile.hasHigherEducation": true,
      "profile.educationHistory.0.degree": "BSc",
      "profile.educationHistory.0.completedDuringMilitaryService": false,
    }),
  );
  const questions = getInterviewQuestions(state);
  assert(questions.some((question) => question.key === "profile.militaryDischargeRank"));
  assert(!questions.some((question) => question.key.endsWith("completedDuringMilitaryService")));
});

test("optional skips are remembered; required account details cannot be skipped", async () => {
  const state = coreState();
  state.pendingQuestions = ["profile.city", "profile.phone"];
  const response = await processRegistrationMessage("skip", [], state);
  assert(
    !getInterviewQuestions(response.state).some((question) =>
      state.pendingQuestions.includes(question.key),
    ),
  );
  const skipped = skipInterviewQuestions(initial(), [
    "profile.firstName",
    "profile.age",
    "profile.email",
    "hasSpouse",
  ]);
  assert.deepEqual(skipped.skippedFields, ["hasSpouse"]);
});

test("younger and unknown-age children are excluded, including the age boundary", () => {
  const state = applyInterviewUpdates(
    coreState(),
    patch({
      hasChildren: true,
      hasEligibleChildren: true,
      "children.0.name": "Too young",
      "children.0.age": 27,
      "children.1.name": "Eligible",
      "children.1.age": 28,
      "children.2.name": "Unknown age",
    }),
  );
  assert.deepEqual(
    state.children.map((child) => child.name),
    ["Eligible"],
  );
  assert.equal(
    eligibleChildren({
      ...state,
      children: [{ name: "Not eligible", age: 40, dateOfBirth: "2010-01-01" }],
    }).length,
    0,
  );
});

test("birth dates are checked against the calendar and age advances at the birthday", () => {
  assert.equal(ageFromBirthDate("1998-10-15", new Date("2026-10-14T12:00:00Z")), 27);
  assert.equal(ageFromBirthDate("1998-10-15", new Date("2026-10-15T12:00:00Z")), 28);
  assert.equal(ageFromBirthDate("2025-02-30"), undefined);
  assert.equal(ageFromBirthDate("2999-01-01"), undefined);
});

test("unrecognized or already-answered question paths cannot repeat a known answer", async () => {
  const response = await processRegistrationMessage(
    "Continue",
    [],
    coreState(),
    sender({
      response: "What is your name?",
      questionFields: ["profile.firstName", "arbitrary.invalid"],
    }),
  );
  assert.doesNotMatch(response.messages[0].content, /What is your name/);
  assert(!response.state.pendingQuestions.includes("profile.firstName"));
});

test("untrusted field paths cannot change consent, session state or prototypes", () => {
  const state = applyInterviewUpdates(
    coreState(),
    patch({
      "__proto__.polluted": "yes",
      "profile.__proto__": "yes",
      status: "completed",
      "consent.terms": true,
      "profile.email": "invalid-email",
    }),
  );
  assert.equal({}.polluted, undefined);
  assert.equal(state.status, "in_progress");
  assert.equal(state.consent.terms, undefined);
  assert.equal(state.profile.email, "dana@example.com");
});

test("review displays collected details and finishing requires explicit confirmation", async () => {
  let state = coreState();
  state = skipInterviewQuestions(
    state,
    getInterviewQuestions(state)
      .filter((question) => !question.required)
      .map((question) => question.key),
  );
  const response = await processRegistrationMessage("That's all", [], state, sender({}));
  assert.equal(response.nextStage, "review");
  state = applyChatResponse(state, response);
  const reviewed = await processRegistrationMessage("review", [], state);
  assert.notEqual(reviewed.nextStage, "completed");
  assert.match(reviewed.messages[0].content, /Dana Example/);
  const finished = await processRegistrationMessage("finish", [], state);
  assert.equal(finished.nextStage, "completed");
  assert.equal(applyChatResponse(state, finished).profile.email, "dana@example.com");
});

test("the saved registration retains education, military and family details without invented dates", () => {
  const state = applyInterviewUpdates(
    coreState(),
    patch({
      "profile.hasHigherEducation": true,
      "profile.educationHistory.0.degree": "BSc",
      "profile.educationHistory.0.institution": "Example University",
      "profile.educationHistory.0.graduationYear": "1990",
      "profile.educationHistory.0.specialization": "Electronics",
      "profile.educationHistory.0.postGraduationActivities": "Research",
      "profile.educationHistory.0.completedDuringMilitaryService": true,
      "profile.militaryService": true,
      "profile.militaryDischargeRank": "Major",
      rotaryJoinDate: "2015-03",
      hasSpouse: true,
      "spouse.firstName": "Alex",
      "spouse.age": 59,
      "spouse.education": "MBA",
      hasChildren: true,
      hasEligibleChildren: true,
      "children.0.name": "Adult Example",
      "children.0.age": 31,
      "children.0.education": "MSc",
      "children.0.institution": "Second University",
    }),
  );
  const result = toRegistrationInput(state);
  assert.equal(result.dob, "");
  assert.equal(result.me.age, "60");
  assert.equal(result.me.educationHistory[0].graduationYear, "1990");
  assert.equal(result.me.militaryDischargeRank, "Major");
  assert.equal(result.partnerProfile.firstName, "Alex");
  assert.equal(result.children[0].age, 31);
  assert.equal(result.children[0].dob, "");
  assert.equal(result.children[0].institution, "Second University");
  assert.equal(result.rotaryJoinDate, "2015-03");
  assert.match(generateProfileSummary(state), /Research/);
  assert.match(generateProfileSummary(state), /Major/);
  assert.throws(() => toRegistrationInput(initial()), /Required registration details/);
});

test("unknown family status is preserved as undisclosed rather than assuming no partner", () => {
  const state = coreState();
  delete state.hasSpouse;
  assert.equal(toRegistrationInput(state).married, "undisclosed");
});

test("the Anthropic SDK can compile and parse the interview's structured-output schema", () => {
  const format = zodOutputFormat(interviewTurnSchema);
  assert.equal(format.type, "json_schema");
  assert.deepEqual(
    format.parse(
      JSON.stringify({ response: "Hello", updates: [], skippedFields: [], questionFields: [] }),
    ).updates,
    [],
  );
});

test("Claude failures leave collected state intact and give an honest retry/form response", async () => {
  const previousKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const state = coreState();
    const response = await processUserMessage("Continue", state, []);
    assert.match(response.messages[0].content, /temporarily unavailable/);
    assert.equal(response.nextStage, undefined);
    assert.equal(applyChatResponse(state, response).profile.email, "dana@example.com");
  } finally {
    if (previousKey !== undefined) process.env.ANTHROPIC_API_KEY = previousKey;
  }
});

test("canonical aliases for employer, role and discharge rank are stored and do not trigger follow-up questions", () => {
  const state = applyInterviewUpdates(
    initial(),
    patch({
      "profile.company": "Megatec",
      "profile.role": "Owner",
      "profile.militaryRank": "Major",
    }),
  );

  assert.equal(state.profile.workplace, "Megatec");
  assert.equal(state.profile.jobTitle, "Owner");
  assert.equal(state.profile.military?.dischargeRank, "Major");
  assert(!getInterviewQuestions(state).some((question) => question.key === "profile.workplace"));
  assert(!getInterviewQuestions(state).some((question) => question.key === "profile.jobTitle"));
  assert(!getInterviewQuestions(state).some((question) => question.key === "profile.military.dischargeRank"));
});

test("the actual SDK request carries conversation context and parses a mocked API reply", async () => {
  const { sendMessageWithSchema } = await server.ssrLoadModule("/src/lib/claude-client.server.ts");
  const previousKey = process.env.ANTHROPIC_API_KEY;
  const previousFetch = globalThis.fetch;
  process.env.ANTHROPIC_API_KEY = "test-only-key";
  let body;
  const turn = {
    response: "Which year did you graduate?",
    updates: [],
    skippedFields: [],
    questionFields: ["profile.educationHistory.0.graduationYear"],
  };
  globalThis.fetch = async (input, init) => {
    assert.equal(
      new URL(typeof input === "string" ? input : input.url).hostname,
      "api.anthropic.com",
    );
    body = JSON.parse(init.body);
    return new Response(
      JSON.stringify({
        id: "msg_test",
        type: "message",
        role: "assistant",
        model: "claude-sonnet-4-6",
        content: [{ type: "text", text: JSON.stringify(turn) }],
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 10 },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  try {
    const result = await sendMessageWithSchema(
      [{ role: "user", content: "I completed a BSc" }],
      interviewTurnSchema,
      { systemPrompt: "Ask only missing details", maxTokens: 4096 },
    );
    assert.equal(result.response, turn.response);
    assert.equal(body.messages[0].content, "I completed a BSc");
    assert.equal(body.system, "Ask only missing details");
    assert.equal(body.output_config.format.type, "json_schema");
    assert.equal(body.max_tokens, 4096);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousKey;
  }
});
