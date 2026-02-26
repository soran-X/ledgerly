-- Expand entries.category CHECK to include 'expense'
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'entries_category_check'
      AND conrelid = 'public.entries'::regclass
  ) THEN
    ALTER TABLE public.entries DROP CONSTRAINT entries_category_check;
  END IF;
END$$;

ALTER TABLE public.entries
  ADD CONSTRAINT entries_category_check
  CHECK (category IN ('income', 'bill', 'saving', 'expense'));

-- Expand assets.type CHECK to include 'investment'
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'assets_type_check'
      AND conrelid = 'public.assets'::regclass
  ) THEN
    ALTER TABLE public.assets DROP CONSTRAINT assets_type_check;
  END IF;
END$$;

ALTER TABLE public.assets
  ADD CONSTRAINT assets_type_check
  CHECK (type IN ('asset', 'liability', 'mortgage', 'investment'));
