# Dokończony seam uwierzytelniania

Status: resolved
Oryginalna pozycja listy: —

## Problem

Powstał `src/auth/authApi.js`, ale seam był w połowie drogi: `AuthGate` go
używał, a `Login` i `App` nadal sięgały do Supabase bezpośrednio. Zamiana
dostawcy auth wymagałaby więc zmian w komponentach — czyli seam nie spełniał
swojego jedynego zadania.

## Rozwiązanie

- `Login` → `signInWithPassword` z `authApi`.
- `App` → `signOut` z `authApi` (dwie ścieżki: sidebar i `MoreSheet`).
- Żaden komponent nie importuje już `lib/supabase`. Dane kolekcji zostają
  w `collectionApi`, który jest właścicielem tego klienta.
- Usunięty martwy `getUser` — nic go nie wołało (`collectionApi.createItem`
  korzysta z `supabase.auth.getUser()` bezpośrednio, bo tam Supabase jest
  legalny).
- Poprawione wcięcia w `AuthGate` i `Login` oraz komentarz w `MoreSheet`,
  który wskazywał na `supabase.auth.signOut()`.

## Commit

`5939c5a`

## Comments

Weryfikacja ekranu logowania bez utraty sesji: kopia `localStorage`, usunięcie
klucza `sb-*-auth-token`, przeładowanie → ekran logowania renderuje się poprawnie,
przywrócenie klucza → lista wraca. `Login` sprawdzony tylko po renderze.

**Nie zweryfikowano:** prawdziwego logowania i `signOut` — brak danych
dostępowych, a wylogowanie zablokowałoby dalsze testy aplikacji.
