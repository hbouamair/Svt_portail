-- Permettre aux élèves de lire leurs propres inscriptions (class_students)
-- pour que dbGetClasses remplisse correctement studentIds et que les corrections
-- s'affichent côté élève (myClassIds = classes de l'élève).

CREATE POLICY "Class_students read own for students"
  ON public.class_students FOR SELECT TO authenticated
  USING (user_id = auth.uid());
