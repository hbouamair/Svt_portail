-- 1) Ajouter la colonne must_change_password si elle n'existe pas (comme migration 002)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;

-- 2) Synchronise auth.users avec profiles : mettre must_change_password à false
--    pour les utilisateurs dont le profil a déjà must_change_password = false.
UPDATE auth.users u
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{must_change_password}',
  'false'::jsonb
)
FROM public.profiles p
WHERE p.id = u.id
  AND p.must_change_password = false
  AND (u.raw_user_meta_data->>'must_change_password') IS DISTINCT FROM 'false';
