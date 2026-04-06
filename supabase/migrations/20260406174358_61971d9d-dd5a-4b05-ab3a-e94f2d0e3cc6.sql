ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_relation text,
  ADD COLUMN IF NOT EXISTS guardian_phone text,
  ADD COLUMN IF NOT EXISTS guardian_occupation text,
  ADD COLUMN IF NOT EXISTS guardian_address text;