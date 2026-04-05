ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT false;

ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS is_first_login boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS students_roll_number_unique_idx
ON public.students (roll_number)
WHERE roll_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS teachers_nid_unique_idx
ON public.teachers (nid)
WHERE nid IS NOT NULL;

CREATE INDEX IF NOT EXISTS students_user_id_idx ON public.students (user_id);
CREATE INDEX IF NOT EXISTS teachers_user_id_idx ON public.teachers (user_id);

DROP POLICY IF EXISTS "Anon can lookup student email for login" ON public.students;
DROP POLICY IF EXISTS "Anon can lookup teacher email for login" ON public.teachers;

CREATE OR REPLACE FUNCTION public.next_student_login_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number bigint;
BEGIN
  PERFORM pg_advisory_xact_lock(2026001);

  SELECT GREATEST(COALESCE(MAX(roll_number::bigint), 2026000), 2026000) + 1
  INTO next_number
  FROM public.students
  WHERE roll_number ~ '^[0-9]+$';

  RETURN next_number::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.next_teacher_login_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_number integer;
BEGIN
  PERFORM pg_advisory_xact_lock(2026002);

  SELECT COALESCE(MAX((regexp_match(nid, '^T-(\\d+)$'))[1]::integer), 0) + 1
  INTO next_number
  FROM public.teachers
  WHERE nid ~ '^T-(\\d+)$';

  RETURN 'T-' || LPAD(next_number::text, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_access_context()
RETURNS TABLE(user_role public.app_role, login_id text, is_first_login boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH role_cte AS (
    SELECT public.get_user_role(auth.uid()) AS role_value
  )
  SELECT
    role_cte.role_value AS user_role,
    CASE
      WHEN role_cte.role_value = 'student' THEN s.roll_number
      WHEN role_cte.role_value = 'teacher' THEN t.nid
      ELSE NULL
    END AS login_id,
    CASE
      WHEN role_cte.role_value = 'student' THEN COALESCE(s.is_first_login, false)
      WHEN role_cte.role_value = 'teacher' THEN COALESCE(t.is_first_login, false)
      ELSE false
    END AS is_first_login
  FROM role_cte
  LEFT JOIN public.students s
    ON role_cte.role_value = 'student'
   AND s.user_id = auth.uid()
  LEFT JOIN public.teachers t
    ON role_cte.role_value = 'teacher'
   AND t.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.complete_first_login()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_rows integer := 0;
  updated_rows integer := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.students
  SET is_first_login = false
  WHERE user_id = auth.uid()
    AND is_first_login = true;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  affected_rows := affected_rows + updated_rows;

  UPDATE public.teachers
  SET is_first_login = false
  WHERE user_id = auth.uid()
    AND is_first_login = true;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  affected_rows := affected_rows + updated_rows;

  RETURN affected_rows > 0;
END;
$$;