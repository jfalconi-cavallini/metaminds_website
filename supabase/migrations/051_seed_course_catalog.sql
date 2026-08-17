-- Migration 051: Seed full course catalog
-- All new courses land as 'draft' — admins build them out before publishing to students.
-- SAT Prep was seeded in migration 022 and is skipped here.
-- Uses WHERE NOT EXISTS on title so this is safe to re-run.

insert into courses (subject, title, description, grade_levels, estimated_hours, status)
select v.subject, v.title, v.description, string_to_array(v.grade_levels, ','), v.estimated_hours, v.status
from (values

  -- ── TEST PREP ──────────────────────────────────────────────────
  ('ACT',     'ACT Prep',
   'Complete ACT preparation covering English, Math, Reading, and Science.',
   '9,10,11,12', 40, 'draft'),

  -- ── AP: SCIENCES ───────────────────────────────────────────────
  ('AP',      'AP Biology',
   'College-level biology covering evolution, genetics, cellular processes, and ecosystems.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP Chemistry',
   'College-level chemistry covering atomic structure, thermodynamics, kinetics, and electrochemistry.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP Environmental Science',
   'Environmental systems, pollution, climate change, and sustainability.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP Physics 1',
   'Algebra-based physics: mechanics, waves, and electric circuits.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP Physics 2',
   'Algebra-based physics: thermodynamics, optics, and modern physics.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP Physics C: Mechanics',
   'Calculus-based mechanics for students with a calculus background.',
   '11,12', 40, 'draft'),
  ('AP',      'AP Physics C: Electricity and Magnetism',
   'Calculus-based electricity and magnetism for students with a calculus background.',
   '11,12', 40, 'draft'),

  -- ── AP: MATH ───────────────────────────────────────────────────
  ('AP',      'AP Calculus AB',
   'Differential and integral calculus — equivalent to first-semester college calculus.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP Calculus BC',
   'Full-year college calculus including series, parametric, and polar functions.',
   '11,12', 40, 'draft'),
  ('AP',      'AP Statistics',
   'Data analysis, probability, statistical inference, and experimental design.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP Precalculus',
   'Functions, trigonometry, and mathematical modeling for college math readiness.',
   '9,10,11', 40, 'draft'),

  -- ── AP: COMPUTER SCIENCE ───────────────────────────────────────
  ('AP',      'AP Computer Science A',
   'Java programming: object-oriented design, algorithms, and data structures.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP Computer Science Principles',
   'Computational thinking, data, algorithms, and creative development.',
   '9,10,11,12', 40, 'draft'),

  -- ── AP: ENGLISH ────────────────────────────────────────────────
  ('AP',      'AP English Language and Composition',
   'Rhetoric, argumentation, and analytical writing.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP English Literature and Composition',
   'Literary analysis, close reading, and essay writing.',
   '11,12', 40, 'draft'),

  -- ── AP: HISTORY & SOCIAL SCIENCES ──────────────────────────────
  ('AP',      'AP US History',
   'American history from pre-colonial times through the present.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP World History: Modern',
   'Global history from 1200 CE to the present.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP European History',
   'European history from 1450 to the present.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP US Government and Politics',
   'Constitutional foundations, political beliefs, civil rights, and policy-making.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP Comparative Government and Politics',
   'Political systems and institutions across six countries.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP Human Geography',
   'Geographic concepts, population patterns, cultural geography, and land use.',
   '9,10', 40, 'draft'),
  ('AP',      'AP Macroeconomics',
   'National income, economic performance, inflation, monetary and fiscal policy.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP Microeconomics',
   'Supply, demand, market structure, cost theory, and consumer behavior.',
   '10,11,12', 40, 'draft'),
  ('AP',      'AP Psychology',
   'Scientific study of behavior and mental processes.',
   '10,11,12', 40, 'draft'),

  -- ── AP: LANGUAGES ──────────────────────────────────────────────
  ('AP',      'AP Spanish Language and Culture',
   'Spanish language proficiency in interpretive, interpersonal, and presentational modes.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP French Language and Culture',
   'French language proficiency across all communication modes.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP Chinese Language and Culture',
   'Mandarin Chinese proficiency across all communication modes.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP Japanese Language and Culture',
   'Japanese language proficiency across all communication modes.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP Latin',
   'Latin language and Roman literature including Vergil and Caesar.',
   '10,11,12', 40, 'draft'),

  -- ── AP: ARTS ───────────────────────────────────────────────────
  ('AP',      'AP Art History',
   'Visual arts analysis from prehistoric to contemporary across global cultures.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP Music Theory',
   'Music fundamentals: notation, harmony, counterpoint, and aural skills.',
   '9,10,11,12', 40, 'draft'),

  -- ── AP: SEMINAR & RESEARCH ─────────────────────────────────────
  ('AP',      'AP Seminar',
   'Interdisciplinary inquiry, research, collaboration, and argumentation.',
   '9,10,11,12', 40, 'draft'),
  ('AP',      'AP Research',
   'Advanced research methods, academic writing, and scholarly presentation.',
   '10,11,12', 40, 'draft'),

  -- ── MATH ───────────────────────────────────────────────────────
  ('Math',    'Elementary Math',
   'Foundational math for K–5: number sense, operations, fractions, measurement, and geometry.',
   'K,1,2,3,4,5', 20, 'draft'),
  ('Math',    'Middle School Math',
   'Core math for grades 6–8: ratios, expressions, equations, geometry, and statistics.',
   '6,7,8', 20, 'draft'),
  ('Math',    'Pre-Algebra',
   'Bridge from arithmetic to algebra: integers, fractions, percents, and intro to equations.',
   '6,7,8', 20, 'draft'),
  ('Math',    'Algebra 1',
   'Linear equations, inequalities, systems of equations, polynomials, and functions.',
   '7,8,9', 30, 'draft'),
  ('Math',    'Geometry',
   'Euclidean geometry, proofs, coordinate geometry, transformations, and trigonometry.',
   '8,9,10', 30, 'draft'),
  ('Math',    'Algebra 2',
   'Quadratics, polynomials, rational functions, logarithms, and conic sections.',
   '9,10,11', 30, 'draft'),
  ('Math',    'Pre-Calculus',
   'Functions, trigonometry, vectors, and analytic geometry — college math readiness.',
   '10,11,12', 30, 'draft'),
  ('Math',    'Calculus',
   'Differential and integral calculus for non-AP students.',
   '11,12', 40, 'draft'),

  -- ── CODING ─────────────────────────────────────────────────────
  ('Coding',  'Scratch — Beginner Coding',
   'Visual block-based programming for young learners. Build games, animations, and interactive stories.',
   'K,1,2,3,4,5,6', 15, 'draft'),
  ('Coding',  'Python Fundamentals',
   'Core Python: variables, loops, functions, and data structures for beginners.',
   '6,7,8,9,10,11,12', 25, 'draft'),
  ('Coding',  'Python Intermediate',
   'Object-oriented Python, file I/O, APIs, and introductory data science.',
   '8,9,10,11,12', 25, 'draft'),
  ('Coding',  'Java Programming',
   'Java fundamentals: object-oriented design, data structures, algorithms, and problem solving.',
   '8,9,10,11,12', 30, 'draft'),
  ('Coding',  'Web Development',
   'HTML, CSS, JavaScript, and responsive design — from zero to first live website.',
   '6,7,8,9,10,11,12', 25, 'draft'),

  -- ── ROBOTICS & ENGINEERING ─────────────────────────────────────
  ('Robotics','Arduino & Electronics',
   'Physical computing: circuits, sensors, actuators, and programming with Arduino.',
   '6,7,8,9,10,11,12', 20, 'draft'),
  ('Robotics','Robotics Fundamentals',
   'Robot design, sensors, motors, and programming for beginners.',
   '4,5,6,7,8', 20, 'draft'),
  ('Robotics','Advanced Robotics',
   'Autonomous systems, path planning, computer vision intro, and competition preparation.',
   '8,9,10,11,12', 30, 'draft'),

  -- ── GED ────────────────────────────────────────────────────────
  ('GED',     'GED Prep',
   'Comprehensive preparation for all four GED subjects: Mathematical Reasoning, Reasoning Through Language Arts, Science, and Social Studies.',
   'adult', 60, 'draft')

) as v(subject, title, description, grade_levels, estimated_hours, status)
where not exists (
  select 1 from courses c where c.title = v.title
);
