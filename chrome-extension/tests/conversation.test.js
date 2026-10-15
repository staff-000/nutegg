// ============================================================
// NutEgg Conversation Mind Map Unit Tests
// ============================================================

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const bundlePath = path.join(__dirname, "../dist/ai-core.js");
const bundleCode = fs.readFileSync(bundlePath, "utf8");
const NutEggAI = new Function(bundleCode + "\nreturn NutEggAI;")();

require("../src/i18n.js");
const { MindmapComponent, renderMindMap } = require("../src/popup/ui/mindmap.js");

const { conversationHints, sanitizeConversationMeta, normalizeConversationMindMap, stripConversationFields } = NutEggAI;

test("conversationHints extracts format clues and markers", () => {
  // AMA clue
  const amaCapture = {
    title: "Live Q&A Session - Ask Me Anything #12",
    content: "Welcome everyone to today's AMA. Let's answer your top questions.\nQ: What is NutEgg?\nA: A reading assistant.\nQ: How does it work?\nA: Using browser AI.",
  };
  const amaHints = conversationHints(amaCapture);
  assert.ok(amaHints.includes("(ama)"));
  assert.ok(amaHints.includes("speaker-turn markers detected"));

  // Podcast clue
  const podcastCapture = {
    title: "Tech Talks Podcast Episode 42: Future of AI",
    content: ">> Welcome back to the podcast.\n>> Today our guest is Alice.\n>> Great to be here.",
  };
  const podcastHints = conversationHints(podcastCapture);
  assert.ok(podcastHints.includes("(podcast)"));
  assert.ok(podcastHints.includes("speaker-turn markers detected"));

  // Interview clue (Chinese)
  const interviewCapture = {
    title: "深度专访：对话顶尖架构师",
    content: "主持人：欢迎来到本期专访。\n嘉宾：很高兴接受采访。",
  };
  const interviewHints = conversationHints(interviewCapture);
  assert.ok(interviewHints.includes("(interview)"));

  // Negative control: solo lecture / monologue article
  const lectureCapture = {
    title: "Introduction to Calculus - Chapter 1",
    content: "In this lecture, we introduce limits and derivatives. Consider a continuous function f(x).",
  };
  const lectureHints = conversationHints(lectureCapture);
  assert.equal(lectureHints, "");
});

test("sanitizeConversationMeta verifies evidence and enforces safety rules", () => {
  const sourceText = "Today on the show, Alice joins us to discuss distributed systems. Alice says this is great.";

  // Valid named participant with supporting evidence in source text
  const validMeta = {
    format: "interview",
    confidence: "high",
    participants: [
      { id: "host", role: "host", named: false },
      {
        id: "alice",
        role: "guest",
        name: "Alice",
        named: true,
        evidence: { quote: "Alice joins us to discuss distributed systems" },
      },
    ],
  };
  const sanitized = sanitizeConversationMeta(validMeta, sourceText);
  assert.equal(sanitized.format, "interview");
  assert.equal(sanitized.confidence, "high");
  assert.equal(sanitized.participants.length, 2);
  assert.equal(sanitized.participants[1].named, true);
  assert.equal(sanitized.participants[1].name, "Alice");

  // Hallucinated name without evidence in source text -> downgraded to named: false
  const hallucinatedMeta = {
    format: "podcast",
    participants: [
      {
        id: "bob",
        role: "guest",
        name: "Bob Dylan",
        named: true,
        evidence: { quote: "Bob Dylan sings a song" }, // not in source text
      },
    ],
  };
  const downgraded = sanitizeConversationMeta(hallucinatedMeta, sourceText);
  assert.equal(downgraded.participants[0].named, false);
  assert.equal(downgraded.participants[0].name, undefined);

  // Unknown format normalized to monologue
  const unknownMeta = { format: "invalid_format", participants: [] };
  const normalizedUnknown = sanitizeConversationMeta(unknownMeta, sourceText);
  assert.equal(normalizedUnknown.format, "monologue");
});

