# Tło dialogów nie było `inert`

Status: resolved
Oryginalna pozycja listy: U2

## Problem

Dialogi (`Lightbox`, `CropModal`, `BottomSheet` — a przez niego `FilterModal`,
`MoreSheet`, `CollectionSwitcherSheet`) miały `role="dialog"` i `aria-modal="true"`,
a `useFocusTrap` pilnował cyklu Taba. Ale `aria-modal` nie robi nic sam z siebie:
to obietnica, którą implementacja musi spełnić. Tło nie było oznaczone, więc
czytnik ekranu mógł kursorem wirtualnym wyjść poza dialog i przeczytać listę pod
spodem. WCAG 2.4.3 (Focus Order), wzorzec modalny ARIA APG.

## Rozwiązanie

Nowy `src/hooks/useInertBackground.js`. Trzy decyzje, które warto znać:

1. **Dlaczego spacer po drzewie.** Dialogi nie są portalowane do `document.body`,
   więc „tło" to nie jeden kontener, tylko całe rodzeństwo na ścieżce od dialogu
   w górę do `<body>`. Hook przechodzi tę ścieżkę i oznacza każdy napotkany
   element rodzeństwa.
2. **Licznik uwięzień.** Dialog może zawierać dialog (kadrowanie otwarte wewnątrz
   bottom sheeta). Bez licznika zamknięcie `CropModal` zdejmowałoby `inert`
   z tła wciąż otwartego sheeta.
3. **Kolejność efektów jest istotna.** Hook jest wywoływany jako *pierwszy* efekt
   w każdym dialogu. React sprząta efekty w kolejności deklaracji, a `focus()` na
   elemencie `inert` nie działa — więc `inert` musi zniknąć, zanim pułapka
   przywróci focus na trigger.

`ToastProvider` dostał `data-inert-exempt`: `inert` implikuje `aria-hidden`, więc
bez tego wyjątku komunikat pod modalem nie dotarłby do czytnika.

## Commit

`0178ae1`

## Comments

Weryfikacja przez drzewo dostępności Chromium (`Accessibility.getFullAXTree`
i `getPartialAXTree` przez CDP), nie przez sam atrybut:

| Dialog | tło | toast | focus po Esc |
| ------ | --- | ----- | ------------ |
| FilterModal | `ignored: true` | `role=status`, `ignored: false` | „Filtry" |
| Lightbox | `ignored: true` | — | miniatura |
| CropModal | `ignored: true` | — | „Przytnij zdjęcie awersu" |
| MoreSheet | `ignored: true` | — | „Więcej" |

Po zamknięciu każdego: 0 dialogów, 0 osieroconych `inert`.

Uwaga dla następnego agenta: snapshot Playwrighta (`browser_snapshot`) **nie
odzwierciedla** `inert` — dalej pokazuje tło. Trzeba pytać drzewo dostępności
przez CDP, inaczej test wygląda na nieprzechodzący.
