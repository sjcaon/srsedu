-- The contacts INSERT WITH CHECK (true) is intentional for public contact forms
-- But let's restrict it to only INSERT (no update/delete for anonymous)
-- The existing policy is already INSERT-only, so this is fine as-is

-- No changes needed - the warning is about INSERT WITH CHECK (true) on contacts
-- which is the correct pattern for public contact forms
SELECT 1;