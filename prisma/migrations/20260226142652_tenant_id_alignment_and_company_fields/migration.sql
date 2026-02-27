-- Align tenant identifier naming and add required company/location/store columns
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.columns
    WHERE column_name = 'company_id'
      AND table_schema = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I RENAME COLUMN company_id TO tenant_id;', r.table_schema, r.table_name);
  END LOOP;
END;
$$;

-- Ensure companies carry geography/industry fields expected by Prisma schema
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS industry text NOT NULL DEFAULT 'retail';

-- Optional geo fields on locations
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS currency text;

-- Optional geo fields on stores
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS currency text;
