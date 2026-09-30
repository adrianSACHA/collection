-- Migracja: kolumna `koncowka_serii` (litera końcowa numeru banknotu).
-- Uruchom w Supabase → SQL Editor (albo: supabase db push).
--
--   koncowka_serii - litera występująca po numerze KN (i ewentualnej gwiazdce),
--                    np. „A" w „123456 ✻ A". Dotyczy wyłącznie banknotów.
--
-- Kolumna była już używana przez formularz, listę i eksport CSV, ale nie miała
-- własnej migracji ani wpisu w supabase/schema.sql. `if not exists` czyni
-- migrację bezpieczną do powtórzenia, jeśli kolumna została już dodana ręcznie
-- w SQL Editorze (dzięki temu nie nadpisze istniejących danych).

alter table items add column if not exists koncowka_serii text;

notify pgrst, 'reload schema';
