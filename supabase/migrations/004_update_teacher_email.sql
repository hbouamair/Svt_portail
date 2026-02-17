-- Change teacher Abdelmajid email to abdelmajid.bouamair@gmail.com
-- (Login uses auth.users; profiles is for display in the app.)

-- 1) Auth: so login with the new email works
UPDATE auth.users
SET email = 'abdelmajid.bouamair@gmail.com',
    raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{email}',
      '"abdelmajid.bouamair@gmail.com"'
    )
WHERE email = 'abdelmajid.bouamair@svt.local';

-- 2) Profiles: so the app shows the new email
UPDATE public.profiles
SET email = 'abdelmajid.bouamair@gmail.com'
WHERE email = 'abdelmajid.bouamair@svt.local'
   OR (name = 'Abdelmajid Bouamair' AND role = 'teacher');
