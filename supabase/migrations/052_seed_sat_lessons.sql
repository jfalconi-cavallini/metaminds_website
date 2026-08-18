-- Migration 052: Seed all SAT Prep lesson stubs
-- Adds all 59 missing lessons across 8 SAT category modules.
-- "Text Structure and Purpose" and "Words in Context" already exist from migration 022 — skipped.
-- Uses WHERE NOT EXISTS on (module_id, title) — safe to re-run.
-- Creates 7 placeholder lesson_resource slots for every lesson that has none.

do $$
declare
  v_sat_id  integer;
  v_cs_id   integer;   -- Craft and Structure
  v_ei_id   integer;   -- Expression of Ideas
  v_ii_id   integer;   -- Information and Ideas
  v_sec_id  integer;   -- Standard English Conventions
  v_alg_id  integer;   -- Algebra
  v_adv_id  integer;   -- Advanced Math
  v_geo_id  integer;   -- Geometry and Trigonometry
  v_psda_id integer;   -- Problem Solving and Data Analysis
begin
  select id into v_sat_id from courses where title = 'SAT Prep';
  if v_sat_id is null then
    raise exception 'SAT Prep course not found — run migration 022 first.';
  end if;

  select id into v_cs_id   from modules where course_id = v_sat_id and title = 'Craft and Structure';
  select id into v_ei_id   from modules where course_id = v_sat_id and title = 'Expression of Ideas';
  select id into v_ii_id   from modules where course_id = v_sat_id and title = 'Information and Ideas';
  select id into v_sec_id  from modules where course_id = v_sat_id and title = 'Standard English Conventions';
  select id into v_alg_id  from modules where course_id = v_sat_id and title = 'Algebra';
  select id into v_adv_id  from modules where course_id = v_sat_id and title = 'Advanced Math';
  select id into v_geo_id  from modules where course_id = v_sat_id and title = 'Geometry and Trigonometry';
  select id into v_psda_id from modules where course_id = v_sat_id and title = 'Problem Solving and Data Analysis';

  -- ── INSERT ALL MISSING LESSONS ───────────────────────────────────
  -- Uses a join on module_id + title to skip any that already exist.

  insert into lessons (module_id, title, description, difficulty, estimated_minutes, status, position)
  select v.module_id, v.title, v.description, v.difficulty, 60, 'draft', v.position
  from (values

    -- ── CRAFT AND STRUCTURE ────────────────────────────────────────
    -- "Text Structure and Purpose" (pos 1) and "Words in Context" (pos 2) already exist.
    (v_cs_id,   'Cross-Text Connections',
     'Students read two related texts and analyze the relationship between them, determining how the authors agree, disagree, or build on each other.',
     3, 0),

    -- ── EXPRESSION OF IDEAS ────────────────────────────────────────
    (v_ei_id,   'Rhetorical Synthesis',
     'Students integrate information from multiple notes or sources into a single coherent sentence that fulfills a stated rhetorical goal.',
     3, 0),
    (v_ei_id,   'Sentence Combining',
     'Students combine two related sentences into one grammatically correct sentence without changing the intended meaning.',
     2, 1),
    (v_ei_id,   'Transitions',
     'Students select the transition word or phrase that most logically connects two sentences or ideas within a passage.',
     2, 2),

    -- ── INFORMATION AND IDEAS ──────────────────────────────────────
    (v_ii_id,   'Central Ideas and Details',
     'Students identify the main idea of a passage or paragraph and determine which details best support or illustrate it.',
     2, 0),
    (v_ii_id,   'Command of Textual Evidence',
     'Students find the quotation or detail from the passage that best supports a given claim or that illustrates what a previous answer choice states.',
     3, 1),
    (v_ii_id,   'Command of Quantitative Evidence',
     'Students interpret data from a table, chart, or graph and select the textual claim that the data most directly supports or undermines.',
     3, 2),
    (v_ii_id,   'Inferences',
     'Students determine what a passage most logically or reasonably implies, going one step beyond what is explicitly stated.',
     3, 3),

    -- ── STANDARD ENGLISH CONVENTIONS ──────────────────────────────
    (v_sec_id,  'Sentence Boundaries',
     'Students identify and correct run-on sentences, comma splices, and sentence fragments by selecting appropriate punctuation or conjunctions.',
     2, 0),
    (v_sec_id,  'Commas',
     'Students apply comma rules for introductory elements, lists, nonrestrictive clauses, and compound sentences.',
     2, 1),
    (v_sec_id,  'Semicolons and Colons',
     'Students use semicolons to join independent clauses and colons to introduce lists, explanations, or elaborations.',
     2, 2),
    (v_sec_id,  'Dashes and Parentheses',
     'Students use dashes and parentheses to set off nonessential information, interrupting elements, or supplementary asides within a sentence.',
     2, 3),
    (v_sec_id,  'Subject-Verb Agreement',
     'Students ensure verbs agree in number with their subjects, including cases with intervening phrases, compound subjects, or inverted sentence structures.',
     2, 4),
    (v_sec_id,  'Pronoun Agreement',
     'Students choose pronouns that agree in number and gender with their antecedents and ensure pronoun reference is clear and unambiguous.',
     2, 5),
    (v_sec_id,  'Verb Tense and Form',
     'Students select the correct verb tense and form to maintain consistency and accurately convey time relationships within a passage.',
     2, 6),
    (v_sec_id,  'Modifiers',
     'Students identify and correct dangling and misplaced modifiers so that each modifier is clearly and logically attached to the noun it describes.',
     3, 7),
    (v_sec_id,  'Parallelism',
     'Students ensure items in a list or comparison use consistent grammatical form, and recognize parallelism errors in compound structures.',
     3, 8),

    -- ── ALGEBRA ────────────────────────────────────────────────────
    (v_alg_id,  'Variables and Expressions',
     'Students evaluate and simplify algebraic expressions, apply the distributive property, combine like terms, and translate between words and algebraic notation.',
     1, 0),
    (v_alg_id,  'Linear Equations in One Variable',
     'Students solve linear equations in one variable, including those with fractions, decimals, variables on both sides, and no-solution or infinite-solution cases.',
     2, 1),
    (v_alg_id,  'Linear Equations in Two Variables',
     'Students interpret and work with linear equations in two variables — finding intercepts, graphing lines, and understanding the relationship between slope, intercepts, and context.',
     2, 2),
    (v_alg_id,  'Linear Inequalities',
     'Students solve linear inequalities in one or two variables, interpret solution sets, and correctly reverse the inequality sign when multiplying or dividing by a negative.',
     2, 3),
    (v_alg_id,  'Slope-Intercept Form',
     'Students work with equations in slope-intercept form, interpret slope and y-intercept in context, and determine equations from graphs or tables.',
     2, 4),
    (v_alg_id,  'Writing Linear Equations',
     'Students write linear equations from two points, a point and slope, or contextual information — including parallel and perpendicular line scenarios.',
     2, 5),
    (v_alg_id,  'Systems of Equations: Substitution',
     'Students solve systems of two linear equations using the substitution method and interpret solutions in context.',
     2, 6),
    (v_alg_id,  'Systems of Equations: Elimination',
     'Students solve systems of two linear equations using the elimination method, choosing when elimination is more efficient than substitution.',
     2, 7),
    (v_alg_id,  'Systems of Equations: Word Problems',
     'Students translate real-world scenarios into systems of equations, solve them, and interpret the solution within the context of the problem.',
     3, 8),
    (v_alg_id,  'Absolute Value',
     'Students solve absolute value equations and inequalities, interpret absolute value in context, and recognize no-solution cases.',
     3, 9),

    -- ── ADVANCED MATH ──────────────────────────────────────────────
    (v_adv_id,  'Factoring: Greatest Common Factor',
     'Students factor out the greatest common factor from polynomial expressions and recognize when GCF factoring is the first step in a multi-step problem.',
     2, 0),
    (v_adv_id,  'Factoring: Trinomials',
     'Students factor quadratic trinomials of the form ax² + bx + c, including cases where a ≠ 1, using grouping and the product-sum method.',
     2, 1),
    (v_adv_id,  'Quadratic Functions',
     'Students analyze quadratic functions in standard, vertex, and factored forms — identifying vertex, axis of symmetry, roots, and interpreting graphs.',
     2, 2),
    (v_adv_id,  'Quadratic Formula',
     'Students apply the quadratic formula to solve equations, interpret the discriminant to determine the number and type of solutions, and connect to graphical behavior.',
     3, 3),
    (v_adv_id,  'Completing the Square',
     'Students convert quadratic expressions to vertex form by completing the square, and use this method to solve quadratic equations and identify the vertex.',
     3, 4),
    (v_adv_id,  'Polynomial Functions',
     'Students analyze polynomial functions — identifying end behavior, zeros (with multiplicity), and the relationship between factored form and graph crossings or touches.',
     3, 5),
    (v_adv_id,  'Radical Equations',
     'Students solve equations containing square roots or other radicals, check for extraneous solutions, and simplify radical expressions.',
     3, 6),
    (v_adv_id,  'Rational Equations',
     'Students solve equations with rational (fractional) expressions, identify restrictions on the variable, and check for extraneous solutions.',
     3, 7),
    (v_adv_id,  'Exponential Functions',
     'Students interpret exponential growth and decay models, work with equations of the form y = ab^x, and recognize exponential behavior in tables and graphs.',
     3, 8),
    (v_adv_id,  'Function Notation',
     'Students evaluate and interpret function notation f(x), compose functions, determine domain and range, and answer questions about function behavior from tables or graphs.',
     2, 9),
    (v_adv_id,  'Function Transformations',
     'Students identify and describe translations, reflections, stretches, and compressions of function graphs and connect transformations to changes in the function equation.',
     3, 10),
    (v_adv_id,  'Complex Numbers',
     'Students perform arithmetic with complex numbers (add, subtract, multiply, divide) and simplify expressions involving i, including powers of i.',
     4, 11),

    -- ── GEOMETRY AND TRIGONOMETRY ──────────────────────────────────
    (v_geo_id,  'Angles',
     'Students work with angle relationships including complementary, supplementary, vertical, parallel line transversals, and interior/exterior angles of polygons.',
     1, 0),
    (v_geo_id,  'Area and Perimeter',
     'Students calculate area and perimeter of triangles, rectangles, circles, and composite figures, and apply formulas in real-world and coordinate contexts.',
     1, 1),
    (v_geo_id,  'Triangle Properties',
     'Students apply triangle properties including angle sum, exterior angle theorem, triangle inequality, isosceles properties, and special right triangles (30-60-90, 45-45-90).',
     2, 2),
    (v_geo_id,  'Pythagorean Theorem',
     'Students apply the Pythagorean theorem to find missing side lengths in right triangles and determine whether a triangle is right, acute, or obtuse.',
     2, 3),
    (v_geo_id,  'Similarity and Proportions',
     'Students use properties of similar triangles to set up and solve proportions, and apply scale factor reasoning in geometric contexts.',
     2, 4),
    (v_geo_id,  'Coordinate Geometry',
     'Students apply the distance and midpoint formulas, find equations of lines, and work with circles and other figures in the coordinate plane.',
     2, 5),
    (v_geo_id,  'Circles',
     'Students work with circle properties including arc length, sector area, central and inscribed angles, chords, tangents, and the standard form of a circle equation.',
     3, 6),
    (v_geo_id,  'Volume and Surface Area',
     'Students calculate volume and surface area of prisms, cylinders, cones, spheres, and pyramids, applying formulas to real-world and multi-step problems.',
     2, 7),
    (v_geo_id,  'Right Triangle Trigonometry',
     'Students apply sine, cosine, and tangent ratios (SOH-CAH-TOA) to find missing sides and angles in right triangles, and solve real-world applications.',
     3, 8),
    (v_geo_id,  'Unit Circle',
     'Students identify coordinate pairs on the unit circle for key angles, connect them to sine and cosine values, and recognize basic trigonometric identities.',
     4, 9),

    -- ── PROBLEM SOLVING AND DATA ANALYSIS ─────────────────────────
    (v_psda_id, 'Ratios and Proportions',
     'Students set up and solve ratio and proportion problems, including part-to-part and part-to-whole relationships, in real-world contexts.',
     2, 0),
    (v_psda_id, 'Unit Rates',
     'Students calculate and compare unit rates, convert between units, and solve rate problems involving speed, cost, and density.',
     1, 1),
    (v_psda_id, 'Percentages',
     'Students solve percent problems including percent increase/decrease, percent of a whole, and reverse-percent scenarios (finding the original amount).',
     2, 2),
    (v_psda_id, 'Data Interpretation',
     'Students read and interpret data from tables, bar graphs, pie charts, and histograms to answer questions and draw conclusions.',
     2, 3),
    (v_psda_id, 'Mean, Median, and Mode',
     'Students calculate measures of central tendency, interpret them in context, determine the effect of adding or removing data points, and identify when each measure is most appropriate.',
     2, 4),
    (v_psda_id, 'Scatterplots',
     'Students interpret scatterplots — identifying trends, reading lines of best fit, making predictions, and determining the strength and direction of correlations.',
     2, 5),
    (v_psda_id, 'Two-Variable Data',
     'Students analyze two-variable datasets in tables and graphs, interpret slope and intercept of linear models in context, and connect rate of change to real-world scenarios.',
     2, 6),
    (v_psda_id, 'Statistical Claims',
     'Students evaluate the validity of statistical conclusions — identifying sampling methods, recognizing when data supports or fails to support a claim, and understanding the limits of generalizability.',
     3, 7),
    (v_psda_id, 'Probability',
     'Students calculate theoretical and conditional probability, interpret probability in context, and use two-way tables to find joint and marginal probabilities.',
     2, 8),
    (v_psda_id, 'Counting Methods',
     'Students apply counting principles including multiplication rule, combinations, and permutations to determine the number of possible outcomes in a scenario.',
     3, 9)

  ) as v(module_id, title, description, difficulty, position)
  where not exists (
    select 1 from lessons l where l.module_id = v.module_id and l.title = v.title
  );

  -- ── PLACEHOLDER RESOURCES FOR ALL LESSONS THAT HAVE NONE ────────
  -- Covers both the newly inserted lessons and any pre-existing ones without resources.

  insert into lesson_resources (lesson_id, type, label, position)
  select l.id, r.type, r.label, r.pos
  from lessons l
  join modules m on m.id = l.module_id and m.course_id = v_sat_id
  cross join (values
    ('lesson_deck',     'Lesson Deck',      0),
    ('guided_practice', 'Guided Practice',  1),
    ('homework_l1',     'Homework Level 1', 2),
    ('homework_l2',     'Homework Level 2', 3),
    ('homework_l3',     'Homework Level 3', 4),
    ('answer_key',      'Answer Key',       5),
    ('mastery_check',   'Mastery Check',    6)
  ) as r(type, label, pos)
  where not exists (
    select 1 from lesson_resources lr where lr.lesson_id = l.id
  );

  raise notice 'Migration 052 complete — SAT lesson stubs seeded.';
end $$;