test("conversation mindmap renders participants strip, timeline, badges and speaker chips", (t) => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => {
    global.document = previousDocument;
    dom.window.close();
  });

  const nodes = [
    {
      name: "Opening & System Architecture",
      time: "01:00",
      kind: "topic",
      children: [
        {
          name: "How does the caching layer operate?",
          time: "01:15",
          kind: "question",
          askedBy: "audience",
          children: [
            {
              name: "It uses an in-memory LRU store with disk persistence",
              time: "01:30",
              kind: "answer",
              speakers: ["guest_alice"],
              stance: "agree",
            },
            {
              name: "We found disk persistence adds latency under peak loads",
              time: "02:00",
              kind: "disagreement",
              speakers: ["host"],
              stance: "disagree",
            },
          ],
        },
      ],
    },
    {
      name: "Scaling Challenges",
      time: "05:00",
      kind: "topic",
      children: [
        {
          name: "What happens during network partitions?",
          time: "05:20",
          kind: "question",
          askedBy: "host",
          children: [
            {
              name: "Nodes enter read-only mode to prevent split-brain",
              kind: "example",
              speakers: ["guest_alice"],
            },
          ],
        },
      ],
    },
  ];

  const conversation = {
    format: "interview",
    confidence: "high",
    participants: [
      { id: "host", role: "host", name: "Bob", named: true },
      { id: "guest_alice", role: "guest", name: "Alice", named: true, evidence: { time: "00:45" } },
      { id: "audience", role: "audience", named: false },
    ],
  };

  const component = new MindmapComponent(document);
  component.render(nodes, true, null, false, conversation);

  const tree = document.getElementById("mindmap-tree");

  // 1. Participants strip is not rendered (clean UI)
  assert.equal(tree.querySelector("#mindmap-participants"), null, "Participants strip should be removed");

  // 2. Timeline chips
  const timeline = tree.querySelector(".mindmap-timeline");
  assert.ok(timeline, "Timeline should be rendered for multiple topics");
  const timelineChips = timeline.querySelectorAll(".mindmap-timeline-chip");
  assert.equal(timelineChips.length, 2);
  assert.equal(timelineChips[0].dataset.time, "01:00");
  assert.equal(timelineChips[1].dataset.time, "05:00");

  // 3. Kind Badges
  const questionBadge = tree.querySelector(".mindmap-kind-badge.kind-question");
  assert.ok(questionBadge, "Question kind badge should be rendered");
  const answerBadge = tree.querySelector(".mindmap-kind-badge.kind-answer");
  assert.ok(answerBadge, "Answer kind badge should be rendered");
  const disagreementBadge = tree.querySelector(".mindmap-kind-badge.kind-disagreement");
  assert.ok(disagreementBadge, "Disagreement kind badge should be rendered");

  // 4. AskedBy badge and speaker chips are removed
  assert.equal(tree.querySelector(".mindmap-askedby-badge"), null, "AskedBy badge should be removed");
  assert.equal(tree.querySelector(".mindmap-speaker-chip"), null, "Speaker chips should be removed");

  // 5. Stance badges
  const agreeBadge = tree.querySelector(".mindmap-stance-badge.stance-agree");
  assert.ok(agreeBadge, "Agree stance badge should be rendered");
  const disagreeBadge = tree.querySelector(".mindmap-stance-badge.stance-disagree");
  assert.ok(disagreeBadge, "Disagree stance badge should be rendered");
});

test("questionsOnly filter flattens tree to question nodes and triggers toggle callback", (t) => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => {
    global.document = previousDocument;
    dom.window.close();
  });

  const nodes = [
    {
      name: "Topic 1",
      kind: "topic",
      children: [
        {
          name: "Question A?",
          kind: "question",
          children: [{ name: "Answer A", kind: "answer" }],
        },
      ],
    },
    {
      name: "Topic 2",
      kind: "topic",
      children: [
        {
          name: "Question B?",
          kind: "question",
          children: [{ name: "Answer B", kind: "answer" }],
        },
      ],
    },
  ];

  const conversation = {
    format: "ama",
    confidence: "high",
    participants: [{ id: "host", role: "host", named: false }],
  };

  let toggleCalled = null;
  const options = {
    questionsOnly: true,
    onToggleQuestionsOnly: (val) => {
      toggleCalled = val;
    },
  };

  const component = new MindmapComponent(document);
  component.render(nodes, true, null, false, conversation, options);

  const tree = document.getElementById("mindmap-tree");

  // In questionsOnly mode, the top-level nodes rendered should be the question nodes
  const rootNodes = tree.querySelectorAll(':scope > .mindmap-node');
  assert.equal(rootNodes.length, 2, "Should render 2 flattened question nodes at root level");
  assert.ok(rootNodes[0].textContent.includes("Question A?"));
  assert.ok(rootNodes[1].textContent.includes("Question B?"));

  // Clicking filter toggle button triggers onToggleQuestionsOnly
  const toggleBtn = tree.querySelector(".mindmap-filter-toggle");
  assert.ok(toggleBtn, "Filter toggle button should exist");
  assert.ok(toggleBtn.classList.contains("active"), "Toggle button should be active");
  toggleBtn.click();
  assert.equal(toggleCalled, false, "Clicking should toggle questionsOnly to false");
});

