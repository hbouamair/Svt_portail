-- SVT Notes — schéma initial Supabase
-- Exécuter dans le SQL Editor du dashboard Supabase (https://app.supabase.com)

-- Extension UUID
create extension if not exists "uuid-ossp";

-- Profils (lié à auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'teacher', 'student')),
  created_at timestamptz default now()
);

-- Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Élèves par classe (many-to-many)
create table if not exists public.class_students (
  class_id uuid references public.classes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (class_id, user_id)
);

-- Notes
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  exam_name text not null,
  note numeric(4,2) not null check (note >= 0 and note <= 20),
  date date not null,
  coefficient numeric(3,2) default 1,
  unique(class_id, student_id, exam_name)
);

-- Corrections (PDF)
create table if not exists public.corrections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  class_id uuid references public.classes(id) on delete set null,
  file_path text not null,
  file_name text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  uploaded_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.class_students enable row level security;
alter table public.grades enable row level security;
alter table public.corrections enable row level security;

-- Profils : tout utilisateur connecté peut lire
create policy "Profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);

-- Profils : les teachers/admins peuvent insérer (création élève) et mettre à jour
create policy "Profiles insert by teacher or admin"
  on public.profiles for insert to authenticated
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'teacher'))
  );
create policy "Profiles update by teacher or admin"
  on public.profiles for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'teacher')));

-- Classes : teachers/admins CRUD, students read only their classes
create policy "Classes all for teacher admin"
  on public.classes for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'teacher')));
create policy "Classes read for students in class"
  on public.classes for select to authenticated
  using (
    exists (select 1 from public.class_students cs where cs.class_id = classes.id and cs.user_id = auth.uid())
  );

-- Class_students : teachers/admins CRUD
create policy "Class_students for teacher admin"
  on public.class_students for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'teacher')));

-- Grades : teachers/admins CRUD, students read own
create policy "Grades for teacher admin"
  on public.grades for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'teacher')));
create policy "Grades read own for students"
  on public.grades for select to authenticated
  using (student_id = auth.uid());

-- Corrections : teachers/admins CRUD, students read (all or by class)
create policy "Corrections for teacher admin"
  on public.corrections for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'teacher')));
create policy "Corrections readable by authenticated"
  on public.corrections for select to authenticated using (true);

-- Trigger : créer un profil après signup (optionnel, si vous utilisez Supabase Auth signUp)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Stockage : bucket pour les PDF
-- Dans le dashboard Supabase → Storage : créer un bucket nommé "corrections".
-- Politique recommandée (exemple) : "Allow authenticated uploads"
--   INSERT avec (bucket_id = 'corrections' AND auth.role() = 'authenticated')
--   SELECT avec (bucket_id = 'corrections') pour lecture publique ou authentifiée
