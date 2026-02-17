-- =============================================================================
-- Connexion à l'app (si les users ont été créés avec npm run seed) :
--   Enseignant : abdelmajid.bouamair@svt.local  /  SvtNotes2025!
--   Élèves    : hamza.bouamair@svt.local, abdelkbir.bouamair@svt.local  /  SvtNotes2025!
-- =============================================================================
--
-- =============================================================================
-- 1) Vérifier les utilisateurs : exécute cette ligne et regarde le résultat.
--    Si tu vois 0 lignes → va dans Authentication → Users → Add user (x3).
-- =============================================================================
-- SELECT id, email, raw_user_meta_data FROM auth.users;


-- =============================================================================
-- 2) Remplir profiles à partir de TOUS les utilisateurs déjà dans auth.users
--    (à exécuter après avoir créé les 3 users dans Authentication)
-- =============================================================================
INSERT INTO public.profiles (id, name, email, role)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', email),
  email,
  COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;


-- =============================================================================
-- 3) Mettre les bons noms et rôles pour nos 3 comptes
-- =============================================================================
UPDATE public.profiles SET name = 'Abdelmajid Bouamair', role = 'teacher' WHERE email = 'abdelmajid.bouamair@svt.local';
UPDATE public.profiles SET name = 'Hamza Bouamair', role = 'student' WHERE email = 'hamza.bouamair@svt.local';
UPDATE public.profiles SET name = 'Abdelkbir Bouamair', role = 'student' WHERE email = 'abdelkbir.bouamair@svt.local';
