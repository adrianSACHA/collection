-- Tabela główna: przedmioty kolekcji (banknoty i monety)
create table items (
  id uuid primary key default gen_random_uuid(),
  typ text check (typ in ('banknot','moneta')),
  kraj text,
  nominal text,
  rok integer,
  stan text,
  wariant text,
  unikat boolean default false,
  uwagi text,
  cena_zakupu numeric,
  data_zakupu date,
  sprzedawca text,
  wartosc_aktualna numeric,
  wartosc_aktualizacja date,
  lokalizacja text,
  status text default 'do_uzupelnienia',
  utworzone_przez text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela: zdjęcia (awers/rewers)
create table item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete cascade,
  typ text check (typ in ('awers','rewers')),
  url text not null,
  created_at timestamp with time zone default now()
);

-- Indeksy dla wydajności
create index idx_items_status on items(status);
create index idx_items_typ on items(typ);
create index idx_item_photos_item_id on item_photos(item_id);

-- Trigger do automatycznego updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_items_updated_at
  before update on items
  for each row
  execute function update_updated_at_column();