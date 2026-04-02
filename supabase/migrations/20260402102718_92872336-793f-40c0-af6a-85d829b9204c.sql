BEGIN;

-- Ensure RLS is enabled on all app tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Add missing uniqueness rules
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_user_id_key'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_user_id_key'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendance_student_id_date_key'
      AND conrelid = 'public.attendance'::regclass
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_student_id_date_key UNIQUE (student_id, date);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'results_student_id_exam_id_key'
      AND conrelid = 'public.results'::regclass
  ) THEN
    ALTER TABLE public.results
      ADD CONSTRAINT results_student_id_exam_id_key UNIQUE (student_id, exam_id);
  END IF;
END
$$;

-- Add missing foreign keys between ERP tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'students_guardian_id_fkey'
      AND conrelid = 'public.students'::regclass
  ) THEN
    ALTER TABLE public.students
      ADD CONSTRAINT students_guardian_id_fkey
      FOREIGN KEY (guardian_id) REFERENCES public.guardians(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendance_student_id_fkey'
      AND conrelid = 'public.attendance'::regclass
  ) THEN
    ALTER TABLE public.attendance
      ADD CONSTRAINT attendance_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'results_student_id_fkey'
      AND conrelid = 'public.results'::regclass
  ) THEN
    ALTER TABLE public.results
      ADD CONSTRAINT results_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'results_exam_id_fkey'
      AND conrelid = 'public.results'::regclass
  ) THEN
    ALTER TABLE public.results
      ADD CONSTRAINT results_exam_id_fkey
      FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'routines_teacher_id_fkey'
      AND conrelid = 'public.routines'::regclass
  ) THEN
    ALTER TABLE public.routines
      ADD CONSTRAINT routines_teacher_id_fkey
      FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fee_payments_student_id_fkey'
      AND conrelid = 'public.fee_payments'::regclass
  ) THEN
    ALTER TABLE public.fee_payments
      ADD CONSTRAINT fee_payments_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fee_payments_fee_id_fkey'
      AND conrelid = 'public.fee_payments'::regclass
  ) THEN
    ALTER TABLE public.fee_payments
      ADD CONSTRAINT fee_payments_fee_id_fkey
      FOREIGN KEY (fee_id) REFERENCES public.fee_structures(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Helpful indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_students_guardian_id ON public.students(guardian_id);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_user_id_unique ON public.students(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guardians_user_id ON public.guardians(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_guardians_user_id_unique ON public.guardians(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_user_id_unique ON public.teachers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_results_student_exam ON public.results(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_routines_class_day_period ON public.routines(class, day_of_week, period_number);
CREATE INDEX IF NOT EXISTS idx_fee_payments_student_id ON public.fee_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON public.messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_created ON public.messages(sender_id, created_at DESC);

-- Keep profile timestamps current
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Secure bootstrap for the first admin account
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(_user_id uuid)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_role public.app_role;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RETURN public.get_user_role(_user_id);
  END IF;

  SELECT public.get_user_role(_user_id) INTO existing_role;
  IF existing_role IS NOT NULL THEN
    RETURN existing_role;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

    RETURN 'admin';
  END IF;

  RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin(uuid) TO authenticated;

-- Secure role assignment helper for the admin dashboard
CREATE OR REPLACE FUNCTION public.set_user_role(_user_id uuid, _role public.app_role)
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can manage roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id)
  DO UPDATE SET role = EXCLUDED.role;

  RETURN _role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, public.app_role) TO authenticated;

-- Safe user directory for messaging UI
CREATE OR REPLACE FUNCTION public.get_message_directory()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  role public.app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    COALESCE(NULLIF(BTRIM(p.full_name), ''), 'Unnamed User') AS full_name,
    ur.role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE p.user_id <> auth.uid()
  ORDER BY COALESCE(NULLIF(BTRIM(p.full_name), ''), 'Unnamed User');
$$;

GRANT EXECUTE ON FUNCTION public.get_message_directory() TO authenticated;

-- Rebuild policies with explicit checks
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "All authenticated can view teachers" ON public.teachers;

CREATE POLICY "Authenticated can view teachers"
ON public.teachers
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert teachers"
ON public.teachers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update teachers"
ON public.teachers
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete teachers"
ON public.teachers
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Guardians can view wards" ON public.students;
DROP POLICY IF EXISTS "Students can view own" ON public.students;
DROP POLICY IF EXISTS "Teachers can view students" ON public.students;

CREATE POLICY "Admins can view students"
ON public.students
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update students"
ON public.students
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete students"
ON public.students
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view students"
ON public.students
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view own student record"
ON public.students
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Guardians can view linked students"
ON public.students
FOR SELECT
TO authenticated
USING (
  guardian_id IN (
    SELECT g.id FROM public.guardians g WHERE g.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage guardians" ON public.guardians;
DROP POLICY IF EXISTS "Guardians can view own" ON public.guardians;

CREATE POLICY "Admins can view guardians"
ON public.guardians
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert guardians"
ON public.guardians
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update guardians"
ON public.guardians
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete guardians"
ON public.guardians
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Guardians can view own guardian record"
ON public.guardians
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Guardians can view ward attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;

CREATE POLICY "Admins can manage attendance"
ON public.attendance
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage attendance"
ON public.attendance
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view own attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Guardians can view ward attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id
    FROM public.students s
    JOIN public.guardians g ON g.id = s.guardian_id
    WHERE g.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Anyone authenticated can view exams" ON public.exams;

CREATE POLICY "Authenticated can view exams"
ON public.exams
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert exams"
ON public.exams
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update exams"
ON public.exams
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete exams"
ON public.exams
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage results" ON public.results;
DROP POLICY IF EXISTS "Guardians can view ward results" ON public.results;
DROP POLICY IF EXISTS "Students can view own results" ON public.results;
DROP POLICY IF EXISTS "Teachers can manage results" ON public.results;

CREATE POLICY "Admins can manage results"
ON public.results
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage results"
ON public.results
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view own results"
ON public.results
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Guardians can view ward results"
ON public.results
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id
    FROM public.students s
    JOIN public.guardians g ON g.id = s.guardian_id
    WHERE g.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage routines" ON public.routines;
DROP POLICY IF EXISTS "Authenticated can view routines" ON public.routines;

CREATE POLICY "Authenticated can view routines"
ON public.routines
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage routines"
ON public.routines
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage routines"
ON public.routines
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'teacher'))
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

DROP POLICY IF EXISTS "Admins can manage fee_structures" ON public.fee_structures;
DROP POLICY IF EXISTS "Authenticated can view fee_structures" ON public.fee_structures;

CREATE POLICY "Authenticated can view fee structures"
ON public.fee_structures
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage fee structures"
ON public.fee_structures
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage fee_payments" ON public.fee_payments;
DROP POLICY IF EXISTS "Guardians can view ward fee_payments" ON public.fee_payments;
DROP POLICY IF EXISTS "Students can view own fee_payments" ON public.fee_payments;

CREATE POLICY "Admins can manage fee payments"
ON public.fee_payments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own fee payments"
ON public.fee_payments
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM public.students s WHERE s.user_id = auth.uid()
  )
);

CREATE POLICY "Guardians can view ward fee payments"
ON public.fee_payments
FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id
    FROM public.students s
    JOIN public.guardians g ON g.id = s.guardian_id
    WHERE g.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage notices" ON public.notices;
DROP POLICY IF EXISTS "Anyone can view notices" ON public.notices;

CREATE POLICY "Anyone can view notices"
ON public.notices
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage notices"
ON public.notices
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can mark as read" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;

CREATE POLICY "Admins can manage all messages"
ON public.messages
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Receivers can update read status"
ON public.messages
FOR UPDATE
TO authenticated
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contacts;

CREATE POLICY "Admins can view contacts"
ON public.contacts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit contact"
ON public.contacts
FOR INSERT
TO public
WITH CHECK (true);

COMMIT;