-- Add family_theme to profiles (controls the UI accent color for the family group)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS family_theme VARCHAR(20) DEFAULT 'default';
