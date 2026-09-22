# `collectionApi` jako jedyny właściciel Supabase

Status: resolved
Oryginalna pozycja listy: A5

## Problem

`collectionApi.js` deklarował w komentarzu, że jest „JEDYNYM miejscem, które zna
tabele/bucket Supabase". Nie był:

- `lib/uploadPhoto.js` znał bucket `photos` i tabelę `item_photos`,
- `collectionApi` importował z niego `getStoragePathFromUrl` — więc moduły były
  sprzężone w obie strony,
- komponenty importowały kod dotykający Supabase z dwóch różnych miejsc
  (`collectionApi` i `lib/uploadPhoto`), a `lib/` sugeruje czyste narzędzia.

Konkretne duplikaty:

| Co | Przed | Po |
| -- | ----- | -- |
| `PHOTO_TYPES` | 2 definicje | 1 |
| nazwa bucketu `'photos'` | 3 wystąpienia | 1 stała `PHOTOS_BUCKET` |
| `getStoragePathFromUrl` | eksportowany, 1 użycie | prywatny |

## Rozwiązanie

Zdjęcia przeniesione do `collectionApi` w sekcję `/* --- Zdjęcia: Storage --- */`.
`lib/uploadPhoto.js` usunięty. Formularze importują zdjęcia z `collectionApi`,
tak jak resztę danych.

`lib/compressForUpload.js` **zostaje** w `lib/` — jest czysto przeglądarkowy i nie
wie nic o Supabase. Ładowany dynamicznym `import()`, więc nie wchodzi do bundla
startowego (osobny chunk ~52 kB, bez zmian; `index` urósł o 0,12 kB).

## Zmiana semantyki — świadoma

Przy usuwaniu pozycji błąd kasowania pliku ze Storage był **po cichu pomijany**,
a `deletePhoto` w tym samym module rzucało. Dwie sprzeczne zasady.

Teraz oba rzucają. Uzasadnienie: pliki kasujemy **przed** wierszami, więc jeśli
Storage zawiedzie, wpis zostaje i da się ponowić. W odwrotnej kolejności plik
zostałby sierotą — kosztującą miejsce i niewidoczną z aplikacji, bo nic już nie
prowadzi do jego ścieżki.

Koszt: nieudane kasowanie pliku blokuje teraz usunięcie pozycji. Uznane za
mniejsze zło niż ciche sieroty.

## Commit

`9d94788`

## Comments

Weryfikacja: `deletePhoto` w widoku edycji przy zablokowanym Storage → poszło
`DELETE object/photos`, żądanie odbite, wiersz **nie** skasowany, zdjęcie nadal
widoczne. Czyli nowa semantyka i kolejność operacji działają.

Interfejs modułu: wszystkie 10 oryginalnych eksportów zachowane, 3 funkcje zdjęć
przeniesione, `getStoragePathFromUrl` świadomie sprywatyzowany (0 zewnętrznych
użytkowników — sprawdzone grepem po całym repo).

**Nie zweryfikowano:** `removeItem` nie został wywołany (wymagałby usunięcia
prawdziwej pozycji). To jedyne miejsce, w którym zmieniłem semantykę błędu —
przeczytane, ale nie wykonane.

**Odrzucona alternatywa:** najpierw proponowałem nową warstwę abstrakcji nad
`supabase.storage`. Odrzucone jako abstrakcja dla samej abstrakcji — problemem
nie był brak warstwy, tylko niesprecyzowana granica.
