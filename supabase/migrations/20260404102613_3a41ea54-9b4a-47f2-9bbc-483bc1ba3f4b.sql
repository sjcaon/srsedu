-- Allow anon to look up student email by roll_number for login
CREATE POLICY "Anon can lookup student email for login"
ON public.students
FOR SELECT
TO anon
USING (true);

-- Allow anon to look up teacher email by nid for login
CREATE POLICY "Anon can lookup teacher email for login"
ON public.teachers
FOR SELECT
TO anon
USING (true);