test("fallback renders identical standard DOM when conversation is monologue or absent", (t) => {
  const dom = new JSDOM('<div id="mindmap-section"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => {
    global.document = previousDocument;
    dom.window.close();
  });

  const nodes = [
    {
      name: "Standard Concept",
      time: "02:00",
      children: [{ name: "Detail Point", detail: "Some extra info" }],
    },
  ];

  // Render without conversation
  const component = new MindmapComponent(document);
  component.render(nodes, true);
  const tree = document.getElementById("mindmap-tree");

  assert.equal(tree.querySelector("#mindmap-participants"), null);
  assert.equal(tree.querySelector(".mindmap-conversation-header"), null);
  assert.equal(tree.querySelector(".mindmap-timeline"), null);
  assert.equal(tree.querySelector(".mindmap-kind-badge"), null);
  assert.equal(tree.querySelector(".mindmap-speaker-chip"), null);
  assert.equal(tree.querySelectorAll(".mindmap-node").length, 2);

  // Render with monologue format
  component.render(nodes, true, null, false, { format: "monologue", participants: [] });
  assert.equal(tree.querySelector("#mindmap-participants"), null);
  assert.equal(tree.querySelector(".mindmap-conversation-header"), null);
});

test("normalizeConversationMindMap handles format downgrade, sorting, and budget caps", () => {
  // 1. Format downgrade when 0 questions and <= 1 speaker
  const emptyMindMap = [
    { name: "Introduction to Topic", kind: "topic", children: [{ name: "Fact 1", kind: "answer" }] },
  ];
  const fakeConversation = {
    format: "podcast",
    confidence: "high",
    participants: [{ id: "host", role: "host", named: false }],
  };
  const downgraded = normalizeConversationMindMap(emptyMindMap, fakeConversation);
  assert.equal(downgraded.conversation.format, "monologue", "Should downgrade to monologue when no questions and 1 speaker");

  // 2. Chronological sorting of level-1 topics when timed
  const unorderedNodes = [
    { name: "Closing remarks", time: "25:00", kind: "topic" },
    { name: "Opening discussion", time: "01:10", kind: "topic" },
    { name: "Middle deep dive", time: "10:30", kind: "topic" },
  ];
  const sorted = normalizeConversationMindMap(unorderedNodes, {
    format: "interview",
    participants: [
      { id: "host", role: "host", named: false },
      { id: "guest", role: "guest", named: false },
    ],
  });
  assert.deepEqual(
    sorted.mindMap.map((n) => n.time),
    ["01:10", "10:30", "25:00"],
    "Level-1 topics should be sorted chronologically"
  );

  // 3. Budget cap: max 8 topics
  const tenTopics = Array.from({ length: 10 }, (_, i) => ({
    name: `Topic ${i + 1}`,
    time: `0${i + 1}:00`,
    kind: "topic",
    children: [{ name: `Question ${i + 1}`, kind: "question" }],
  }));
  const cappedTopics = normalizeConversationMindMap(tenTopics, {
    format: "panel",
    participants: [
      { id: "p1", role: "host", named: false },
      { id: "p2", role: "guest", named: false },
    ],
  });
  assert.equal(cappedTopics.mindMap.length, 9, "Top 8 topics + 1 rollup node = 9 nodes");
  assert.equal(cappedTopics.mindMap[8].name, "+2 more topics");
  assert.ok(cappedTopics.mindMap[8].detail.includes("Topic 9"));

  // 4. Budget cap: max 6 questions per topic
  const eightQuestionsTopic = [
    {
      name: "Mega Topic",
      kind: "topic",
      children: Array.from({ length: 8 }, (_, i) => ({
        name: `Q${i + 1}`,
        kind: "question",
      })),
    },
  ];
  const cappedQuestions = normalizeConversationMindMap(eightQuestionsTopic, {
    format: "ama",
    participants: [
      { id: "host", role: "host", named: false },
      { id: "audience", role: "audience", named: false },
    ],
  });
  assert.equal(cappedQuestions.mindMap[0].children.length, 7, "Top 6 questions + 1 rollup node = 7 questions");
  assert.equal(cappedQuestions.mindMap[0].children[6].name, "+2 more questions");
});

