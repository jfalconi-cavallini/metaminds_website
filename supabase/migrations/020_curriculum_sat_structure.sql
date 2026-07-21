-- ================================================================
-- Migration 020: SAT-aligned curriculum structure
--
-- 1. Adds parent_id to modules → enables Section → Category nesting
-- 2. Expands lesson_resources.type to support structured lesson packages
-- 3. Seeds the full SAT course hierarchy + one example lesson package
-- ================================================================

-- ── 1. PARENT_ID ON MODULES ──────────────────────────────────────
-- null = top-level section (Reading & Writing, Math)
-- set  = category under a section (Craft and Structure, Algebra, …)

alter table modules
  add column if not exists parent_id integer references modules(id) on delete cascade;

create index if not exists idx_modules_parent_id on modules(parent_id);

-- ── 2. LESSON RESOURCE TYPES ─────────────────────────────────────
-- Drop the old restrictive check and replace with the full set.
-- Old types are kept so existing rows remain valid.

alter table lesson_resources
  drop constraint if exists lesson_resources_type_check;

alter table lesson_resources
  add constraint lesson_resources_type_check
  check (type in (
    -- Structured lesson package types (new)
    'lesson_deck',
    'guided_practice',
    'tutor_guide',
    'homework_l1',
    'homework_l2',
    'homework_l3',
    'answer_key',
    'mastery_check',
    -- Legacy generic types (kept for backwards compatibility)
    'slides',
    'worksheet',
    'homework_pdf',
    'video',
    'kami_link',
    'external'
  ));

-- ── 3. SEED SAT COURSE STRUCTURE ─────────────────────────────────
-- Only runs if SAT Prep does not already exist.

do $$
declare
  v_sat_id   integer;
  v_rw_id    integer;
  v_math_id  integer;
  v_cs_id    integer;
  v_lesson_id integer;
begin
  if exists (select 1 from courses where subject = 'SAT') then
    -- SAT course already created by admin — skip seed
    return;
  end if;

  -- Course
  insert into courses (subject, title, description, grade_levels, estimated_hours, status)
  values (
    'SAT',
    'SAT Prep',
    'Complete SAT preparation covering Reading & Writing and Math, targeting scores from 1100 to 1600.',
    array['9','10','11','12'],
    40,
    'active'
  )
  returning id into v_sat_id;

  -- Top-level sections (parent_id IS NULL)
  insert into modules (course_id, title, description, position)
  values (v_sat_id, 'Reading & Writing',
    'Covers all Reading & Writing domains: Craft and Structure, Expression of Ideas, Information and Ideas, Standard English Conventions.',
    0)
  returning id into v_rw_id;

  insert into modules (course_id, title, description, position)
  values (v_sat_id, 'Math',
    'Covers all Math domains: Algebra, Advanced Math, Geometry and Trigonometry, Problem Solving and Data Analysis.',
    1)
  returning id into v_math_id;

  -- Reading & Writing categories
  insert into modules (course_id, parent_id, title, description, position)
  values (v_sat_id, v_rw_id, 'Craft and Structure',
    'Text Structure and Purpose, Words in Context, Cross-Text Connections.',
    0)
  returning id into v_cs_id;

  insert into modules (course_id, parent_id, title, description, position)
  values (v_sat_id, v_rw_id, 'Expression of Ideas',
    'Rhetorical Synthesis, Transitions.',
    1);

  insert into modules (course_id, parent_id, title, description, position)
  values (v_sat_id, v_rw_id, 'Information and Ideas',
    'Central Ideas and Details, Command of Evidence, Inferences.',
    2);

  insert into modules (course_id, parent_id, title, description, position)
  values (v_sat_id, v_rw_id, 'Standard English Conventions',
    'Boundaries, Form/Structure/Sense.',
    3);

  -- Math categories
  insert into modules (course_id, parent_id, title, description, position)
  values (v_sat_id, v_math_id, 'Algebra',
    'Linear equations, inequalities, systems of equations, linear functions.',
    0);

  insert into modules (course_id, parent_id, title, description, position)
  values (v_sat_id, v_math_id, 'Advanced Math',
    'Quadratics, polynomials, exponential functions, rational equations.',
    1);

  insert into modules (course_id, parent_id, title, description, position)
  values (v_sat_id, v_math_id, 'Geometry and Trigonometry',
    'Area, volume, angles, triangles, circles, trigonometric functions.',
    2);

  insert into modules (course_id, parent_id, title, description, position)
  values (v_sat_id, v_math_id, 'Problem Solving and Data Analysis',
    'Ratios, proportions, percentages, statistics, probability, scatter plots.',
    3);

  -- ── EXAMPLE LESSON: Text Structure and Purpose ──
  insert into lessons (
    module_id, title, description, difficulty, estimated_minutes,
    learning_objectives, common_mistakes, status, position
  )
  values (
    v_cs_id,
    'Text Structure and Purpose',
    'Students identify how authors organize texts and determine the purpose of specific paragraphs or structural choices within a passage.',
    2, 60,
    array[
      'Identify the overall organizational structure of a passage (chronological, compare/contrast, cause/effect, problem/solution)',
      'Determine the purpose of a specific paragraph or section within the larger text',
      'Recognize how an author''s structural choices contribute to meaning and argument'
    ],
    'Students often confuse "what the paragraph says" with "why the author placed it here." Push them to think about function, not just content.',
    'draft',
    0
  )
  returning id into v_lesson_id;

  -- Placeholder resource slots (url = null until admin uploads)
  insert into lesson_resources (lesson_id, type, label, position) values
    (v_lesson_id, 'lesson_deck',     'Lesson Deck — Text Structure and Purpose', 0),
    (v_lesson_id, 'guided_practice', 'Guided Practice',                           1),
    (v_lesson_id, 'homework_l1',     'Homework Level 1 — Foundations',            2),
    (v_lesson_id, 'homework_l2',     'Homework Level 2 — Standard SAT',           3),
    (v_lesson_id, 'homework_l3',     'Homework Level 3 — Advanced SAT',           4),
    (v_lesson_id, 'answer_key',      'Answer Key — All Levels',                   5),
    (v_lesson_id, 'mastery_check',   'Mastery Check',                             6);

  -- Second lesson stub in same category
  insert into lessons (module_id, title, description, difficulty, estimated_minutes, status, position)
  values (
    v_cs_id,
    'Words in Context',
    'Students determine the precise meaning of words and phrases as used in context and choose the most effective word for a given purpose.',
    2, 60, 'draft', 1
  );

end $$;
