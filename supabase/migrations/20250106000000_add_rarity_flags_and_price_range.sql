-- Migracja: flagi cech banknotu oraz górna granica przedziału ceny zakupu.
-- Uruchom w Supabase → SQL Editor (albo: supabase db push).
--
--   unc             - stan zachowania UNC (niezależna flaga)
--   bardzo_rzadki   - banknot bardzo rzadki (niezależna flaga)
--   rzadki          - banknot rzadki (niezależna flaga)
--   cena_zakupu_do  - górna granica przedziału ceny zakupu (dolna to cena_zakupu)
--
-- Flagi są niezależne: banknot może być jednocześnie UNC i rzadki itd.
-- (stan zachowania i rzadkość to dwa różne wymiary).

alter table items add column if not exists unc boolean default false;
alter table items add column if not exists bardzo_rzadki boolean default false;
alter table items add column if not exists rzadki boolean default false;
alter table items add column if not exists cena_zakupu_do numeric;

-- Uzupełnij istniejące rekordy (null → false).
update items set unc = false where unc is null;
update items set bardzo_rzadki = false where bardzo_rzadki is null;
update items set rzadki = false where rzadki is null;

notify pgrst, 'reload schema';