test("optimizeForConversation switch controls AI workflow and mindmap UI", async (t) => {
  // 1. Mindmap UI fallback when optimizeForConversation is false
  const dom = new JSDOM('<div id="container"><div id="mindmap-tree"></div></div>');
  const previousDocument = global.document;
  global.document = dom.window.document;
  t.after(() => {
    global.document = previousDocument;
    dom.window.close();
  });
  const container = dom.window.document.getElementById("container");
  const testNodes = [
    {
      name: "01:00 Intro",
      kind: "topic",
      children: [{ name: "What is NutEgg?", kind: "question" }],
    },
  ];
  const testConv = { format: "interview", participants: [{ id: "p1", role: "host", named: false }] };

  // When optimizeForConversation is false, render original standard DOM
  renderMindMap(testNodes, container, null, testConv, { optimizeForConversation: false });
  assert.equal(container.querySelector(".mindmap-conversation-header"), null);
  assert.equal(container.querySelector(".mindmap-timeline"), null);
  assert.ok(container.querySelector(".mindmap-node"));

  // 2. AIProcessor respects optimizeForConversation: false
  const recordedPrompts = [];
  const fakeAIClient = {
    chat: async (prompt) => {
      recordedPrompts.push(prompt);
      return JSON.stringify({
        titleVerdict: "Direct answer",
        coreSummary: ["Insight 1"],
        conversation: { format: "interview", confidence: "high", participants: [{ id: "p1", role: "host", named: false }] },
        mindMap: [{ name: "Topic", kind: "topic", children: [{ name: "Question", kind: "question" }] }],
      });
    },
  };

  // With optimizeForConversation: false
  const processorDisabled = new NutEggAI.AIProcessor({
    settings: { optimizeForConversation: false, aiApiKey: "dummy-key" },
    isConfigured: () => true,
    aiClient: fakeAIClient,
  });
  const resDisabled = await processorDisabled.analyzeContent({
    url: "https://youtube.com/watch?v=123",
    title: "Interview with Expert",
    content: "Interviewer: What is AI?\nExpert: AI is intelligence.",
    sourceType: "youtube",
    optimizeForConversation: false,
  });
  // Result must NOT have conversation field
  assert.equal(resDisabled.conversation, undefined);
  // Prompts must not include conversation hints or rules
  const lastPromptDisabled = recordedPrompts[recordedPrompts.length - 1];
  assert.ok(!lastPromptDisabled.includes("Conversation & Discussion Formats"));

  // With optimizeForConversation: true (default)
  const processorEnabled = new NutEggAI.AIProcessor({
    settings: { optimizeForConversation: true, aiApiKey: "dummy-key" },
    isConfigured: () => true,
    aiClient: fakeAIClient,
  });
  const resEnabled = await processorEnabled.analyzeContent({
    url: "https://youtube.com/watch?v=123",
    title: "Interview with Expert",
    content: "Interviewer: What is AI?\nExpert: AI is intelligence.",
    sourceType: "youtube",
  });
  // Result must have conversation metadata
  assert.ok(resEnabled.conversation);
  assert.equal(resEnabled.conversation.format, "interview");
  const lastPromptEnabled = recordedPrompts[recordedPrompts.length - 1];
  assert.ok(lastPromptEnabled.includes("Conversation & Discussion Formats"));
});

