-- Schemat kolekcji numizmatycznej (monety i banknoty).
-- UWAGA: to referencyjny pełny schemat. Zmiany na istniejącej bazie
-- wprowadzaj migracjami z supabase/migrations/ (ALTER TABLE), nie przez
-- ponowne uruchamianie tego pliku na istniejącej bazie.

-- Tabela główna: przedmioty kolekcji (banknoty i monety)
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) default auth.uid(),
    typ text check (typ in ('banknot','moneta')),
  kraj text not null,
  nominal text,
  rok integer,
  data_wydania date,
  -- pola wspólne
    wariant text,
    ilosc integer default 1,
    unikat boolean default false,
    do_kupienia boolean default false,
        unc boolean default false,
    bardzo_rzadki boolean default false,
        rzadki boolean default false,
    gwiazdka_przed boolean default false,
    gwiazdka_za boolean default false,
    uwagi text,
  -- monety
  naklad text,
  mennica text,
  material text,
  waga_g numeric,
  srednica_mm numeric,
    -- banknoty
  miasto_wydania text,
  seria text,
  kn_seria text,
  nadruk text,
  kod_drukarni text,
  znak_wodny text,
  -- ewidencja
  cena_zakupu numeric,
  cena_zakupu_do numeric,
  data_zakupu date,
    sprzedawca text,
  wartosc_aktualna numeric,
  wartosc_aktualizacja date,
  lokalizacja text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela: zdjęcia (awers/rewers/znak wodny)
create table if not exists item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade,
  typ text check (typ in ('awers','rewers','znak_wodny')),
  url text not null,
  created_at timestamp with time zone default now()
);

-- Indeksy dla wydajności
create index if not exists idx_items_typ on items(typ);
create index if not exists idx_items_user_id on items(user_id);
create index if not exists idx_item_photos_item_id on item_photos(item_id);

-- Trigger do automatycznego updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_items_updated_at on items;
create trigger update_items_updated_at
  before update on items
  for each row
  execute function update_updated_at_column();

-- =====================================================================
-- RLS: każdy użytkownik widzi i modyfikuje wyłącznie swoje pozycje.
-- =====================================================================
alter table items enable row level security;
alter table item_photos enable row level security;

drop policy if exists "items_select_own" on items;
create policy "items_select_own" on items
  for select using (auth.uid() = user_id);

drop policy if exists "items_insert_own" on items;
create policy "items_insert_own" on items
  for insert with check (auth.uid() = user_id);

drop policy if exists "items_update_own" on items;
create policy "items_update_own" on items
  for update using (auth.uid() = user_id);

drop policy if exists "items_delete_own" on items;
create policy "items_delete_own" on items
  for delete using (auth.uid() = user_id);

drop policy if exists "photos_select_own" on item_photos;
create policy "photos_select_own" on item_photos
  for select using (
    exists (
      select 1 from items
      where items.id = item_photos.item_id and items.user_id = auth.uid()
    )
  );

drop policy if exists "photos_write_own" on item_photos;
create policy "photos_write_own" on item_photos
  for all using (
    exists (
      select 1 from items
      where items.id = item_photos.item_id and items.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from items
      where items.id = item_photos.item_id and items.user_id = auth.uid()
    )
  );