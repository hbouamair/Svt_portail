-- Bucket "corrections" pour les PDF (corrections d'examens).
-- Si l'insert ne fonctionne pas (schéma storage), créez le bucket à la main :
-- Dashboard Supabase → Storage → New bucket → nom "corrections", Public = true.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('corrections', 'corrections', true, 52428800)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Politiques : enseignants/admins peuvent uploader, tout le monde peut lire (URLs publiques).
DROP POLICY IF EXISTS "Corrections bucket: upload by teacher/admin" ON storage.objects;
CREATE POLICY "Corrections bucket: upload by teacher/admin"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'corrections'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher'))
  );

DROP POLICY IF EXISTS "Corrections bucket: public read" ON storage.objects;
CREATE POLICY "Corrections bucket: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'corrections');

DROP POLICY IF EXISTS "Corrections bucket: delete by teacher/admin" ON storage.objects;
CREATE POLICY "Corrections bucket: delete by teacher/admin"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'corrections'
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'teacher'))
  );
