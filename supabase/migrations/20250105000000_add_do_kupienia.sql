-- Migracja: flaga "do kupienia" dla pozycji kolekcji.
-- Uruchom w Supabase → SQL Editor (albo: supabase db push).
--
--   do_kupienia - czy pozycja jest na liście "do kupienia" (np. banknot, który
--                 chcesz dopiero nabyć). Domyślnie false.

alter table items add column if not exists do_kupienia boolean default false;

-- Uzupełnij istniejące rekordy (null → false).
update items set do_kupienia = false where do_kupienia is null;

notify pgrst, 'reload schema';
