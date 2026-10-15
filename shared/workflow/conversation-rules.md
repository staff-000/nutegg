### Conversation & Discussion Formats (AMA, Podcast, Interview, Panel, Debate)
Detect conversational format from the actual content and interaction structure, not just title keywords:
- If the content represents an interview, podcast, AMA, panel, or debate (e.g. a host/journalist questioning an author/expert, an exchange between speakers, or a presenter answering audience questions), classify as conversational (`interview`, `podcast`, `ama`, `panel`, `debate`).
- **Do NOT default to "monologue" merely because captions lack speaker tags** (such as YouTube auto-captions without `>>` or punctuation) or because the title is phrased as a narrative topic. Look for dialogic markers in the spoken text: one speaker welcoming/introducing another, asking questions ("Why did you...", "Do you think...", "Tell us about..."), or back-and-forth exchanges.
1. **Identify the format & participants first**:
   - Set `"conversation"`: `{"format": "interview"|"podcast"|"ama"|"panel"|"debate"|"monologue", "confidence": "high"|"medium", "participants": [{"id": "p1", "label": "Speaker Name or Role", "role": "host"|"guest"|"audience"|"moderator"|"panelist"|"unknown", "named": true|false, "evidence": {"ref": "00:15", "quote": "introductory quote where name/role is stated"}}]}`.
   - **Names require explicit source evidence**: Only mark `named: true` if the person is explicitly named in the content (title, intro, greeting, caption label). If unnamed, use a descriptive role label (e.g. "Host", "Guest", "Audience Member", "Caller") with `named: false`. Do NOT invent or assume names.
   - For an **AMA** with a single presenter answering questions, define the presenter as `host` and `"Audience"` as `audience`.
2. **Structure the Mind Map around the Conversation Flow**:
   - **Level 1 (Topics)**: Chronological topics or discussion themes in the order they were first raised (e.g., "AI Regulation", "Model Training", "Career Advice"). Set `time` to when the topic begins.
   - **Level 2 (Questions / Core Inquiries)**: The key questions or focal prompts raised by the host, guest, or audience under that topic. Use `"kind": "question"`, `"askedBy": "p2"`, and the exact `time` the question was asked. Paraphrase the question only to make it concise and clear.
   - **Level 3 (Answers, Claims, Disagreements, Examples)**:
     - `"kind": "answer"`: The substantive answer or resolution provided. Include `"speakers": ["p1"]`, `time`, and actionable reasoning/mechanisms.
     - `"kind": "disagreement"`: When a participant pushes back or presents an opposing view, with `"stance": "disagree"` and `"speakers": ["p2"]`. Do NOT average conflicting views into consensus.
     - `"kind": "example"`: A concrete illustrative case or demonstration shared in the response.
     - `"kind": "takeaway"`: A concluding insight or consensus reached.
3. **Budget & Conciseness**:
   - Limit to at most 8 core topics and up to 6 key questions per topic.
   - For rapid-fire or large AMAs with many brief questions, group secondary questions under a single question node named `"+N quick questions"` with details in the body.
4. **Standard Articles, Essays, Documentation, Reporting, & Solo Lectures (Monologue)**:
   - If the content is written text (article, essay, news, report, documentation, tutorial) or a solo presentation/lecture (one speaker explaining concepts, even if quoting sources or using rhetorical questions), classify as `"monologue"`.
   - Set `"conversation": {"format": "monologue", "participants": [], "confidence": "high"}`.
   - Construct the mind map using standard hierarchical concept outline rules (main theme → core thesis / concept → detail / mechanism / evidence).
   - **DO NOT force interview structure, DO NOT invent host/guest roles, and DO NOT tag nodes with conversation kinds (`kind: "question"`, `kind: "answer"`, etc.) or speaker attributes.** Standard concept trees must remain clean, accurate, and faithful to the source material.

