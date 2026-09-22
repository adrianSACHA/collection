# `DesktopSidebar` renderuje treść dwukrotnie

Status: needs-triage
Oryginalna pozycja listy: —

## Co zaobserwowałem

`DesktopSidebar` w jednym drzewie DOM trzyma dwie wersje swojej treści —
zwiniętą i rozwiniętą — i przełącza je CSS-em. Widać to w liście przycisków:

```
"Zwiń panel boczny", "Banknoty37", "Monety85", "+ Szybko dodaj banknot",
"Pełny formularz", "Filtry", "⬇ Eksport CSV (37)", "Wyloguj",
"Rozwiń panel boczny", "Banknoty (37)", "Monety (85)", "Filtry",
"Szybko dodaj banknot", "Wyloguj"
```

Czyli: dwa razy nawigacja, dwa razy „Wyloguj", dwa razy „Filtry".

## Dlaczego to zgłaszam

1. **Drzewo dostępności.** Ukryta kopia jest najpewniej `display:none`, więc
   czytnik jej nie zobaczy — ale nie sprawdziłem tego przez CDP i nie chcę
   zakładać. Jeśli ukrycie jest zrobione szerokością albo `opacity`, obie kopie
   są dla czytnika widoczne i użytkownik słyszy nawigację dwa razy.
2. **Koszty ukryte w testach.** Przy testach zmyliło mnie to dwa razy:
   `getByRole('button', { name: 'Pełny formularz' })` trafiało w niewidoczną
   kopię i kończyło się timeoutem, choć przycisk „był". Każdy kolejny test tej
   strony będzie się o to potykał.
3. **Koszt DOM.** Druga kopia to realne węzły i druga instancja panelu filtrów
   w drzewie.

## Czego nie wiem

Nie wiem, czy to zabieg celowy. Jeśli tak — najpewniej po to, żeby animacja
zwijania nie przeliczała układu od nowa (dwie wersje o różnej szerokości
przełączane klasą). Taka technika bywa świadoma, więc **nie ruszałem tego**.

Jeśli jest celowa, wystarczy ją udokumentować komentarzem i zostawić. Jeśli nie —
da się to zrobić jedną wersją treści i klasami na szerokościach.

## Proponowany następny krok

Sprawdzić przez CDP, czy ukryta kopia jest `ignored: true`. To rozstrzyga, czy
problem jest realny i dotyczy użytkowników, czy wyłącznie testów. Dopiero potem
decyzja o refaktorze.
