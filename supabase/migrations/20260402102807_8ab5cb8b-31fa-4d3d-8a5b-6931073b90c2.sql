BEGIN;

DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contacts;

CREATE POLICY "Anyone can submit contact"
ON public.contacts
FOR INSERT
TO public
WITH CHECK (
  NULLIF(BTRIM(name), '') IS NOT NULL
  AND NULLIF(BTRIM(email), '') IS NOT NULL
  AND NULLIF(BTRIM(message), '') IS NOT NULL
);

COMMIT;