test("stripConversationFields completely removes conversational fields while preserving sources and hierarchy", () => {
  const contaminated = [
    {
      name: "Core Concept",
      kind: "topic",
      askedBy: "host",
      speakers: ["alice"],
      stance: "agree",
      time: "02:15",
      detail: "Explaining the architecture",
      sources: [{ ref: "Section 1", quote: "The core architecture is decentralized." }],
      children: [
        {
          name: "Sub Concept",
          kind: "question",
          askedBy: "p2",
          speakers: ["p1"],
          stance: "disagree",
          detail: "Detail explanation",
          sources: [{ ref: "Section 1.1", quote: "Decentralized consensus requires quorum." }],
        },
      ],
    },
  ];

  const cleaned = stripConversationFields(contaminated);

  assert.equal(cleaned[0].name, "Core Concept");
  assert.equal(cleaned[0].kind, undefined);
  assert.equal(cleaned[0].askedBy, undefined);
  assert.equal(cleaned[0].speakers, undefined);
  assert.equal(cleaned[0].stance, undefined);
  assert.equal(cleaned[0].time, "02:15");
  assert.equal(cleaned[0].detail, "Explaining the architecture");
  assert.deepEqual(cleaned[0].sources, [{ ref: "Section 1", quote: "The core architecture is decentralized." }]);

  assert.equal(cleaned[0].children[0].name, "Sub Concept");
  assert.equal(cleaned[0].children[0].kind, undefined);
  assert.equal(cleaned[0].children[0].askedBy, undefined);
  assert.equal(cleaned[0].children[0].speakers, undefined);
  assert.equal(cleaned[0].children[0].stance, undefined);
  assert.equal(cleaned[0].children[0].detail, "Detail explanation");
  assert.deepEqual(cleaned[0].children[0].sources, [{ ref: "Section 1.1", quote: "Decentralized consensus requires quorum." }]);
});

test("AIProcessor guarantees monologue and article mind maps have zero dialogue tag contamination", async () => {
  const fakeAIClient = {
    chat: async () => {
      return JSON.stringify({
        titleVerdict: "Direct answer to thesis",
        coreSummary: ["Key takeaway 1", "Key takeaway 2"],
        conversation: {
          format: "monologue",
          confidence: "high",
          participants: [],
        },
        mindMap: [
          {
            name: "Neural Network Architecture",
            kind: "topic",
            askedBy: "interviewer",
            speakers: ["prof"],
            detail: "Feedforward and recurrent networks",
            sources: [{ ref: "Introduction", quote: "Neural networks model nonlinear functions." }],
            children: [
              {
                name: "Backpropagation",
                kind: "answer",
                speakers: ["prof"],
                detail: "Gradient descent via chain rule",
                sources: [{ ref: "Chapter 2", quote: "Gradients propagate backwards through layers." }],
              },
            ],
          },
        ],
      });
    },
  };

  const processor = new NutEggAI.AIProcessor({
    settings: { optimizeForConversation: true, aiApiKey: "dummy-key" },
    isConfigured: () => true,
    aiClient: fakeAIClient,
  });

  const res = await processor.analyzeContent({
    url: "https://example.com/deep-learning-paper",
    title: "Deep Learning Foundations: An Academic Overview",
    content: "Neural networks model nonlinear functions. Gradients propagate backwards through layers.",
    sourceType: "article",
  });

  // Since conversation format is monologue, conversation property should be omitted from return value
  assert.equal(res.conversation, undefined, "Monologue results must omit conversation property");

  // Mind map nodes must have all dialogue tags stripped
  const root = res.mindMap[0];
  assert.equal(root.name, "Neural Network Architecture");
  assert.equal(root.kind, undefined, "kind must be stripped on monologue nodes");
  assert.equal(root.askedBy, undefined, "askedBy must be stripped on monologue nodes");
  assert.equal(root.speakers, undefined, "speakers must be stripped on monologue nodes");
  assert.equal(root.stance, undefined, "stance must be stripped on monologue nodes");
  assert.equal(root.detail, "Feedforward and recurrent networks");
  assert.deepEqual(root.sources, [{ ref: "Introduction", quote: "Neural networks model nonlinear functions." }]);

  const child = root.children[0];
  assert.equal(child.name, "Backpropagation");
  assert.equal(child.kind, undefined, "child kind must be stripped");
  assert.equal(child.speakers, undefined, "child speakers must be stripped");
  assert.equal(child.detail, "Gradient descent via chain rule");
  assert.deepEqual(child.sources, [{ ref: "Chapter 2", quote: "Gradients propagate backwards through layers." }]);
});

