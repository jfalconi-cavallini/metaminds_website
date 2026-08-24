-- Migration 035: Grant parents read access to student_plans and student_plan_lessons
-- Parents have linked_id = their child's student_id, matching the student RLS pattern.

-- ── student_plans ─────────────────────────────────────────────────────────────
alter policy "student_plans_select" on student_plans
  using (
    is_admin()
    or (my_role() = 'student' and student_id = my_linked_id())
    or (my_role() = 'parent'  and student_id = my_linked_id())
    or (my_role() = 'tutor'   and tutor_id   = my_linked_id())
  );

-- ── student_plan_lessons ──────────────────────────────────────────────────────
-- Check existing policy name — it was created in 019_curriculum_cms.sql
-- The SELECT policy allows student + tutor; we extend it to include parent.
drop policy if exists "plan_lessons_select" on student_plan_lessons;

create policy "plan_lessons_select" on student_plan_lessons
  for select to authenticated
  using (
    is_admin()
    or exists (
      select 1 from student_plans sp
      where sp.id = plan_id
        and (
          (my_role() = 'student' and sp.student_id = my_linked_id())
          or (my_role() = 'parent'  and sp.student_id = my_linked_id())
          or (my_role() = 'tutor'   and sp.tutor_id   = my_linked_id())
        )
    )
  );
