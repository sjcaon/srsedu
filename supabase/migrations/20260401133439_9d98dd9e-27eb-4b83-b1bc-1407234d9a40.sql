
-- Routines table
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  period_number INTEGER NOT NULL,
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage routines" ON public.routines FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view routines" ON public.routines FOR SELECT TO authenticated USING (true);

-- Fee structures table
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fee_structures" ON public.fee_structures FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can view fee_structures" ON public.fee_structures FOR SELECT TO authenticated USING (true);

-- Fee payments table
CREATE TABLE public.fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage fee_payments" ON public.fee_payments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Students can view own fee_payments" ON public.fee_payments FOR SELECT TO authenticated USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Guardians can view ward fee_payments" ON public.fee_payments FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.guardian_id IN (SELECT g.id FROM guardians g WHERE g.user_id = auth.uid())));

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL,
  receiver_id UUID NOT NULL,
  receiver_role TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  read_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can mark as read" ON public.messages FOR UPDATE TO authenticated USING (receiver_id = auth.uid());
CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Add unique constraint for attendance upsert
CREATE UNIQUE INDEX IF NOT EXISTS attendance_student_date_idx ON public.attendance(student_id, date);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
