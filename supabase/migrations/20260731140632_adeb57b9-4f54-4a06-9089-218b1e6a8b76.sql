-- 1. TEACHERS: remove blanket authenticated SELECT
DROP POLICY IF EXISTS "Authenticated can view teachers" ON public.teachers;

CREATE POLICY "Admins can view all teacher data"
  ON public.teachers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can view own record"
  ON public.teachers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_teacher_directory()
RETURNS TABLE(id uuid, full_name text, subject text, department text, class_assigned text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT t.id, t.full_name, t.subject, t.department, t.class_assigned
  FROM public.teachers t
  WHERE auth.uid() IS NOT NULL
  ORDER BY t.full_name
$$;

REVOKE ALL ON FUNCTION public.get_teacher_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_teacher_directory() TO authenticated, service_role;

-- 2. STUDENTS: teachers get a limited roster instead of full records
DROP POLICY IF EXISTS "Teachers can view students" ON public.students;

CREATE OR REPLACE FUNCTION public.get_student_roster(_class text DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  full_name text,
  roll_number text,
  current_class text,
  section text,
  student_group text,
  guardian_name text,
  guardian_phone text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT s.id, s.full_name, s.roll_number, s.current_class, s.section,
         s.student_group, s.guardian_name, s.guardian_phone
  FROM public.students s
  WHERE (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'teacher'::app_role)
    )
    AND (_class IS NULL OR s.current_class = _class)
  ORDER BY s.roll_number
$$;

REVOKE ALL ON FUNCTION public.get_student_roster(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_roster(text) TO authenticated, service_role;

-- 3. NOTICES: public visitors only see safe columns
DROP POLICY IF EXISTS "Anyone can view notices" ON public.notices;

CREATE POLICY "Signed in users can view notices"
  ON public.notices FOR SELECT TO authenticated
  USING (true);

CREATE OR REPLACE FUNCTION public.get_public_notices(_limit integer DEFAULT 20)
RETURNS TABLE(id uuid, title text, description text, image_url text, created_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT n.id, n.title, n.description, n.image_url, n.created_at
  FROM public.notices n
  ORDER BY n.created_at DESC
  LIMIT GREATEST(LEAST(COALESCE(_limit, 20), 100), 1)
$$;

GRANT EXECUTE ON FUNCTION public.get_public_notices(integer) TO anon, authenticated, service_role;

-- 4. MESSAGES: validate roles server-side
ALTER TABLE public.messages
  ADD CONSTRAINT valid_sender_role CHECK (sender_role IN ('admin','teacher','student','guardian')),
  ADD CONSTRAINT valid_receiver_role CHECK (receiver_role IN ('admin','teacher','student','guardian'));

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages with valid role"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role::app_role = public.get_user_role(auth.uid())
    AND receiver_role::app_role = public.get_user_role(receiver_id)
  );

-- 5. SECURITY DEFINER function exposure
REVOKE ALL ON FUNCTION public.bootstrap_first_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.complete_first_login() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_first_login() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_current_user_access_context() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_access_context() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_message_directory() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_message_directory() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, app_role) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.next_student_login_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_student_login_id() TO service_role;

REVOKE ALL ON FUNCTION public.next_teacher_login_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.next_teacher_login_id() TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;