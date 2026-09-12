-- Migracja: usunięcie zbędnej kolumny `numer_katalogowy`.
-- Uruchom w Supabase → SQL Editor (albo: supabase db push).
--
-- UWAGA: usunięcie kolumny jest nieodwracalne (dane przepadają).
-- Jeśli chcesz zachować kopię ewentualnych danych, odkomentuj poniższe:
--   create table items_backup_numer_katalogowy as
--     select id, numer_katalogowy from items;

alter table items drop column if exists numer_katalogowy;

notify pgrst, 'reload schema';
