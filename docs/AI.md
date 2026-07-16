# MetaMinds AI Strategy

**AI is a tool at MetaMinds, not the product.**

The product is human connection, personalized mentorship, and compounding knowledge.
AI makes the tutors more effective, the curriculum smarter, and the practice more adaptive.
AI never replaces the relationship between a student and their mentor.

---

## AI Philosophy

### The Human-in-the-Loop Principle

Every AI output at MetaMinds passes through a human before reaching a student.

| AI Action | Human Gate |
|-----------|-----------|
| Generate curriculum plan | Tutor reviews + approves |
| Generate homework problems | Tutor reviews + assigns |
| Draft parent update | Tutor edits + sends |
| Flag skill gaps | Tutor decides what to prioritize |
| Generate practice questions | Tutor approves question bank |
| Recommend next lesson | Student + tutor can override |

No AI output auto-publishes to students. This is non-negotiable.

### The Knowledge Constraint

AI at MetaMinds **only uses MetaMinds knowledge**.

- AI does not search the internet to generate lessons
- AI does not hallucinate questions or answer keys
- AI selects from the approved `knowledge/` base only
- If the knowledge base doesn't have a lesson, the AI cannot generate it — instead it flags the gap for a human to fill

This protects quality. Parents trust MetaMinds because every lesson was written and reviewed by a real educator.

---

## AI Use Cases — Current & Planned

### Phase 1 (Current — No AI Yet)
The current platform is human-powered. This is correct. Build the foundation before adding AI.

---

### Phase 2 — AI Assists Tutors

#### 1. Parent Update Assistant

**Trigger:** Tutor clicks "Draft Update" in the Updates section  
**Input:** Last N session notes + homework grades + skill mastery changes  
**Output:** Structured draft update (Summary / What Went Well / Areas to Improve / Next Steps)  
**Human Gate:** Tutor edits and sends  

```
Prompt template (internal):
  You are a tutor at MetaMinds STEM Academy.
  Using the session notes and homework data below, write a parent update.
  Follow this exact structure:
  - Overall Summary (2-3 sentences)
  - What Went Well (bullet list)
  - Areas to Improve (bullet list)
  - Next Steps (numbered list)
  Do not invent progress. Use only the data provided.

  Session Notes: [...]
  Homework Results: [...]
```

#### 2. Skill Gap Detector

**Trigger:** After session is marked complete  
**Process:** Compare session topic skills against student's `skill_mastery` data  
**Output:** Highlighted skills below 70% mastery  
**Human Gate:** Tutor sees alert in their dashboard, decides what to do  

---

### Phase 3 — AI Curriculum Assembly

#### 3. Curriculum Builder

**Trigger:** Tutor starts a new student or launches a new course  
**Input:** Student profile, goal, timeline, current skill mastery  
**Process:**  
1. Run diagnostic assessment → identify entry point
2. Query `knowledge/` for the right skill sequence
3. Build 8–16 week curriculum: lessons, homework, assessments
4. Estimate improvement per week

**Output:** Personalized curriculum plan  
**Human Gate:** Tutor reviews every lesson before publishing

**What AI cannot do:**
- Assign a lesson that does not exist in `knowledge/`
- Skip prerequisites in the skill sequence
- Change the difficulty rating of a lesson

#### 4. Adaptive Practice Engine

**Trigger:** Student opens AI Practice in MetaMinds Lab  
**Process:**  
1. Load student's `skill_mastery` profile
2. Select a skill at 40–70% mastery (learning zone)
3. Select a question at appropriate difficulty from the question bank
4. Evaluate answer → update mastery
5. Select next question based on result

**Learning Zone Logic:**
- Below 40%: Back to fundamentals
- 40–70%: Active learning zone — serve questions here
- Above 70%: Serve stretch questions or move to next skill

**Mastery Update Formula (simple, V1):**
```
Correct answer: mastery = mastery + (100 - mastery) * 0.1
Wrong answer: mastery = mastery - mastery * 0.05
```

#### 5. Homework Generator

**Trigger:** Tutor opens Homework tab and clicks "Generate"  
**Input:** Subject + skills to target + difficulty  
**Process:** Select questions from question bank matching the skills  
**Output:** 5-question homework set with answer key  
**Human Gate:** Tutor reviews and assigns  

---

### Phase 4 — AI Student Experience

#### 6. Learning Path AI

When a student logs in, the AI:
- Reviews skill mastery changes since last session
- Updates the recommended next lesson
- Surfaces a relevant tip or challenge
- Celebrates skills that crossed a mastery threshold

This is display only — no decisions made without tutor confirmation.

#### 7. Study Tip Personalization

Current: Tips are static (day-of-week rotation)  
Future: Tips are personalized to the student's actual skill gaps, upcoming sessions, and recent activity.

---

## AI Safety Rules

1. **No PII in AI prompts.** Strip student names, parent names, and contact information before sending to any AI API. Use IDs internally.

2. **No AI in grade computation.** Homework grades are set by tutors. AI may suggest a grade but cannot auto-assign.

3. **No AI in session cancellations or rescheduling.** These have financial implications. Humans only.

4. **Log all AI outputs.** Every AI-generated text should be stored with its prompt, output, tutor edits, and final sent version. This creates a training dataset for future fine-tuning.

5. **Audit trail for curriculum.** Every AI-assembled curriculum must record which knowledge base files it selected from, and the tutor who approved it.

6. **Rate limits.** AI features should have per-user rate limits to control costs and prevent abuse.

---

## AIPrep.study Integration

AIPrep.study is a future MetaMinds product — an AI-powered adaptive practice platform.

**Integration plan:**
- Single sign-on via MetaMinds auth
- Practice attempts in AIPrep feed into MetaMinds `skill_mastery` table
- MetaMinds curriculum can assign AIPrep practice sets as homework
- Analytics are visible in both platforms

The MetaMinds knowledge base becomes the question bank for AIPrep.

---

## AI Model Selection

For MetaMinds AI features:

| Use Case | Model Preference | Notes |
|----------|-----------------|-------|
| Parent update drafting | Claude Haiku 4.5+ | Low latency, cost-efficient |
| Curriculum assembly | Claude Sonnet 4.6+ | Needs strong reasoning |
| Question generation | Claude Haiku 4.5+ | High volume, simple task |
| Skill gap analysis | Rule-based first | No LLM needed for V1 |
| Adaptive question selection | Rule-based | Deterministic preferred |

Use Claude via the Anthropic API. Use the latest available model IDs:
- `claude-haiku-4-5-20251001`
- `claude-sonnet-4-6`

Never hardcode model IDs in components — use constants in a config file.

---

## Related Documents

- `docs/CurriculumSystem.md` — The knowledge base AI uses
- `docs/Architecture.md` — API routes for AI features
- `docs/Roadmap.md` — When AI features land
- `knowledge/README.md` — How the knowledge base is structured for AI use
