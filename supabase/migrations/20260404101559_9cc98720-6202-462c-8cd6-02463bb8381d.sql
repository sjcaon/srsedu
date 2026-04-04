
-- Add trigger for auto-creating profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add unique constraint on profiles.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Add foreign keys for attendance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_student_id_fkey') THEN
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint on attendance(student_id, date) if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_student_id_date_key') THEN
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_id_date_key UNIQUE (student_id, date);
  END IF;
END $$;

-- Add foreign keys for results
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_student_id_fkey') THEN
    ALTER TABLE public.results ADD CONSTRAINT results_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_exam_id_fkey') THEN
    ALTER TABLE public.results ADD CONSTRAINT results_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint on results(student_id, exam_id) if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'results_student_id_exam_id_key') THEN
    ALTER TABLE public.results ADD CONSTRAINT results_student_id_exam_id_key UNIQUE (student_id, exam_id);
  END IF;
END $$;

-- Add foreign keys for fee_payments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_payments_student_id_fkey') THEN
    ALTER TABLE public.fee_payments ADD CONSTRAINT fee_payments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fee_payments_fee_id_fkey') THEN
    ALTER TABLE public.fee_payments ADD CONSTRAINT fee_payments_fee_id_fkey FOREIGN KEY (fee_id) REFERENCES public.fee_structures(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key for students.guardian_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'students_guardian_id_fkey') THEN
    ALTER TABLE public.students ADD CONSTRAINT students_guardian_id_fkey FOREIGN KEY (guardian_id) REFERENCES public.guardians(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add foreign key for routines.teacher_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'routines_teacher_id_fkey') THEN
    ALTER TABLE public.routines ADD CONSTRAINT routines_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE SET NULL;
  END IF;
END $$;
