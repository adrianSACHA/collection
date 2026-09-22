# Scalony cykl życia przygotowywanego zdjęcia

Status: resolved
Oryginalna pozycja listy: A3

## Problem

`PhotoPicker` (pełny formularz) i `PhotoCapture` (szybkie dodawanie) trzymały dwa
równoległe, ręcznie pisane cykle życia zdjęcia: tworzenie i rewokacje object
URL-i, oryginał do kadrowania, sprzątanie przy odmontowaniu. Duplikacja sama
w sobie byłaby znośna, ale obie kopie **zachowywały się inaczej**.

## Rozwiązanie

`src/hooks/useStagedPhoto.js` — jeden hook, trzy role, które łatwo pomylić:
`file` (do wgrania), `previewUrl` (to, co widać), `originalUrl` (źródło
kadrowania). Hook jest też jedynym właścicielem object URL-i.

`PhotoCapture` używa dwóch instancji (awers, rewers), więc zniknęły bliźniacze
bloki `if/else` z każdego handlera.

## Błędy naprawione przy okazji

1. **Kadrowanie zjadało jakość** (tylko szybkie dodawanie). `PhotoCapture`
   kadrował z poprzedniego kadru, `PhotoPicker` z oryginału — dwie różne
   implementacje tego samego. Przy powtarzanym przycinaniu obraz tracił piksele,
   a po dwóch obrotach o 90° wychodził poza kadr bez możliwości oddalenia.
   Teraz oba kadrują od oryginału.
2. **Zdjęcie tylko rewersu nie trafiało do uploadu.** `emitPhotos` wymagał awersu
   (`if (nextAwers && ...)`), choć `uploadItemPhotos` go nie wymaga i sam pomija
   brakujące strony. Komentarz w kodzie głosił, że „awers jest wymagany do
   zapisu", co było nieprawdą.
3. **„Popraw zdjęcie" rewersu nie czyściło pliku u rodzica.** Handler dla rewersu
   nie wołał `onPhotosReady` — skasowane zdjęcie nadal szło do uploadu.

Zamiast łatać trzy miejsca, emisja do rodzica jest teraz efektem zależnym od obu
plików, więc nie da się o niej zapomnieć w pojedynczym handlerze.

Kontrakt z rodzicem się zmienił: `QuickAddForm` dostaje teraz `{ awers: File|null,
rewers: File|null }` zamiast obiektów z podglądem. Object URL zostaje własnością
komponentu, który go zwalnia — rodzic nie może trzymać adresu, który zaraz
przestanie istnieć.

## Commit

`885be81`

## Comments

Testy przez Playwright z zablokowanymi zapisami do bazy. Obserwowalnym sygnałem,
że rodzic dostał zgłoszenie, było zniknięcie komunikatu błędu — `handlePhotosReady`
woła `clearFeedback()`. Błąd wymuszałem blokadą zapisu (500), więc nic nie
zapisywało się do kolekcji.

| Sprawdzenie | Wynik |
| ----------- | ----- |
| podmiana zdjęcia zwalnia stary URL | tak |
| „Popraw zdjęcie" zwalnia podgląd | tak |
| po kadrowaniu oryginał nadal żywy | tak |
| drugie kadrowanie bierze oryginał, nie poprzedni kadr | tak |
| usunięcie zdjęcia zwalnia oba URL-e | tak |
| rewers-only dociera do rodzica | tak |
| „Popraw" rewersu dociera do rodzica | tak |

**Wyciek, który sam wprowadziłem i złapał test.** Pierwsza wersja hooka miała
guard `revoke(url, keep)`, który pomijał *oba* wywołania, gdy podgląd i oryginał
to ten sam adres (świeżo wybrane zdjęcie) — czyli nigdy nie zwalniał URL-a.
Sonda `fetch()` na starym adresie zwróciła `false`. Warto zostawiać sobie taki
test: to nie było widoczne ani w UI, ani w linterze.
