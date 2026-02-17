-- Ajout du flag « premier mot de passe » pour les élèves
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

comment on column public.profiles.must_change_password is 'Si true, l''utilisateur (élève) doit définir un nouveau mot de passe à la première connexion.';

-- Permettre à un utilisateur de mettre à jour son propre profil (pour must_change_password uniquement en pratique)
create policy "Profiles update own"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
