-- Notifications pour les élèves (ex. notes publiées)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

alter table public.notifications enable row level security;

-- L'utilisateur ne voit et ne met à jour que ses propres notifications
create policy "Notifications select own"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "Notifications update own"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- L'insert se fait côté serveur (service_role) pour créer les notifications quand le prof enregistre les notes
comment on table public.notifications is 'Notifications destinées aux élèves (ex. notes publiées pour un contrôle).';