test("chained execution when optimizeForConversation is on: summary classifies format and feeds into mind map", async () => {
  const callSequence = [];
  const promptsSeen = [];

  const fakeAIClient = {
    chat: async (prompt) => {
      promptsSeen.push(prompt);
      if (prompt.includes("## Task\n1. Title Verdict")) {
        // Summary call
        callSequence.push("summary");
        return JSON.stringify({
          titleVerdict: "French tech interview answer",
          coreSummary: ["Point 1", "Point 2"],
          format: "interview",
        });
      } else {
        // Mind map call
        callSequence.push("mindmap");
        return JSON.stringify({
          mindMap: [
            {
              name: "French Tech Innovation",
              kind: "topic",
              children: [
                {
                  name: "Question sur les modèles?",
                  kind: "question",
                  children: [{ name: "Réponse détaillée", kind: "answer" }],
                },
              ],
            },
          ],
        });
      }
    },
  };

  const progressEvents = [];
  const processor = new NutEggAI.AIProcessor({
    settings: { optimizeForConversation: true, aiApiKey: "dummy-key" },
    isConfigured: () => true,
    aiClient: fakeAIClient,
  });

  const res = await processor.analyzeContent(
    {
      url: "https://example.com/french-interview",
      title: "Entretien exclusif avec le chercheur",
      content: "Merci d'avoir accepté notre invitation. Aujourd'hui nous parlons d'IA.",
      sourceType: "video",
      optimizeForConversation: true,
    },
    (evt) => progressEvents.push(evt)
  );

  // 1. Summary call ran BEFORE mind map call
  assert.deepEqual(callSequence, ["summary", "mindmap"], "Summary must run before mindmap when optimize is on");

  // 2. Summary partial event fired first
  assert.equal(progressEvents[0].type, "partial");
  assert.equal(progressEvents[0].section, "summary");
  assert.equal(progressEvents[0].data.titleVerdict, "French tech interview answer");

  // 3. Mind map prompt received the verified format
  const mindMapPrompt = promptsSeen[1];
  assert.ok(
    mindMapPrompt.includes("Verified interview"),
    "Mind map prompt should receive AI-detected format clue"
  );
  assert.ok(
    mindMapPrompt.includes("French tech interview answer"),
    "Mind map prompt should receive verdict context"
  );

  // 4. Result retains conversation metadata
  assert.ok(res.conversation);
  assert.equal(res.conversation.format, "interview");
  assert.equal(res.mindMap[0].kind, "topic");
});

test("parallel execution when optimizeForConversation is off: no waiting for classification", async () => {
  let summaryStarted = false;
  let mindmapStarted = false;
  let summaryCompleted = false;
  let mindmapCompleted = false;
  let wasConcurrent = false;

  const fakeAIClient = {
    chat: async (prompt) => {
      if (prompt.includes("## Task\n1. Title Verdict")) {
        summaryStarted = true;
        if (mindmapStarted) wasConcurrent = true;
        await new Promise((r) => setTimeout(r, 10));
        summaryCompleted = true;
        return JSON.stringify({
          titleVerdict: "Direct answer",
          coreSummary: ["Point 1"],
        });
      } else {
        mindmapStarted = true;
        if (summaryStarted) wasConcurrent = true;
        await new Promise((r) => setTimeout(r, 10));
        mindmapCompleted = true;
        return JSON.stringify({
          mindMap: [{ name: "Topic 1", children: [] }],
        });
      }
    },
  };

  const processor = new NutEggAI.AIProcessor({
    settings: { optimizeForConversation: false, aiApiKey: "dummy-key" },
    isConfigured: () => true,
    aiClient: fakeAIClient,
  });

  const res = await processor.analyzeContent({
    url: "https://example.com/french-interview",
    title: "Entretien exclusif avec le chercheur",
    content: "Merci d'avoir accepté notre invitation. Aujourd'hui nous parlons d'IA.",
    sourceType: "video",
    optimizeForConversation: false,
  });

  assert.equal(wasConcurrent, true, "Both calls should launch concurrently when optimize is off");
  assert.equal(summaryCompleted, true);
  assert.equal(mindmapCompleted, true);
  assert.equal(res.conversation, undefined);
});



