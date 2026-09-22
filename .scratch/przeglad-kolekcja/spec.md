# Przegląd kodu: kolekcja (React + Supabase)

Status: resolved
Type: task

## Czego dotyczy

Przegląd całej aplikacji w dwóch osiach, prowadzony sekwencyjnie — najpierw
Standardy, potem Spec:

- **Standardy** — jakość kodu, zapachy, granice modułów, martwy kod.
- **Spec** — czy zaimplementowane zachowanie odpowiada temu, co miało być.

Dostępność i użyteczność przechodziły przez obie osie (WCAG 2.x + heurystyki
Nielsena), bo dotykają zarówno jakości kodu, jak i zgodności z intencją.

Punkt stały: `8cd3108`. Prace wcześniejsze z tego samego przeglądu leżą
w historii między `22c9944` a `8cd3108`.

## Czego ten katalog nie zawiera

Pozycje listy (oznaczenia `A*` i `U*`) powstały w rozmowie i nigdy nie zostały
zapisane jako pliki — ten katalog jest pierwszą ich utrwaloną formą.

Konsekwencje, o których warto wiedzieć:

- Numery plików w `issues/` są nadane od nowa, od `01`. Oryginalny
  identyfikator podaję w każdym pliku, ale tylko tam, gdzie dało się go ustalić
  z pewnością — nigdy nie zgaduję.
- Pozycje z wcześniejszej części przeglądu (przed `0178ae1`) **nie mają tu
  plików**. Nie da się ich wiarygodnie odtworzyć, a wymyślanie kryteriów
  akceptacji po fakcie byłoby gorsze niż ich brak. Ich śladem jest historia
  `git log 22c9944..8cd3108`.

## Stan

| # | Pozycja | Oryg. | Status |
| - | ------- | ----- | ------ |
| 01 | Tło dialogów nie było `inert` | U2 | resolved |
| 02 | Fokus nie wracał na przycisk „Filtry" | — | resolved |
| 03 | Scalony cykl życia przygotowywanego zdjęcia | A3 | resolved |
| 04 | `collectionApi` jako jedyny właściciel Supabase | A5 | resolved |
| 05 | Toasty: role, warstwa żywa pod modalem, kontrast | U7 | resolved |
| 06 | Dokończony seam uwierzytelniania | — | resolved |
| 07 | Regresja wizualna: przyciski 44 px a nagłówek sheeta | U6 | needs-info |
| 08 | `DesktopSidebar` renderuje treść dwukrotnie | — | needs-triage |

## Czego nie zweryfikowano end-to-end

Wszystkie testy w tej sesji biegły z zablokowanymi zapisami do Supabase
(przepuszczane tylko GET/HEAD), żeby nie dotknąć prawdziwej kolekcji. Pokryte
jest więc wywołanie i kolejność operacji, ale nie to, co faktycznie ląduje
w bucketcie `photos` i w tabeli `item_photos`.

Nie wykonano też pełnego zapisu pozycji ze zdjęciem. Wymaga zapisania śmieciowej
pozycji do kolekcji i posprzątania po niej — do zrobienia na wyraźne
potwierdzenie.

## Uwaga o narzędziach

Narzędzia edycyjne użyte w tej sesji dwa razy zapisały do pliku treść niezwiązaną
z kodem: własny tekst rozumowania w `Lightbox.jsx` oraz `use State(` (spacja
w środku) w `App.jsx`. Objawy były ciche — narzędzie raportowało sukces.

Wszystkie uszkodzenia naprawiono, pliki przejrzano przed commitem i build
przechodzi. Ale commity `0178ae1` i `5939c5a` powstały, zanim to wykryto
i zanim zacząłem obchodzić edytor plikami tymczasowymi — warto je przejrzeć
samodzielnie. Reszta (`885be81`, `9d94788`) jest już wolna od tego ryzyka.
